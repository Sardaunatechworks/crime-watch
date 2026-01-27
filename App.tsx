import React, { useState, useEffect } from "react";
import { User, UserRole } from "./types";
import { authService } from "./services/db";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import { Icons } from "./constants";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) setUser(currentUser);
    setIsInitializing(false);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simulation of password check for the specific admin
    if (email.toLowerCase() === "admin@mail.com" && password !== "Admin123") {
      alert("Invalid admin credentials.");
      return;
    }

    setAuthLoading(true);
    try {
      const loggedUser = await authService.login(email);
      setUser(loggedUser);
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="animate-spin h-12 w-12 border-[3px] border-indigo-600 border-t-transparent rounded-full shadow-lg shadow-indigo-100"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">
          Establishing Secure Connection
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Layout user={null} onLogout={() => {}}>
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Hero Content */}
          <div className="space-y-10 text-center lg:text-left relative">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10"></div>
            <div>
              <span className="inline-block px-5 py-1.5 bg-indigo-100 text-indigo-700 font-black rounded-full text-[10px] uppercase tracking-[0.2em] mb-6 shadow-sm">
                Safety Redefined
              </span>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Secure your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  neighborhood.
                </span>
              </h1>
              <p className="mt-8 text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                The most advanced reporting system for local incidents.
                Transparent, fast, and designed to keep your community safe.
              </p>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-12">
              <div className="flex flex-col items-center lg:items-start group">
                <span className="text-4xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  100%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Encrypted Data
                </span>
              </div>
              <div className="flex flex-col items-center lg:items-start border-l border-slate-200 pl-12 group">
                <span className="text-4xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  FAST
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Direct Response
                </span>
              </div>
              <div className="flex flex-col items-center lg:items-start border-l border-slate-200 pl-12 group">
                <span className="text-4xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  24/7
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Admin Oversight
                </span>
              </div>
            </div>
          </div>

          {/* Auth Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white p-10 rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 max-w-md mx-auto w-full">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {isLoginView ? "Sign In" : "Register"}
                </h2>
                <div className="text-indigo-600 scale-125">
                  <Icons.Shield />
                </div>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    Professional Email
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    Password
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {isLoginView && email.toLowerCase() === "admin@mail.com" && (
                    <p className="mt-2 text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                      Administrator Login Detected
                    </p>
                  )}
                </div>

                {!isLoginView && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-700 text-center">
                      Registration is exclusively for the{" "}
                      <span className="underline decoration-2">Reporter</span>{" "}
                      role to maintain system integrity.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] mt-4 tracking-widest uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      {isLoginView ? "Signing In..." : "Creating Account..."}
                    </>
                  ) : isLoginView ? (
                    "Access Portal"
                  ) : (
                    "Confirm & Join"
                  )}
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                <p className="text-slate-500 text-sm font-medium">
                  {isLoginView ? "New to the platform?" : "Already a member?"}
                  <button
                    onClick={() => {
                      setIsLoginView(!isLoginView);
                      setEmail("");
                      setPassword("");
                    }}
                    className="ml-2 text-indigo-600 font-bold hover:underline"
                  >
                    {isLoginView ? "Create Account" : "Sign In Here"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Dashboard user={user} />
    </Layout>
  );
};

export default App;
