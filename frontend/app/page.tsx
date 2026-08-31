"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import HealthStatus from "./components/HealthStatus";
import UserProfile, { RedditUser } from "./components/UserProfile";
import { Sparkles, ArrowRight, AlertTriangle, ShieldCheck, KeyRound } from "lucide-react";

function HomeContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<RedditUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Check current auth status from backend
  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/me`, {
        method: "GET",
        credentials: "include", // send session cookies
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for query parameters from OAuth redirect
    const errorParam = searchParams.get("auth_error");
    if (errorParam) {
      setAuthError(decodeURIComponent(errorParam));
    }
    checkAuth();
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff4500]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Navbar */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 py-4 border-b border-[#343536]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#ff4500] flex items-center justify-center font-bold text-white text-lg shadow-md">
            r/
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Reddit Copilot
          </span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#272729] text-neutral-300 border border-[#343536]">
          <span className={`w-2 h-2 rounded-full ${user ? "bg-emerald-400" : "bg-amber-400"}`} />
          {user ? `Connected: u/${user.username}` : "Phase 1: Reddit OAuth"}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-2xl flex flex-col items-center text-center my-auto py-10 z-10">
        {/* Auth Error Banner if OAuth returned an error */}
        {authError && (
          <div className="w-full max-w-lg mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4 text-left flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-red-300 mb-1">
                Authentication Error
              </div>
              <p className="text-red-400/90">{authError}</p>
              <p className="text-neutral-400 mt-2 text-[11px]">
                Please verify that <code className="text-neutral-200">REDDIT_CLIENT_ID</code> and{" "}
                <code className="text-neutral-200">REDDIT_CLIENT_SECRET</code> are configured in your backend <code className="text-neutral-200">.env</code>.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#ff4500] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-neutral-400">Loading profile status...</span>
          </div>
        ) : user ? (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Reddit Account Connected</span>
            </div>
            <UserProfile user={user} onLogout={handleLogout} />
          </div>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#ff4500]/10 text-[#ff4500] border border-[#ff4500]/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Operating Layer for Reddit</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Reddit Copilot
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 max-w-xl mb-8 leading-relaxed">
              Connect your Reddit account to view your live profile, understand your community context, and get AI-assisted guidance.
            </p>

            {/* Connect Reddit Action Button */}
            <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
              <a
                href={`${backendUrl}/api/auth/reddit/login`}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white bg-[#ff4500] hover:bg-[#e03d00] transition-all duration-150 shadow-lg shadow-[#ff4500]/25 cursor-pointer active:scale-98"
              >
                <span>Connect Reddit</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <span className="text-xs text-neutral-500">
                Secure OAuth 2.0 Authorization &bull; Permanent refresh token
              </span>
            </div>
          </>
        )}

        {/* System Health Status Section */}
        <div className="w-full mt-12 flex justify-center">
          <HealthStatus />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center py-6 text-xs text-neutral-500 border-t border-[#343536]/40 z-10">
        <p>Reddit Copilot &bull; Phase 1 (Reddit OAuth)</p>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0e1113]" />}>
      <HomeContent />
    </Suspense>
  );
}
