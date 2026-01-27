
import React from 'react';
import { Icons } from '../constants';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <header className="sticky top-0 z-50 glass border-b border-slate-200/50 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-[14px] shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
              <Icons.Shield />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter text-slate-900 leading-none">CRIMEWATCH</span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Community Safe</span>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-5 py-1">
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-0.5">{user.role} ACCESS</span>
                  <span className="text-sm font-bold text-slate-800">{user.email}</span>
                </div>
                <button 
                  onClick={onLogout}
                  className="group flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                >
                  <Icons.LogOut />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <main className={`flex-grow ${isAuthenticated ? 'pb-20' : ''}`}>
        {children}
      </main>

      {!isAuthenticated && (
        <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} Crime-Watch Security Platform. All Rights Reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
