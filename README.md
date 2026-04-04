# Detectify: Face Detection App

A real-time face detection web app built with React (frontend) and FastAPI (backend) using a TensorFlow neural network model.

## Features

- **Upload detection**: Drag and drop images or browse files to detect faces.
- **Webcam detection**: Real-time face detection via webcam with optional auto-detect.
- **Threshold slider**: Adjust face confidence threshold (0.1–0.9) without backend changes.
- **Object-cover aware**: Bounding boxes account for image scaling and cropping.
- **Separate CORS origins**: Hardened CORS policy via environment variables.
- **QA checklist & debug panel**: Built-in verification and backend response inspection.

## Quick Setup (Windows)

### Backend

#### 1. Create virtual environment

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

#### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

If `requirements.txt` doesn't exist, install manually:

```powershell
pip install fastapi uvicorn pillow numpy tensorflow
```

#### 3. Create .env file (optional)

Copy `.env.example` to `.env` and update if needed:

```powershell
copy .env.example .env
```

Default: `FRONTEND_ORIGIN=http://localhost:3000`

#### 4. Start backend

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Run this from the repository root, or `cd backend` and use the same command.

Backend will be available at `http://localhost:8000`.

Test the health endpoint:
- Open browser: `http://localhost:8000/health`
- Expected: `{"status":"ok"}`

View API docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend

#### 1. Create .env file (optional)

From the `frontend` directory:

```powershell
copy .env.example .env
```

Default: `REACT_APP_API_BASE_URL=http://localhost:8000`

#### 2. Install dependencies

```powershell
cd frontend
npm install
```

#### 3. Start development server

```powershell
npm start
```

Frontend will open at `http://localhost:3000`.

## Testing the App

### Upload Flow

1. Click **Upload Image** tab.
2. Drag and drop an image or browse files.
3. Click **Detect Face (Upload)**.
4. Confirm green box appears on detected face and confidence score shows.

### Webcam Flow

1. Click **Webcam** tab.
2. Click **Start Webcam** (allow camera permissions).
3. Click **Capture + Detect** or enable **Auto Detect: On**.
4. Confirm overlay box aligns with your face in the video.
5. Adjust the **Face Threshold** slider (0.1–0.9) to see label change in real-time.

### Debug Panel

After detection, scroll to **Debug Panel** to inspect:
- Backend response fields: `bbox_px`, `image_width`, `image_height`
- Raw JSON response

## Environment Variables

### Backend

```env
FRONTEND_ORIGIN=http://localhost:3000
```

- Controls CORS allowed origin.
- Change for production deployments.

### Frontend

```env
REACT_APP_API_BASE_URL=http://localhost:8000
```

- API endpoint for backend.
- Required to point to your backend URL.

## Troubleshooting

### TensorFlow Model Loading

**Problem**: `Error loading models/facetracker.h5` or `ModuleNotFoundError: No module named 'tensorflow'`

**Solutions**:

1. **Reinstall TensorFlow**: Sometimes the first install fails silently.
   ```powershell
   pip uninstall tensorflow -y
   pip install tensorflow
   ```

2. **Check Python version**: TensorFlow works best on Python 3.8–3.11.
   ```powershell
   python --version
   ```

3. **Verify model file exists**: Ensure `backend/models/facetracker.h5` is present.
   ```powershell
   ls backend/models/
   ```

4. **Clear pip cache** (if install hangs):
   ```powershell
   pip install --no-cache-dir tensorflow
   ```

5. **CPU-only TensorFlow** (if you don't have CUDA):
   - Current setup uses CPU by default (slower inference).
   - Install `tensorflow-intel` for better CPU performance:
     ```powershell
     pip uninstall tensorflow -y
     pip install tensorflow-intel
     ```

### Webcam Permissions

**Problem**: "Could not access webcam" or "PermissionError"

**Solutions**:

1. **Allow camera in browser**: When prompted, click "Allow" (or check Settings > Privacy > Camera).

2. **HTTPS required**: Some browsers restrict camera to HTTPS or localhost only.
   - Localhost (http://localhost:3000) is allowed by default.
   - For other hosts, serve over HTTPS.

3. **Check device**: Ensure your system has a working webcam.
   ```powershell
   # Windows: Open Settings > Privacy & Security > Camera
   # Confirm app has camera access
   ```

4. **Browser compatibility**: Test in Chrome/Edge (best support).
   - Firefox also works but requires explicit permission each time.

### CORS Errors

**Problem**: "Access to XMLHttpRequest blocked by CORS policy"

**Solution**: Ensure `FRONTEND_ORIGIN` in backend matches your frontend URL:

- Frontend at `http://localhost:3000` → Backend `.env`: `FRONTEND_ORIGIN=http://localhost:3000`
- Frontend at `http://0.0.0.0:3000` → Backend `.env`: `FRONTEND_ORIGIN=http://0.0.0.0:3000`

### Slow Detection

**Problem**: Detection takes 5+ seconds.

**Causes**:
- Running TensorFlow on CPU (no CUDA/GPU).
- Python version mismatch.
- Model file corrupted.

**Solutions**:
- Install GPU drivers and CUDA toolkit (advanced).
- Or accept ~1–2 sec inference time on CPU (normal).

## Project Structure

```
face-detection/
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── predictor.py            # TensorFlow model + predict function
│   ├── models/
│   │   └── facetracker.h5      # Pre-trained model
│   ├── .env.example            # Example env file
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js              # Main React component
│   │   ├── App.css             # Styling
│   │   └── ...
│   ├── .env.example            # Example env file
│   ├── package.json            # NPM dependencies
│   └── public/
└── README.md                    # This file
```

## Development Notes

- **Overlay math**: Uses `object-fit: cover` aware mapping to ensure bounding boxes align with DOM elements.
- **Auto-detect throttling**: Webcam auto-detect fires every 400 ms, guardrailed by an in-flight flag to prevent overlapping requests.
- **Threshold-aware UI**: The confidence threshold is frontend-only; backend always returns raw score (0–1).

## License

Detectify © 2026. Curated intelligence for face detection.
