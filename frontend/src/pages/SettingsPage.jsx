import { useState } from "react";
import TopNavBar from "../components/TopNavBar";
import { getSettings, saveSettings } from "../utils/storage";

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 bg-surface-container-low rounded-[12px] p-4 cursor-pointer">
      <div>
        <p className="font-semibold text-on-surface">{label}</p>
        <p className="text-sm text-on-surface-variant">{description}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 h-5 w-5 accent-[#3953bd]" />
    </label>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState(() => getSettings());

  const updateSetting = (key) => {
    setSettings((prev) => {
      const next = saveSettings({ ...prev, [key]: !prev[key] });
      return next;
    });
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <TopNavBar />
      <main className="pt-24 pb-10 px-4">
        <div className="max-w-[900px] mx-auto bg-surface-container-lowest rounded-[15px] p-6 md:p-8 shadow-[0_12px_40px_-10px_rgba(25,28,32,0.08)]">
          <h1 className="font-headline text-3xl font-black tracking-tight text-[#1a1f3a] mb-6">Settings</h1>
          <div className="flex flex-col gap-4">
            <Toggle
              label="Single Face Mode"
              description="When enabled, only the top face is drawn in the detection preview even if multiple faces are returned."
              checked={settings.singleFaceMode}
              onChange={() => updateSetting("singleFaceMode")}
            />
            <Toggle
              label="Show Labels"
              description="Show face labels on top of bounding boxes in preview overlays."
              checked={settings.showLabels}
              onChange={() => updateSetting("showLabels")}
            />
            <Toggle
              label="Show Confidence"
              description="Show confidence-related sections in the detection results panel."
              checked={settings.showConfidence}
              onChange={() => updateSetting("showConfidence")}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
