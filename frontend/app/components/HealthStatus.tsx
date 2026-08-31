"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

interface HealthResponse {
  status: string;
  message: string;
}

export default function HealthStatus() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/health`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      setLastChecked(new Date());
    } catch (err: unknown) {
      setData(null);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to backend service");
      }
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="w-full max-w-md bg-[#1a1a1b] border border-[#343536] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#ff4500]" />
          <h2 className="text-base font-semibold text-white">
            System Status
          </h2>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors disabled:opacity-50 px-2 py-1 rounded bg-[#272729] hover:bg-[#343536]"
          title="Re-check backend status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-[#272729] border border-[#343536]/50">
          <span className="text-neutral-400">Backend API</span>
          {loading ? (
            <span className="inline-flex items-center gap-1.5 text-yellow-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Checking...
            </span>
          ) : error ? (
            <span className="inline-flex items-center gap-1.5 text-red-400 font-medium">
              <AlertCircle className="w-4 h-4 text-red-400" />
              Disconnected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Connected
            </span>
          )}
        </div>

        {data && (
          <div className="text-xs font-mono bg-[#111213] border border-[#2d2e30] rounded-lg p-3 text-neutral-300">
            <div className="text-neutral-500 mb-1">Response:</div>
            <div>status: <span className="text-emerald-400">&quot;{data.status}&quot;</span></div>
            <div>message: <span className="text-neutral-200">&quot;{data.message}&quot;</span></div>
          </div>
        )}

        {error && (
          <div className="text-xs bg-red-950/40 border border-red-800/40 rounded-lg p-3 text-red-300">
            <div className="font-semibold mb-1">Connection Error</div>
            <p className="text-red-400/90">{error}</p>
            <p className="text-neutral-400 mt-1.5 text-[11px]">
              Make sure FastAPI backend is running at <code className="text-neutral-200">{backendUrl}</code>
            </p>
          </div>
        )}

        {lastChecked && (
          <div className="text-[11px] text-neutral-500 text-right">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
