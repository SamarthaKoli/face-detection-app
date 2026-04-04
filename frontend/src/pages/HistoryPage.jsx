import { useMemo, useState } from "react";
import TopNavBar from "../components/TopNavBar";
import { clearHistory, getHistory } from "../utils/storage";

function HistoryPage() {
  const [history, setHistory] = useState(() => getHistory());
  const [expanded, setExpanded] = useState({});

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [history]
  );

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const onClearHistory = () => {
    clearHistory();
    setHistory([]);
    setExpanded({});
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <TopNavBar />
      <main className="pt-24 pb-10 px-4">
        <div className="max-w-[1000px] mx-auto bg-surface-container-lowest rounded-[15px] p-6 md:p-8 shadow-[0_12px_40px_-10px_rgba(25,28,32,0.08)]">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="font-headline text-3xl font-black tracking-tight text-[#1a1f3a]">Detection History</h1>
            <button
              onClick={onClearHistory}
              className="px-4 py-2 rounded-[10px] bg-red-600 text-white text-sm font-bold disabled:opacity-50"
              disabled={sortedHistory.length === 0}
            >
              Clear history
            </button>
          </div>

          {sortedHistory.length === 0 ? (
            <div className="bg-surface-container-low rounded-[12px] p-5 text-on-surface-variant">
              No detection history yet.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedHistory.map((entry) => (
                <article key={entry.id} className="border border-surface-variant/50 rounded-[12px] p-4 bg-surface-container-low">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-on-surface">
                        {entry.source} • {new Date(entry.createdAt).toLocaleString()}
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        facesCount: {entry.facesCount} • topScore: {(Number(entry.topScore || 0) * 100).toFixed(2)}%
                      </p>
                    </div>
                    <button
                      onClick={() => toggle(entry.id)}
                      className="px-3 py-2 rounded-[10px] bg-[#3953bd] text-white text-sm font-semibold"
                    >
                      {expanded[entry.id] ? "Hide details" : "View details"}
                    </button>
                  </div>

                  {expanded[entry.id] && (
                    <div className="mt-4 grid gap-3 text-sm">
                      <div className="bg-surface-container p-3 rounded-[10px]">
                        <span className="font-semibold">Image size:</span> {entry.imageWidth ?? "N/A"} x {entry.imageHeight ?? "N/A"}
                      </div>
                      <div className="bg-surface-container p-3 rounded-[10px]">
                        <span className="font-semibold">Bounding boxes:</span>
                        <div className="mt-2 flex flex-col gap-2">
                          {(entry.faces || []).length === 0 && <span className="text-on-surface-variant">No faces in this entry.</span>}
                          {(entry.faces || []).map((face, index) => (
                            <div key={`${entry.id}-${index}`} className="font-mono text-xs bg-surface-container-high p-2 rounded-[8px]">
                              face {index + 1}: bbox={JSON.stringify(face.bbox ?? null)} bbox_px={JSON.stringify(face.bbox_px ?? null)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default HistoryPage;
