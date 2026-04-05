import io
import os

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import cv2

try:
    from .face_detector import FaceDetector
except ImportError:
    from face_detector import FaceDetector

app = FastAPI()
face_detector = FaceDetector()

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

# allow your React dev server to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    threshold: float = Form(0.5),
    max_faces: int = Form(10),
    angle_mode: str = Form("balanced"),
):
    # read bytes
    data = await file.read()

    # decode image -> RGB numpy array
    img = Image.open(io.BytesIO(data)).convert("RGB")
    image_rgb = np.array(img)
    
    # convert RGB to BGR for OpenCV
    image_bgr = image_rgb[:, :, ::-1].copy()
    
    threshold = float(np.clip(threshold, 0.05, 0.95))
    max_faces = int(np.clip(max_faces, 1, 10))
    allowed_modes = {"realtime", "balanced", "accurate"}
    angle_mode = angle_mode if angle_mode in allowed_modes else "balanced"

    # detect faces
    faces, (w, h) = face_detector.detect_faces_bgr(
        image_bgr,
        threshold=threshold,
        max_faces=max_faces,
        angle_mode=angle_mode,
    )

    # for compatibility, also return single-face fields from the best detection
    if faces:
        best = faces[0]
        score = best["score"]
        bbox = best["bbox"]
        bbox_px = best["bbox_px"]
        label = "face"
    else:
        score = 0.0
        bbox = None
        bbox_px = None
        label = "no-face"

    return {
        "faces": faces,
        "image_width": w,
        "image_height": h,
        "score": score,
        "bbox": bbox,
        "bbox_px": bbox_px,
        "label": label,
        "threshold_used": threshold,
        "max_faces_used": max_faces,
        "angle_mode_used": angle_mode,
    }


