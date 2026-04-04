import os
import urllib.request

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision


class FaceDetector:
    """Face detector using MediaPipe FaceDetector on rotated image variants."""

    _ANGLES = (-30, -15, 0, 15, 30)
    MIN_FACE_PX = 40
    MAX_CANDIDATES = 200
    MAX_FACES = 10
    NMS_IOU_THRESHOLD = 0.35
    _MODEL_URL = (
        "https://storage.googleapis.com/mediapipe-models/face_detector/"
        "blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
    )

    def __init__(self):
        model_path = os.path.join(
            os.path.dirname(__file__), "models", "blaze_face_short_range.tflite"
        )
        self._ensure_model(model_path)

        options = vision.FaceDetectorOptions(
            base_options=mp_python.BaseOptions(model_asset_path=model_path),
            min_detection_confidence=0.25,
        )
        self.face_detector = vision.FaceDetector.create_from_options(options)

    def _ensure_model(self, model_path):
        if os.path.exists(model_path):
            return

        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        urllib.request.urlretrieve(self._MODEL_URL, model_path)

    @staticmethod
    def _clamp_px(x1, y1, x2, y2, w, h):
        x1 = int(np.clip(x1, 0, w - 1))
        y1 = int(np.clip(y1, 0, h - 1))
        x2 = int(np.clip(x2, 0, w - 1))
        y2 = int(np.clip(y2, 0, h - 1))
        return x1, y1, x2, y2

    @staticmethod
    def _iou(box_a, box_b):
        ax1, ay1, ax2, ay2 = box_a
        bx1, by1, bx2, by2 = box_b

        inter_x1 = max(ax1, bx1)
        inter_y1 = max(ay1, by1)
        inter_x2 = min(ax2, bx2)
        inter_y2 = min(ay2, by2)

        inter_w = max(0, inter_x2 - inter_x1)
        inter_h = max(0, inter_y2 - inter_y1)
        inter_area = inter_w * inter_h

        area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
        area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
        union = area_a + area_b - inter_area

        if union <= 0:
            return 0.0

        return inter_area / union

    def _nms(self, candidates, iou_threshold=0.4):
        kept = []

        for candidate in sorted(candidates, key=lambda item: item["score"], reverse=True):
            if all(
                self._iou(candidate["bbox_px"], kept_face["bbox_px"]) <= iou_threshold
                for kept_face in kept
            ):
                kept.append(candidate)

        return kept

    @staticmethod
    def _rotate_image(image_bgr, angle_deg):
        h, w = image_bgr.shape[:2]
        center = (w / 2.0, h / 2.0)
        rot_mat = cv2.getRotationMatrix2D(center, angle_deg, 1.0)
        rotated = cv2.warpAffine(
            image_bgr,
            rot_mat,
            (w, h),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REPLICATE,
        )
        return rotated, rot_mat

    @staticmethod
    def _transform_points(points, affine_mat):
        transformed = []
        for x, y in points:
            tx = affine_mat[0, 0] * x + affine_mat[0, 1] * y + affine_mat[0, 2]
            ty = affine_mat[1, 0] * x + affine_mat[1, 1] * y + affine_mat[1, 2]
            transformed.append((tx, ty))
        return transformed

    def detect_faces_bgr(self, image_bgr, threshold=0.5):
        """
        Detect faces by running MediaPipe FaceDetection on rotated versions.

        Returns:
            (faces, (width, height))
        """
        h, w = image_bgr.shape[:2]
        candidates = []

        for angle in self._ANGLES:
            rotated_bgr, rot_mat = self._rotate_image(image_bgr, angle)
            rotated_rgb = cv2.cvtColor(rotated_bgr, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rotated_rgb)
            result = self.face_detector.detect(mp_image)

            if not result.detections:
                continue

            inv_rot_mat = cv2.invertAffineTransform(rot_mat)

            for det in result.detections:
                score = float(det.categories[0].score) if det.categories else 0.0
                if score < threshold:
                    continue

                bbox = det.bounding_box
                rx1 = bbox.origin_x
                ry1 = bbox.origin_y
                rx2 = bbox.origin_x + bbox.width
                ry2 = bbox.origin_y + bbox.height

                corners_rot = [(rx1, ry1), (rx2, ry1), (rx2, ry2), (rx1, ry2)]
                corners_orig = self._transform_points(corners_rot, inv_rot_mat)

                ox1 = min(p[0] for p in corners_orig)
                oy1 = min(p[1] for p in corners_orig)
                ox2 = max(p[0] for p in corners_orig)
                oy2 = max(p[1] for p in corners_orig)

                x1_px, y1_px, x2_px, y2_px = self._clamp_px(ox1, oy1, ox2, oy2, w, h)
                if x2_px <= x1_px or y2_px <= y1_px:
                    continue

                if (x2_px - x1_px) < self.MIN_FACE_PX or (y2_px - y1_px) < self.MIN_FACE_PX:
                    continue

                x1_n = float(np.clip(x1_px / w, 0.0, 1.0))
                y1_n = float(np.clip(y1_px / h, 0.0, 1.0))
                x2_n = float(np.clip(x2_px / w, 0.0, 1.0))
                y2_n = float(np.clip(y2_px / h, 0.0, 1.0))

                candidates.append(
                    {
                        "label": "face",
                        "score": score,
                        "bbox": [x1_n, y1_n, x2_n, y2_n],
                        "bbox_px": [x1_px, y1_px, x2_px, y2_px],
                    }
                )

        if len(candidates) > self.MAX_CANDIDATES:
            candidates = sorted(candidates, key=lambda item: item["score"], reverse=True)[
                : self.MAX_CANDIDATES
            ]

        faces = self._nms(candidates, iou_threshold=self.NMS_IOU_THRESHOLD)
        faces = sorted(faces, key=lambda item: item["score"], reverse=True)[: self.MAX_FACES]

        return faces, (w, h)
