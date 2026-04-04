import React from 'react';

function LoadingState() {
  return (
    <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-[15px] animate-fadeIn">
      <div className="w-5 h-5 border-2 border-[#3953bd] border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm font-medium text-gray-600">
        Processing image... analyzing neural patterns
      </span>
    </div>
  );
}

export default LoadingState;