import React from 'react';

function TopAppBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-sm shadow-[#191c20]/5">
      <div className="text-2xl font-black bg-gradient-to-r from-[#3953bd] to-[#754aa1] bg-clip-text text-transparent tracking-tight">
        Detectify
      </div>
      
      <nav className="hidden md:flex gap-8 items-center">
        <a className="text-[#3953bd] border-b-2 border-[#3953bd] pb-1 font-bold transition-transform duration-200 cursor-pointer active:scale-95" href="#">
          Gallery
        </a>
        <a className="text-slate-500 hover:text-[#3953bd] font-bold transition-transform duration-200 cursor-pointer active:scale-95" href="#">
          Analytics
        </a>
        <a className="text-slate-500 hover:text-[#3953bd] font-bold transition-transform duration-200 cursor-pointer active:scale-95" href="#">
          History
        </a>
        <a className="text-slate-500 hover:text-[#3953bd] font-bold transition-transform duration-200 cursor-pointer active:scale-95" href="#">
          Settings
        </a>
      </nav>
    </header>
  );
}

export default TopAppBar;