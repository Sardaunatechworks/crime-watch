import React from "react";
import { Icons } from "../constants";
import { User, UserRole } from "../types";

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg md:rounded-[14px] shadow-lg shadow-indigo-100 ring-4 ring-indigo-50 transition-colors">
              <Icons.Shield />
            </div>
            <div className="flex flex-col gap-0">
              <span className="font-black text-lg md:text-xl tracking-tighter text-slate-900 leading-none">
                CRIMEWATCH
              </span>
              <span className="text-[8px] md:text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                Community Safe
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 md:gap-4">
            {user ? (
              <>
                <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-4 md:pr-5 py-1">
                  <span className="text-[8px] uppercase tracking-widest text-slate-400 font-black mb-0.5">
                    {user.role} ACCESS
                  </span>
                  <span className="text-xs md:text-sm font-bold text-slate-800 truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="group flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg md:rounded-xl transition-all duration-300 active:scale-95"
                >
                  <Icons.LogOut />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <main className={`flex-grow ${isAuthenticated ? "pb-12 md:pb-20" : ""}`}>
        {children}
      </main>

      {!isAuthenticated && (
        <footer className="bg-slate-950 text-slate-400 py-8 md:py-12 border-t border-slate-900 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} Crime-Watch Security Platform. All
              Rights Reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
