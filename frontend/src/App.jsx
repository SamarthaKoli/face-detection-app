import React, { useState } from 'react';
import './App.css';
import TopAppBar from './components/TopAppBar';
import HeroSection from './components/HeroSection';
import ImageUpload from './components/ImageUpload';
import ResultDisplay from './components/ResultDisplay';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    setError(null);
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDetect = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('http://localhost:5000/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to detect face');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error detecting face. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <TopAppBar />
      <main className="flex-grow pt-20">
        <HeroSection />
        
        <div className="max-w-[700px] mx-auto -mt-12 mb-16 px-4 md:px-0">
          <div className="bg-surface-container-lowest rounded-[15px] shadow-[0_12px_40px_-10px_rgba(25,28,32,0.08)] p-10 flex flex-col gap-10">
            
            {/* Upload Section */}
            <ImageUpload 
              onImageSelect={handleImageSelect}
              preview={preview}
            />

            {/* Action Button */}
            <div className="flex flex-col gap-6">
              <button
                onClick={handleDetect}
                disabled={!selectedImage || loading}
                className="bg-gradient-to-r from-[#3953bd] to-[#754aa1] text-white font-bold py-5 px-8 rounded-[15px] shadow-[0_12px_25px_-5px_rgba(57,83,189,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl">🔍</span>
                Detect Face
              </button>

              {/* Loading State */}
              {loading && <LoadingState />}

              {/* Error State */}
              {error && <ErrorState message={error} />}
            </div>

            {/* Results Section */}
            {result && <ResultDisplay result={result} />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 mt-auto bg-[#f8f9ff] flex flex-col items-center gap-6">
        <div className="flex gap-8">
          <a className="text-slate-400 text-xs uppercase hover:text-[#754aa1] transition-all" href="#">Privacy Policy</a>
          <a className="text-slate-400 text-xs uppercase hover:text-[#754aa1] transition-all" href="#">API Docs</a>
          <a className="text-slate-400 text-xs uppercase hover:text-[#754aa1] transition-all" href="#">Support</a>
        </div>
        <div className="text-slate-400 text-xs uppercase">
          © 2024 Detectify. Intelligence Curated.
        </div>
      </footer>
    </div>
  );
}

export default App;