import { NavLink } from "react-router-dom";

const linkBase = "px-3 py-2 rounded-md text-sm font-semibold transition-colors";

function TopNavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1f3a]/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-[1200px] h-20 mx-auto px-4 flex items-center justify-between">
        <NavLink to="/" className="text-2xl font-black bg-gradient-to-r from-[#3953bd] to-[#754aa1] bg-clip-text text-transparent tracking-tight">
          Detectify
        </NavLink>
        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? "text-white bg-white/10" : "text-slate-300 hover:text-white"}`
            }
          >
            Detect
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? "text-white bg-white/10" : "text-slate-300 hover:text-white"}`
            }
          >
            Analytics
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? "text-white bg-white/10" : "text-slate-300 hover:text-white"}`
            }
          >
            History
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? "text-white bg-white/10" : "text-slate-300 hover:text-white"}`
            }
          >
            Settings
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default TopNavBar;
