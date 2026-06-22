import { Tv, RefreshCw, Radio, Settings, AlertCircle } from "lucide-react";

interface HeaderProps {
  totalChannels: number;
  isBackendRefreshing: boolean;
  onRefreshBackend: () => void;
  serverStatus: { status: string; isFetching: boolean };
}

export default function Header({ 
  totalChannels, 
  isBackendRefreshing, 
  onRefreshBackend,
  serverStatus 
}: HeaderProps) {
  return (
    <header className="relative w-full border-b border-slate-900 bg-[#07080a]/60 backdrop-blur-md px-4 py-4 md:px-8 z-40 sticky top-0 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand visual logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400/20">
            <Tv className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-none">
                DZt <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Tv</span>
              </h1>
              <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 uppercase">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wide mt-1">
              IPTV GLOBAL LIVE STREAMING PLATFORM
            </p>
          </div>
        </div>

        {/* Global Live Statistics and Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs">
          
          {/* Channel Count badge */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-lg text-slate-300">
            <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span className="font-semibold text-white font-mono">
              {totalChannels > 8 ? totalChannels.toLocaleString() : "..."}
            </span>
            <span className="text-slate-500 text-[10px] uppercase font-mono">channels</span>
          </div>

          {/* Connected Stream Server Status */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-lg text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 text-[10px] uppercase font-mono mr-1">Server:</span>
            <span className="text-slate-200 font-medium">
              {serverStatus.isFetching ? "Syncing..." : "Online"}
            </span>
          </div>

          {/* Refresh Action Trigger */}
          <button
            onClick={onRefreshBackend}
            disabled={isBackendRefreshing || serverStatus.isFetching}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium tracking-wide transition-all duration-200 cursor-pointer ${
              isBackendRefreshing || serverStatus.isFetching
                ? "bg-slate-950 text-slate-600 border border-slate-900 pointer-events-none cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 active:scale-95"
            }`}
            title="Force refresh backend IPTV list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBackendRefreshing || serverStatus.isFetching ? "animate-spin text-blue-500" : ""}`} />
            <span className="font-mono text-[10.5px] uppercase">Reload index</span>
          </button>
        </div>

      </div>
    </header>
  );
}
