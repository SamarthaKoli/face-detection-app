import React from 'react';

function ErrorState({ message }) {
  return (
    <div className="bg-[#ba1a1a]/10 border-l-4 border-[#ba1a1a] p-4 rounded-r-[15px] flex items-start gap-3 animate-fadeIn">
      <span className="text-2xl">⚠️</span>
      <div>
        <p className="font-bold text-[#ba1a1a] text-sm">Error</p>
        <p className="text-gray-600 text-xs mt-0.5">{message}</p>
      </div>
    </div>
  );
}

export default ErrorState;