import React from 'react';

function HeroSection() {
  return (
    <section className="h-[204px] bg-gradient-to-r from-[#3953bd] to-[#754aa1] flex flex-col justify-center items-center text-white px-6 text-center">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
        🔍 Face Detection App
      </h1>
      <p className="text-white/80 text-sm md:text-base max-w-xl">
        Detect faces in images with AI. Powered by Detectify curated intelligence.
      </p>
    </section>
  );
}

export default HeroSection;