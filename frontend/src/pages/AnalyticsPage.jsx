import { useMemo } from "react";
import TopNavBar from "../components/TopNavBar";
import { getHistory } from "../utils/storage";

function AnalyticsPage() {
  const history = getHistory();

  const stats = useMemo(() => {
    const total = history.length;
    if (total === 0) {
      return {
        totalDetections: 0,
        avgFaces: 0,
        avgTopScore: 0,
        lastDetectionDate: null,
        distribution: [0, 0, 0, 0, 0],
      };
    }

    const totalFaces = history.reduce((sum, item) => sum + Number(item.facesCount || 0), 0);
    const totalTopScore = history.reduce((sum, item) => sum + Number(item.topScore || 0), 0);
    const lastDate = [...history]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
      ?.createdAt;

    const distribution = [0, 0, 0, 0, 0];
    history.forEach((item) => {
      const c = Number(item.facesCount || 0);
      if (c <= 0) distribution[0] += 1;
      else if (c === 1) distribution[1] += 1;
      else if (c === 2) distribution[2] += 1;
      else if (c === 3) distribution[3] += 1;
      else distribution[4] += 1;
    });

    return {
      totalDetections: total,
      avgFaces: totalFaces / total,
      avgTopScore: totalTopScore / total,
      lastDetectionDate: lastDate,
      distribution,
    };
  }, [history]);

  const labels = ["0", "1", "2", "3", "4+"];
  const maxBucket = Math.max(...stats.distribution, 1);

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <TopNavBar />
      <main className="pt-24 pb-10 px-4">
        <div className="max-w-[1000px] mx-auto bg-surface-container-lowest rounded-[15px] p-6 md:p-8 shadow-[0_12px_40px_-10px_rgba(25,28,32,0.08)]">
          <h1 className="font-headline text-3xl font-black tracking-tight text-[#1a1f3a] mb-6">Analytics</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-low rounded-[12px] p-4">
              <p className="text-xs uppercase text-outline">Total detections</p>
              <p className="text-3xl font-black text-[#3953bd]">{stats.totalDetections}</p>
            </div>
            <div className="bg-surface-container-low rounded-[12px] p-4">
              <p className="text-xs uppercase text-outline">Average faces per image</p>
              <p className="text-3xl font-black text-[#3953bd]">{stats.avgFaces.toFixed(2)}</p>
            </div>
            <div className="bg-surface-container-low rounded-[12px] p-4">
              <p className="text-xs uppercase text-outline">Average top score</p>
              <p className="text-3xl font-black text-[#3953bd]">{(stats.avgTopScore * 100).toFixed(2)}%</p>
            </div>
            <div className="bg-surface-container-low rounded-[12px] p-4">
              <p className="text-xs uppercase text-outline">Last detection date</p>
              <p className="text-base font-bold text-on-surface">
                {stats.lastDetectionDate ? new Date(stats.lastDetectionDate).toLocaleString() : "N/A"}
              </p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="font-headline text-xl font-bold mb-3">Faces Count Distribution</h2>
            <div className="bg-surface-container-low rounded-[12px] p-4 flex flex-col gap-3">
              {stats.distribution.map((count, idx) => (
                <div key={labels[idx]} className="grid grid-cols-[40px_1fr_60px] items-center gap-3">
                  <span className="font-mono text-sm">{labels[idx]}</span>
                  <div className="h-7 rounded bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#3953bd] to-[#754aa1]"
                      style={{ width: `${(count / maxBucket) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-sm text-right">{count}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AnalyticsPage;
