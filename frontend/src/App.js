import { useEffect, useMemo, useRef, useState } from "react";
import TopNavBar from "./components/TopNavBar";
import { appendHistoryEntry, getSettings, makeHistoryEntry } from "./utils/storage";
import "./App.css";

function App() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  const [sourceTab, setSourceTab] = useState("upload");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [faceThreshold, setFaceThreshold] = useState(0.5);
  const [settings, setSettings] = useState(() => getSettings());
  const [showMappingDebug, setShowMappingDebug] = useState(false);

  const uploadWrapRef = useRef(null);
  const uploadImgRef = useRef(null);
  const videoRef = useRef(null);
  const webcamCanvasRef = useRef(null);
  const [webcamOn, setWebcamOn] = useState(false);
  const [autoDetectWebcam, setAutoDetectWebcam] = useState(false);
  const [uploadOverlayBoxes, setUploadOverlayBoxes] = useState([]);
  const [webcamOverlayBoxes, setWebcamOverlayBoxes] = useState([]);
  const [uploadDebugSize, setUploadDebugSize] = useState(null);
  const [webcamDebugSize, setWebcamDebugSize] = useState(null);
  const streamRef = useRef(null);
  const webcamAutoDetectIntervalRef = useRef(null);
  const webcamDetectInFlightRef = useRef(false);

  const clearWebcamAutoDetectInterval = () => {
    if (webcamAutoDetectIntervalRef.current) {
      clearInterval(webcamAutoDetectIntervalRef.current);
      webcamAutoDetectIntervalRef.current = null;
    }
  };

  const getFacesForUi = (faces) => {
    const facesArray = Array.isArray(faces) ? faces : [];
    return settings.singleFaceMode ? facesArray.slice(0, 1) : facesArray;
  };

  const formatFaceLabel = (face, idx, totalFaces) => {
    const base = totalFaces > 1 ? `face ${idx + 1}` : "face";
    if (!settings.showConfidence) return base;
    const scorePct = ((Number(face?.score) || 0) * 100).toFixed(1);
    return `${base} ${scorePct}%`;
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((r) => r.json())
      .then((data) => console.log("Backend health:", data))
      .catch((e) => console.error("Backend health failed:", e));
  }, [API_BASE_URL]);

  useEffect(() => {
    const refreshSettings = () => setSettings(getSettings());
    window.addEventListener("focus", refreshSettings);
    window.addEventListener("storage", refreshSettings);
    return () => {
      window.removeEventListener("focus", refreshSettings);
      window.removeEventListener("storage", refreshSettings);
    };
  }, []);

  const normalized = useMemo(() => {
    if (!result) return null;
    const faces = Array.isArray(result.faces) ? result.faces : [];
    return { ...result, faces };
  }, [result]);

  const facesForUi = getFacesForUi(normalized?.faces);
  const topFace = facesForUi[0] ?? null;
  const topBBox = Array.isArray(topFace?.bbox)
    ? topFace.bbox
    : Array.isArray(normalized?.bbox_array)
      ? normalized.bbox_array
      : null;

  const resetOutputs = () => {
    setLoading(false);
    setError(null);
    setResult(null);
    setUploadOverlayBoxes([]);
    setWebcamOverlayBoxes([]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    setError(null);
    setResult(null);
  };

  const handleDragDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    setError(null);
    setResult(null);
  };

  function mapCoverBBoxToElement(bbox, srcW, srcH, elW, elH) {
    const [x1n, y1n, x2n, y2n] = bbox;
    const x1s = x1n * srcW;
    const y1s = y1n * srcH;
    const x2s = x2n * srcW;
    const y2s = y2n * srcH;
    const scale = Math.max(elW / srcW, elH / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const offsetX = (drawW - elW) / 2;
    const offsetY = (drawH - elH) / 2;
    const x1 = x1s * scale - offsetX;
    const y1 = y1s * scale - offsetY;
    const x2 = x2s * scale - offsetX;
    const y2 = y2s * scale - offsetY;
    return [x1, y1, x2, y2];
  }

  function mapContainBBoxToElement(bboxPx, containGeometry) {
    const [x1s, y1s, x2s, y2s] = bboxPx;
    const { scale, offsetX, offsetY } = containGeometry;

    const left = offsetX + x1s * scale;
    const top = offsetY + y1s * scale;
    const width = (x2s - x1s) * scale;
    const height = (y2s - y1s) * scale;

    return {
      left,
      top,
      width,
      height,
    };
  }

  const computeUploadContainGeometry = () => {
    const wrapper = uploadWrapRef.current;
    const img = uploadImgRef.current;
    if (!wrapper || !img) return null;

    const containerW = wrapper.clientWidth;
    const containerH = wrapper.clientHeight;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    if (!containerW || !containerH || !naturalW || !naturalH) return null;

    const scale = Math.min(containerW / naturalW, containerH / naturalH);
    const renderW = naturalW * scale;
    const renderH = naturalH * scale;
    const offsetX = (containerW - renderW) / 2;
    const offsetY = (containerH - renderH) / 2;

    return {
      scale,
      offsetX,
      offsetY,
      renderW,
      renderH,
      containerW,
      containerH,
      naturalW,
      naturalH,
    };
  };

  const syncUploadContainGeometry = () => {
    const geometry = computeUploadContainGeometry();
    if (!geometry) return null;

    setUploadDebugSize({
      naturalW: geometry.naturalW,
      naturalH: geometry.naturalH,
      containerW: geometry.containerW,
      containerH: geometry.containerH,
      renderedW: geometry.renderW,
      renderedH: geometry.renderH,
      offsetX: geometry.offsetX,
      offsetY: geometry.offsetY,
      scale: geometry.scale,
    });

    return geometry;
  };

  const clampBoxToElement = (box, elW, elH) => {
    const [x1, y1, x2, y2] = box;
    const left = Math.max(0, Math.min(x1, elW));
    const top = Math.max(0, Math.min(y1, elH));
    const right = Math.max(0, Math.min(x2, elW));
    const bottom = Math.max(0, Math.min(y2, elH));
    return [left, top, right, bottom];
  };

  const faceBBoxPx = (face, srcW, srcH) => {
    if (Array.isArray(face?.bbox_px) && face.bbox_px.length === 4) {
      return face.bbox_px;
    }

    if (Array.isArray(face?.bbox) && face.bbox.length === 4) {
      return [
        face.bbox[0] * srcW,
        face.bbox[1] * srcH,
        face.bbox[2] * srcW,
        face.bbox[3] * srcH,
      ];
    }

    return null;
  };

  const toOverlayBox = (mappedBox, face, idx, totalFaces) => {
    const [x1, y1, x2, y2] = mappedBox;
    const width = Math.max(1, x2 - x1);
    const height = Math.max(1, y2 - y1);
    return {
      left: x1,
      top: y1,
      width,
      height,
      label: settings.showLabels ? formatFaceLabel(face, idx, totalFaces) : "",
    };
  };

  const updateUploadOverlay = (faces) => {
    const geometry = syncUploadContainGeometry();
    if (!geometry) return;

    const { containerW, containerH, naturalW, naturalH } = geometry;

    const facesArray = getFacesForUi(faces);
    const mapped = facesArray
      .map((face, idx) => {
        const bboxPx = faceBBoxPx(face, naturalW, naturalH);
        if (!bboxPx) return null;

        const containMapped = mapContainBBoxToElement(bboxPx, geometry);
        const clamped = clampBoxToElement(
          [
            containMapped.left,
            containMapped.top,
            containMapped.left + containMapped.width,
            containMapped.top + containMapped.height,
          ],
          containerW,
          containerH
        );

        return toOverlayBox(clamped, face, idx, facesArray.length);
      })
      .filter(Boolean);

    setUploadOverlayBoxes(mapped);
  };

  const normalizeFaces = (data, fallbackScore) => {
    const apiFaces = Array.isArray(data?.faces) ? data.faces : [];
    if (apiFaces.length > 0) return apiFaces;

    const bbox = Array.isArray(data?.bbox) ? data.bbox : null;
    if (!bbox || bbox.length !== 4) return [];

    return [
      {
        label: data?.label ?? "face",
        score: typeof data?.score === "number" ? data.score : fallbackScore,
        bbox,
        bbox_px: Array.isArray(data?.bbox_px) ? data.bbox_px : null,
      },
    ];
  };

  const callDetect = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("threshold", String(faceThreshold));

    const response = await fetch(`${API_BASE_URL}/detect`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    const score = typeof data.score === "number" ? data.score : 0;
    const bboxArr = Array.isArray(data.bbox) ? data.bbox : null;
    const faces = normalizeFaces(data, score);

    return {
      raw: data,
      faces,
      faces_detected: faces.length > 0 || score >= faceThreshold ? 1 : 0,
      confidence: score,
      bbox_px: Array.isArray(data.bbox_px) ? data.bbox_px : null,
      image_width: typeof data.image_width === "number" ? data.image_width : null,
      image_height: typeof data.image_height === "number" ? data.image_height : null,
      bounding_box: bboxArr
        ? { x1: bboxArr[0], y1: bboxArr[1], x2: bboxArr[2], y2: bboxArr[3] }
        : null,
      bbox_array: bboxArr,
      label: data.label ?? (score >= faceThreshold ? "face" : "no-face"),
    };
  };

  const saveToHistory = (out, source) => {
    appendHistoryEntry(
      makeHistoryEntry({
        source,
        faces: out.faces,
        imageWidth: out.image_width,
        imageHeight: out.image_height,
      })
    );
  };

  const detectFaceUpload = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const out = await callDetect(image);
      setResult(out);
      saveToHistory(out, "upload");

      if (out.faces.length > 0) {
        setTimeout(() => updateUploadOverlay(out.faces), 50);
      } else {
        setUploadOverlayBoxes([]);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(`Failed to detect faces. Make sure the backend is running on ${API_BASE_URL} and /detect exists.`);
    } finally {
      setLoading(false);
    }
  };

  const startWebcam = async () => {
    setError(null);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setWebcamOn(true);
    } catch (e) {
      console.error(e);
      setError("Could not access webcam. Please allow camera permission.");
      setWebcamOn(false);
    }
  };

  const stopWebcam = () => {
    clearWebcamAutoDetectInterval();
    const stream = streamRef.current;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setWebcamOn(false);
    setResult(null);
    setError(null);
  };

  const drawWebcamFaces = (faces, video) => {
    const rect = video.getBoundingClientRect();
    const vw = rect.width;
    const vh = rect.height;
    if (!vw || !vh) return;

    setWebcamDebugSize({
      renderedW: vw,
      renderedH: vh,
      naturalW: video.videoWidth,
      naturalH: video.videoHeight,
    });

    const facesArray = getFacesForUi(faces);
    const mapped = facesArray
      .map((face, idx) => {
        let bbox = null;

        if (Array.isArray(face?.bbox) && face.bbox.length === 4) {
          bbox = face.bbox;
        } else if (Array.isArray(face?.bbox_px) && face.bbox_px.length === 4 && video.videoWidth && video.videoHeight) {
          bbox = [
            face.bbox_px[0] / video.videoWidth,
            face.bbox_px[1] / video.videoHeight,
            face.bbox_px[2] / video.videoWidth,
            face.bbox_px[3] / video.videoHeight,
          ];
        }

        if (!bbox) return null;

        const coverMapped = mapCoverBBoxToElement(
          bbox,
          video.videoWidth,
          video.videoHeight,
          vw,
          vh
        );
        const clamped = clampBoxToElement(coverMapped, vw, vh);
        return toOverlayBox(clamped, face, idx, facesArray.length);
      })
      .filter(Boolean);

    setWebcamOverlayBoxes(mapped);
  };

  const detectFaceWebcam = async () => {
    if (!videoRef.current || webcamDetectInFlightRef.current) return;

    webcamDetectInFlightRef.current = true;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const video = videoRef.current;
      const capCanvas = webcamCanvasRef.current;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) throw new Error("Webcam not ready yet.");

      capCanvas.width = w;
      capCanvas.height = h;
      const ctx = capCanvas.getContext("2d");
      ctx.drawImage(video, 0, 0, w, h);

      const blob = await new Promise((resolve) => capCanvas.toBlob(resolve, "image/jpeg", 0.92));
      const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });

      const out = await callDetect(file);
      setResult(out);
      saveToHistory(out, "webcam");

      if (out.faces.length > 0) {
        drawWebcamFaces(out.faces, video);
      } else {
        setWebcamOverlayBoxes([]);
      }
    } catch (err) {
      console.error(err);
      setError("Webcam detect failed. Check console + backend logs.");
    } finally {
      webcamDetectInFlightRef.current = false;
      setLoading(false);
    }
  };

  const detectFace = async () => {
    if (sourceTab === "upload") return detectFaceUpload();
    if (sourceTab === "webcam") return detectFaceWebcam();
    return null;
  };

  useEffect(() => {
    resetOutputs();
    if (sourceTab !== "webcam") clearWebcamAutoDetectInterval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceTab]);

  useEffect(() => {
    clearWebcamAutoDetectInterval();

    if (sourceTab !== "webcam" || !webcamOn || !autoDetectWebcam) return undefined;

    webcamAutoDetectIntervalRef.current = setInterval(() => {
      if (webcamDetectInFlightRef.current) return;
      detectFaceWebcam();
    }, 400);

    return () => {
      clearWebcamAutoDetectInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceTab, webcamOn, autoDetectWebcam]);

  useEffect(() => {
    if (!normalized) {
      setUploadOverlayBoxes([]);
      setWebcamOverlayBoxes([]);
      return;
    }

    if (sourceTab === "upload") {
      if (preview) {
        window.requestAnimationFrame(() => updateUploadOverlay(normalized.faces));
      } else {
        setUploadOverlayBoxes([]);
        setUploadDebugSize(null);
      }
    }

    if (sourceTab === "webcam" && webcamOn && videoRef.current) {
      window.requestAnimationFrame(() => drawWebcamFaces(normalized.faces, videoRef.current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized, sourceTab, settings.singleFaceMode, settings.showLabels, settings.showConfidence, preview, webcamOn]);

  useEffect(() => {
    const syncOverlayLayout = () => {
      if (sourceTab === "upload" && preview) {
        const geometry = syncUploadContainGeometry();
        if (normalized) {
          updateUploadOverlay(normalized.faces);
        } else if (geometry) {
          setUploadOverlayBoxes([]);
        }
      }
      if (normalized && sourceTab === "webcam" && webcamOn && videoRef.current) {
        drawWebcamFaces(normalized.faces, videoRef.current);
      }
    };

    window.addEventListener("resize", syncOverlayLayout);
    return () => window.removeEventListener("resize", syncOverlayLayout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized, sourceTab, preview, webcamOn]);

  return (
    <div className="light bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <TopNavBar />

      <main className="flex-grow pt-20">
        <section className="h-[204px] bg-gradient-to-r from-[#3953bd] to-[#754aa1] flex flex-col justify-center items-center text-white px-6 text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-black tracking-tight mb-2">Face Detection App</h1>
          <p className="text-white/80 font-body text-sm md:text-base max-w-xl">
            Detect faces in images with AI. Powered by Detectify curated intelligence.
          </p>
          <p className="text-white/70 text-xs mt-2">API: {API_BASE_URL}</p>
        </section>

        <div className="max-w-[1200px] mx-auto -mt-12 mb-16 px-4 md:px-0">
          <div className="bg-surface-container-lowest rounded-[15px] shadow-[0_12px_40px_-10px_rgba(25,28,32,0.08)] p-6 md:p-8">
            <div className="detector-layout gap-8">
              <div className="detector-left flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <label className="font-label text-[0.6875rem] uppercase tracking-[0.05em] text-outline">Source Material</label>
                  <div className="flex gap-4 border-b border-surface-variant">
                    <button
                      onClick={() => setSourceTab("upload")}
                      className={`pb-3 px-2 font-headline font-bold text-sm transition-all ${
                        sourceTab === "upload"
                          ? "border-b-2 border-[#3953bd] text-[#3953bd]"
                          : "text-slate-400 hover:text-primary"
                      }`}
                    >
                      Upload Image
                    </button>
                    <button
                      onClick={() => setSourceTab("webcam")}
                      className={`pb-3 px-2 font-headline font-bold text-sm transition-all ${
                        sourceTab === "webcam"
                          ? "border-b-2 border-[#3953bd] text-[#3953bd]"
                          : "text-slate-400 hover:text-primary"
                      }`}
                    >
                      Webcam
                    </button>
                  </div>
                </div>

                {sourceTab === "upload" && (
                  <div className="flex flex-col gap-4">
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDragDrop}
                      className="border-2 border-dashed border-[#3953bd]/40 bg-surface-container-low rounded-[15px] p-12 flex flex-col items-center justify-center text-center group hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <p className="font-headline font-bold text-[#3953bd] text-lg">Drag and drop your imagery</p>
                      <p className="text-on-surface-variant text-sm mt-1">or click to browse local datasets</p>
                      <label className="mt-4">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <span className="bg-gradient-to-r from-[#3953bd] to-[#754aa1] text-white px-6 py-2 rounded-lg hover:shadow-lg transition-shadow cursor-pointer inline-block font-bold">
                          Browse Files
                        </span>
                      </label>
                    </div>

                    {preview && (
                      <div
                        ref={uploadWrapRef}
                        className="relative mt-4 media-preview-frame bg-surface-container-high rounded-[15px] overflow-hidden"
                      >
                        <img
                          ref={uploadImgRef}
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-contain block rounded-[15px] shadow-sm"
                          onLoad={() => {
                            syncUploadContainGeometry();
                            if (normalized) {
                              updateUploadOverlay(normalized.faces);
                            }
                          }}
                        />
                        <div className="absolute inset-0 pointer-events-none">
                          {uploadOverlayBoxes.map((box, idx) => (
                            <div
                              key={`upload-box-${idx}`}
                              className="absolute border-[3px] border-[#00ff6a]"
                              style={{
                                left: `${box.left}px`,
                                top: `${box.top}px`,
                                width: `${box.width}px`,
                                height: `${box.height}px`,
                              }}
                            >
                              {box.label ? (
                                <span className="absolute -top-6 left-0 bg-[rgba(0,255,106,0.18)] text-[#00ff6a] text-xs px-2 py-1 font-semibold whitespace-nowrap">
                                  {box.label}
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {sourceTab === "webcam" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => setAutoDetectWebcam((current) => !current)}
                        className={`px-5 py-3 rounded-[12px] font-headline font-bold transition-all active:scale-95 border ${
                          autoDetectWebcam
                            ? "bg-[#006b2d]/10 border-[#006b2d] text-[#006b2d]"
                            : "bg-surface-container-high text-on-surface border-transparent"
                        }`}
                      >
                        Auto Detect: {autoDetectWebcam ? "On" : "Off"}
                      </button>

                      {!webcamOn ? (
                        <button
                          onClick={startWebcam}
                          className="bg-gradient-to-r from-[#3953bd] to-[#754aa1] text-white font-headline font-bold py-3 px-5 rounded-[12px] active:scale-95"
                        >
                          Start Webcam
                        </button>
                      ) : (
                        <button
                          onClick={stopWebcam}
                          className="bg-surface-container-high text-on-surface font-headline font-bold py-3 px-5 rounded-[12px] active:scale-95"
                        >
                          Stop Webcam
                        </button>
                      )}

                      <button
                        onClick={detectFaceWebcam}
                        disabled={!webcamOn || loading}
                        className="bg-gradient-to-r from-[#3953bd] to-[#754aa1] text-white font-headline font-bold py-3 px-5 rounded-[12px] active:scale-95 disabled:opacity-50"
                      >
                        Capture + Detect
                      </button>
                    </div>

                    <div className="relative media-preview-frame bg-inverse-surface rounded-[15px] overflow-hidden">
                      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
                      <div className="absolute inset-0 pointer-events-none">
                        {webcamOverlayBoxes.map((box, idx) => (
                          <div
                            key={`webcam-box-${idx}`}
                            className="absolute border-[3px] border-[#00ff6a]"
                            style={{
                              left: `${box.left}px`,
                              top: `${box.top}px`,
                              width: `${box.width}px`,
                              height: `${box.height}px`,
                            }}
                          >
                            {box.label ? (
                              <span className="absolute -top-6 left-0 bg-[rgba(0,255,106,0.18)] text-[#00ff6a] text-xs px-2 py-1 font-semibold whitespace-nowrap">
                                {box.label}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                    <canvas ref={webcamCanvasRef} className="hidden" />
                  </div>
                )}
              </div>

              <div className="detector-right flex flex-col gap-6">
                <div className="flex flex-col gap-3 bg-surface-container-low p-4 rounded-[15px]">
                  <div className="flex items-end justify-between gap-4">
                    <label className="font-label text-[0.6875rem] uppercase tracking-[0.05em] text-outline">Face Threshold</label>
                    <span className="font-headline font-bold text-[#3953bd]">{faceThreshold.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.1"
                    value={faceThreshold}
                    onChange={(e) => setFaceThreshold(Number(e.target.value))}
                    className="w-full accent-[#3953bd]"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={showMappingDebug}
                    onChange={(e) => setShowMappingDebug(e.target.checked)}
                    className="accent-[#3953bd]"
                  />
                  Show mapping debug sizes
                </label>

                {showMappingDebug && (
                  <div className="bg-surface-container-low p-3 rounded-[12px] text-xs font-mono text-on-surface-variant">
                    {sourceTab === "upload" && uploadDebugSize && (
                      <div>
                        container: {Math.round(uploadDebugSize.containerW || 0)}x{Math.round(uploadDebugSize.containerH || 0)} | rendered: {Math.round(uploadDebugSize.renderedW)}x{Math.round(uploadDebugSize.renderedH)} | natural: {uploadDebugSize.naturalW}x{uploadDebugSize.naturalH} | offset: {Math.round(uploadDebugSize.offsetX || 0)},{Math.round(uploadDebugSize.offsetY || 0)} | scale: {(uploadDebugSize.scale || 0).toFixed(4)}
                      </div>
                    )}
                    {sourceTab === "webcam" && webcamDebugSize && (
                      <div>
                        rendered: {Math.round(webcamDebugSize.renderedW)}x{Math.round(webcamDebugSize.renderedH)} | natural: {webcamDebugSize.naturalW}x{webcamDebugSize.naturalH}
                      </div>
                    )}
                    {sourceTab === "upload" && !uploadDebugSize && <div>No upload media loaded.</div>}
                    {sourceTab === "webcam" && !webcamDebugSize && <div>No webcam frame available yet.</div>}
                  </div>
                )}

                <button
                  onClick={detectFace}
                  disabled={(sourceTab === "upload" && !preview) || loading || (sourceTab === "webcam" && !webcamOn)}
                  className="bg-gradient-to-r from-[#3953bd] to-[#754aa1] text-white font-headline font-bold py-5 px-8 rounded-[15px] shadow-[0_12px_25px_-5px_rgba(57,83,189,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? "Detecting..." : sourceTab === "upload" ? "Detect Face (Upload)" : "Detect Face (Webcam)"}
                </button>

                {loading && (
                  <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-[15px]">
                    <div className="w-5 h-5 border-2 border-[#3953bd] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-on-surface-variant">Processing image...</span>
                  </div>
                )}

                {error && (
                  <div className="bg-error-container/30 border-l-4 border-error p-4 rounded-r-[15px] flex items-start gap-3">
                    <div>
                      <p className="font-bold text-error text-sm">Analysis Failed</p>
                      <p className="text-on-error-container text-xs mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {normalized && !error && (
                  <div className="flex flex-col gap-6">
                    <div className="bg-[#006b2d]/10 border-2 border-[#006b2d] rounded-[15px] p-6 flex items-center gap-5">
                      <div>
                        <h3 className="font-headline font-bold text-[#006b2d] text-xl">
                          {facesForUi.length > 0
                            ? `${facesForUi.length} Face${facesForUi.length > 1 ? "s" : ""} Detected!`
                            : "No Faces Detected"}
                        </h3>
                        <p className="text-on-surface-variant text-sm">
                          Detected {facesForUi.length} face{facesForUi.length !== 1 ? "s" : ""}.
                          {settings.showConfidence && facesForUi.length > 0 && (
                            <> Top score: {(Number(facesForUi[0]?.score || 0) * 100).toFixed(2)}%</>
                          )}
                        </p>
                      </div>
                    </div>

                    {settings.showConfidence && (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-end">
                          <label className="font-label text-[0.6875rem] uppercase tracking-[0.05em] text-outline">
                            {facesForUi.length > 0 ? "Top Face Confidence" : "Confidence Score"}
                          </label>
                          <span className="font-headline font-black text-[#3953bd] text-xl">
                            {facesForUi.length > 0
                              ? `${(Number(facesForUi[0]?.score || 0) * 100).toFixed(2)}%`
                              : `${(normalized.confidence * 100).toFixed(2)}%`}
                          </span>
                        </div>
                        <div className="w-full h-6 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#3953bd] to-[#754aa1] rounded-full"
                            style={{
                              width: `${facesForUi.length > 0
                                ? (Number(facesForUi[0]?.score || 0) * 100).toFixed(2)
                                : (normalized.confidence * 100).toFixed(2)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {settings.showConfidence && facesForUi.length > 1 && (
                      <div className="flex flex-col gap-3">
                        <label className="font-label text-[0.6875rem] uppercase tracking-[0.05em] text-outline">All Face Scores</label>
                        <div className="grid grid-cols-1 gap-2">
                          {facesForUi.map((face, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-surface-container-low p-3 rounded-[12px]">
                              <span className="text-sm font-medium text-on-surface">Face {idx + 1}</span>
                              <span className="font-mono text-[#3953bd] font-bold text-sm min-w-16">
                                {(Number(face?.score || 0) * 100).toFixed(2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(topBBox) && topBBox.length === 4 && (
                      <div className="flex flex-col gap-3">
                        <label className="font-label text-[0.6875rem] uppercase tracking-[0.05em] text-outline">Spatial Coordinates (normalized)</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-surface-container-low p-4 rounded-lg flex flex-col">
                            <span className="text-[10px] text-outline font-bold uppercase">X1 Axis</span>
                            <code className="font-mono text-[#3953bd] font-bold">{Number(topBBox[0]).toFixed(3)}</code>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded-lg flex flex-col">
                            <span className="text-[10px] text-outline font-bold uppercase">Y1 Axis</span>
                            <code className="font-mono text-[#3953bd] font-bold">{Number(topBBox[1]).toFixed(3)}</code>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded-lg flex flex-col">
                            <span className="text-[10px] text-outline font-bold uppercase">X2 Axis</span>
                            <code className="font-mono text-[#3953bd] font-bold">{Number(topBBox[2]).toFixed(3)}</code>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded-lg flex flex-col">
                            <span className="text-[10px] text-outline font-bold uppercase">Y2 Axis</span>
                            <code className="font-mono text-[#3953bd] font-bold">{Number(topBBox[3]).toFixed(3)}</code>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 bg-surface-container-low p-4 rounded-[15px] border border-surface-variant/50">
                      <div className="flex items-center justify-between gap-4">
                        <label className="font-label text-[0.6875rem] uppercase tracking-[0.05em] text-outline">Debug Panel</label>
                        <span className="text-xs text-on-surface-variant">Backend response snapshot</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-surface-container p-3 rounded-[12px]">
                          <span className="block text-[10px] text-outline font-bold uppercase">Label</span>
                          <span className="font-mono text-on-surface">{normalized.label ?? "N/A"}</span>
                        </div>
                        <div className="bg-surface-container p-3 rounded-[12px]">
                          <span className="block text-[10px] text-outline font-bold uppercase">Faces Detected</span>
                          <span className="font-mono text-on-surface">{facesForUi.length}</span>
                        </div>
                        <div className="bg-surface-container p-3 rounded-[12px]">
                          <span className="block text-[10px] text-outline font-bold uppercase">Image Width</span>
                          <span className="font-mono text-on-surface">{normalized.image_width ?? "N/A"}</span>
                        </div>
                        <div className="bg-surface-container p-3 rounded-[12px]">
                          <span className="block text-[10px] text-outline font-bold uppercase">Image Height</span>
                          <span className="font-mono text-on-surface">{normalized.image_height ?? "N/A"}</span>
                        </div>
                      </div>

                      <details className="bg-surface-container p-3 rounded-[12px]">
                        <summary className="cursor-pointer font-bold text-sm text-on-surface-variant">Raw API response</summary>
                        <pre style={{ whiteSpace: "pre-wrap" }} className="mt-3 text-xs text-on-surface-variant">
                          {JSON.stringify(normalized.raw, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-12 mt-auto bg-[#f8f9ff] dark:bg-slate-950 flex flex-col items-center gap-6">
        <div className="text-slate-400 font-label text-[0.6875rem] uppercase tracking-[0.05em]">
          © 2026 Detectify. Intelligence Curated.
        </div>
      </footer>
    </div>
  );
}

export default App;