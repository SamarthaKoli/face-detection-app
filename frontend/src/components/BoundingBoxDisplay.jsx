import React from 'react';

function BoundingBoxDisplay({ bbox }) {
  const coordinates = [
    { label: 'X1 Axis', value: bbox[0] },
    { label: 'Y1 Axis', value: bbox[1] },
    { label: 'X2 Axis', value: bbox[2] },
    { label: 'Y2 Axis', value: bbox[3] },
  ];

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs uppercase tracking-wider text-gray-500">Spatial Coordinates</label>
      <div className="grid grid-cols-2 gap-4">
        {coordinates.map((coord, idx) => (
          <div key={idx} className="bg-surface-container-low p-4 rounded-lg flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase">{coord.label}</span>
            <code className="font-mono text-[#3953bd] font-bold">
              {coord.value.toFixed(3)}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BoundingBoxDisplay;