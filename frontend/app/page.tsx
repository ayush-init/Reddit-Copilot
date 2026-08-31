import HealthStatus from "./components/HealthStatus";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
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
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Phase 0: Foundation
        </div>
      </header>

      {/* Hero Content */}
      <div className="w-full max-w-2xl flex flex-col items-center text-center my-auto py-12 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#ff4500]/10 text-[#ff4500] border border-[#ff4500]/20 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assistant for Reddit</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Reddit Copilot
        </h1>

        <p className="text-base sm:text-lg text-neutral-400 max-w-xl mb-8 leading-relaxed">
          An AI-powered assistant designed to understand your Reddit activity, community context, and recommend actions.
        </p>

        {/* Action Button */}
        <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-[#ff4500] hover:bg-[#e03d00] transition-all duration-150 shadow-lg shadow-[#ff4500]/25 cursor-pointer active:scale-98"
            title="Reddit OAuth will be connected in Phase 1"
          >
            <span>Connect Reddit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-neutral-500">
            OAuth integration coming in Phase 1
          </span>
        </div>

        {/* Backend Connectivity Status Section */}
        <div className="w-full mt-12 flex justify-center">
          <HealthStatus />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center py-6 text-xs text-neutral-500 border-t border-[#343536]/40 z-10">
        <p>Reddit Copilot &bull; Phase 0 Foundation</p>
      </footer>
    </main>
  );
}
