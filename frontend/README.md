# Detectify Frontend

This package contains the React UI for Detectify. It supports image upload, webcam capture, multi-face overlays, and runtime tuning for threshold, max faces, and angle mode.

## Run Locally

```powershell
cd frontend
npm install
npm start
```

The app runs at `http://localhost:3000`.

## Backend Expectation

The frontend expects the FastAPI backend at `http://localhost:8000` by default.

If needed, set this in `frontend/.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:8000
```

## UI Features

- Upload image detection.
- Webcam capture and auto-detect.
- Per-face bounding boxes and scores.
- Threshold slider.
- Max Faces slider, up to 10.
- Angle Mode selector: `realtime`, `balanced`, `accurate`.
- Debug panel with raw API response.

## Backend API

The frontend sends multipart form data to `POST /detect` with:

- `file`
- `threshold`
- `max_faces`
- `angle_mode`

The backend returns:

- `faces`
- `image_width`, `image_height`
- `score`, `bbox`, `bbox_px`, `label`
- `threshold_used`, `max_faces_used`, `angle_mode_used`

## Notes

- Use `realtime` for the fastest webcam experience.
- Use `balanced` as the default for most scenes.
- Use `accurate` for tilted, rotated, or profile-heavy scenes.
- If the UI says the backend is unavailable, confirm the backend is running with the backend virtual environment Python on port 8000.
