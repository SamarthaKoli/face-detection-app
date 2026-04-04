import React, { useState } from 'react';

function ImageUpload({ onImageSelect, preview }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelect(file);
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelect(file);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <label className="text-xs uppercase tracking-wider text-gray-500">Source Material</label>
        <div className="flex gap-4 border-b border-surface-variant">
          <button className="pb-3 px-2 font-bold text-sm transition-all border-b-2 border-[#3953bd] text-[#3953bd]">
            Upload Image
          </button>
          <button className="pb-3 px-2 font-bold text-sm transition-all text-slate-400 hover:text-[#3953bd]">
            Webcam
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-[15px] p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-[#3953bd] bg-blue-50'
            : 'border-[#3953bd]/40 bg-surface-container-low hover:bg-surface-container'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          id="file-input"
        />
        
        <label htmlFor="file-input" className="cursor-pointer w-full">
          <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform">📷</span>
          <p className="font-bold text-[#3953bd] text-lg">Drag and drop your imagery</p>
          <p className="text-gray-500 text-sm mt-1">or click to browse local datasets</p>
        </label>
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative mt-4 group">
          <div className="absolute inset-0 bg-[#3953bd]/5 rounded-[15px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-80 object-cover rounded-[15px] shadow-sm"
          />
        </div>
      )}
    </div>
  );
}

export default ImageUpload;