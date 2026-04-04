const HISTORY_KEY = "faceDetectionHistory";
const SETTINGS_KEY = "faceDetectionSettings";

const DEFAULT_SETTINGS = {
  singleFaceMode: false,
  showLabels: true,
  showConfidence: true,
};

const safeParse = (raw, fallback) => {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const getHistory = () => {
  const parsed = safeParse(localStorage.getItem(HISTORY_KEY), []);
  return Array.isArray(parsed) ? parsed : [];
};

export const clearHistory = () => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
};

export const appendHistoryEntry = (entry) => {
  const history = getHistory();
  history.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const makeHistoryEntry = ({ source, faces, imageWidth, imageHeight }) => {
  const normalizedFaces = Array.isArray(faces) ? faces : [];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    source: source === "webcam" ? "webcam" : "upload",
    facesCount: normalizedFaces.length,
    topScore: normalizedFaces[0]?.score ?? 0,
    imageWidth: imageWidth ?? null,
    imageHeight: imageHeight ?? null,
    faces: normalizedFaces,
  };
};

export const getSettings = () => {
  const parsed = safeParse(localStorage.getItem(SETTINGS_KEY), {});
  return {
    ...DEFAULT_SETTINGS,
    ...(parsed && typeof parsed === "object" ? parsed : {}),
  };
};

export const saveSettings = (settings) => {
  const next = {
    ...DEFAULT_SETTINGS,
    ...(settings && typeof settings === "object" ? settings : {}),
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
};

export const storageKeys = {
  HISTORY_KEY,
  SETTINGS_KEY,
};
