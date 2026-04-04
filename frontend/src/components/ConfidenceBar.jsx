import React from 'react';

function ConfidenceBar({ confidence }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <label className="text-xs uppercase tracking-wider text-gray-500">Confidence Score</label>
        <span className="font-black text-[#3953bd] text-xl">{confidence}%</span>
      </div>
      <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#3953bd] to-[#754aa1] rounded-full transition-all duration-1000"
          style={{ width: `${confidence}%` }}
        ></div>
      </div>
    </div>
  );
}

export default ConfidenceBar;
