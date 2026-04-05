# Detectify: Face Detection App

Detectify is a React + FastAPI face detection app built for multi-face images and webcam captures. The current backend uses MediaPipe face detectors with rotated-image passes so it can handle up to 10 faces, tilted faces, and mixed viewing angles more reliably than a single-pass detector.

## What It Supports

- Upload images or use a webcam feed.
- Detect up to 10 faces in one frame.
- Handle frontal, tilted, rotated, and partial-profile faces.
- Switch between `realtime`, `balanced`, and `accurate` angle modes.
- Tune confidence threshold without changing backend code.
- Show per-face overlays, scores, and debug response data.
- Store history and settings in the browser.

## Project Layout

- `backend/` FastAPI API and face detection logic.
- `frontend/` React UI.
- `backend/models/` MediaPipe TFLite detector assets.

## Requirements

- Python 3.11 recommended.
- Node.js 18+ recommended.
- Windows PowerShell or another shell that can run the provided commands.

## Setup

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If you do not have a requirements file, install the runtime packages manually:

```powershell
pip install fastapi uvicorn pillow numpy opencv-python mediapipe python-multipart
```

Start the API with the backend virtual environment Python so the installed packages are used:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Health check:

```text
GET http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok"}
```

### Frontend

```powershell
cd frontend
npm install
npm start
```

By default the frontend expects the backend at:

```text
http://localhost:8000
```

If you need to change that, set `REACT_APP_API_BASE_URL` in `frontend/.env`.

## API

### `POST /detect`

Form fields:

- `file`: image upload
- `threshold`: confidence threshold, default `0.5`
- `max_faces`: number of faces to return, clamped to `1..10`
- `angle_mode`: `realtime`, `balanced`, or `accurate`

Response includes:

- `faces`: array of detected faces
- `image_width`, `image_height`
- `score`, `bbox`, `bbox_px`, `label` for compatibility with the UI
- `threshold_used`, `max_faces_used`, `angle_mode_used`

## Recommended Tuning

- `realtime`: fastest webcam mode, best when latency matters.
- `balanced`: good default for most uploads and webcam use.
- `accurate`: best for tilted, rotated, or profile-heavy scenes.

Suggested starting values:

- Frontal, easy scenes: threshold `0.5`, max faces `5..10`, `balanced`
- Crowded scenes: threshold `0.4..0.5`, max faces `10`, `balanced`
- Hard pose variation: threshold `0.3..0.45`, max faces `10`, `accurate`

## How To Verify

1. Open `http://localhost:8000/health` and confirm the backend returns `{"status":"ok"}`.
2. Upload an image with multiple people and verify multiple boxes appear.
3. Test a rotated or tilted face and switch `Angle Mode` to `accurate`.
4. Check the debug panel in the UI for the raw backend response.
5. For webcam, compare `realtime` and `accurate` modes for speed and recall.

## Troubleshooting

### Backend import errors

If Uvicorn says a module is missing, run the backend with the backend venv Python:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

### CORS errors

Make sure `FRONTEND_ORIGIN` matches the frontend URL, usually `http://localhost:3000`.

### Slow detection

Use `realtime` mode for webcam. Use `balanced` or `accurate` only when needed.

### No faces detected

Lower the threshold slightly and try `accurate` mode for angled faces.

## License

Detectify © 2026.
