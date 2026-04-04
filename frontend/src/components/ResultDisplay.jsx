import React from 'react';
import ConfidenceBar from './ConfidenceBar';
import BoundingBoxDisplay from './BoundingBoxDisplay';

function ResultDisplay({ result }) {
  const faceDetected = result.face_detected;
  const confidence = (result.confidence * 100).toFixed(2);
  const bbox = result.bbox;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Status Card */}
      {faceDetected ? (
        <div className="bg-[#006b2d]/10 border-2 border-[#006b2d] rounded-[15px] p-6 flex items-center gap-5">
          <div className="bg-[#006b2d] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-[#006b2d]/20">
            ✅
          </div>
          <div>
            <h3 className="font-bold text-[#006b2d] text-xl">Face Detected!</h3>
            <p className="text-gray-600 text-sm">Subject identified within the curated focus zone.</p>
          </div>
        </div>
      ) : (
        <div className="bg-[#ba1a1a]/10 border-2 border-[#ba1a1a] rounded-[15px] p-6 flex items-center gap-5">
          <div className="bg-[#ba1a1a] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-[#ba1a1a]/20">
            ❌
          </div>
          <div>
            <h3 className="font-bold text-[#ba1a1a] text-xl">No Face Detected</h3>
            <p className="text-gray-600 text-sm">Try uploading another image with a clear face visible.</p>
          </div>
        </div>
      )}

      {/* Confidence Score */}
      {faceDetected && (
        <>
          <ConfidenceBar confidence={confidence} />
          <BoundingBoxDisplay bbox={bbox} />
        </>
      )}
    </div>
  );
}

export default ResultDisplay;