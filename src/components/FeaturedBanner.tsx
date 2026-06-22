import { Play, Flame, User, Calendar } from "lucide-react";
import { TVChannel } from "../types";

interface FeaturedBannerProps {
  onPlayFeatured: () => void;
  channel: TVChannel;
  viewerCount?: number;
}

export default function FeaturedBanner({ onPlayFeatured, channel, viewerCount }: FeaturedBannerProps) {
  return (
    <div id="featured-banner-root" className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-500/20 shadow-[0_0_40px_rgba(30,41,59,0.25)]">
      {/* Visual glowing layout elements */}
      <div className="absolute top-0 right-0 w-[450px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-[300px] h-[200px] bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Grid structure */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 p-6 sm:p-8 items-center gap-6">
        <div className="lg:col-span-3 flex flex-col items-start text-left">
          {/* Live Badge and Trending Tag */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-widest uppercase animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              HOT EVENT
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-800/30 text-blue-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-yellow-400" />
              FIFA World Stream
            </span>
            {viewerCount !== undefined && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {viewerCount.toLocaleString()} Watching
              </span>
            )}
          </div>

          {/* Banner Title */}
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            FIFA Match Live Broadcast
          </h2>
          
          <p className="text-sm sm:text-base text-slate-300 mb-6 max-w-lg leading-relaxed">
            Experience real-time high definition streaming of premium football matches, highlight assemblies, and live soccer tournaments broadcasted exclusively on DZt Tv.
          </p>

          {/* Quick Stats Grid */}
          <div className="flex gap-4 mb-6 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5 bg-slate-950/40 py-1.5 px-3 rounded-lg border border-slate-800/60">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-angle Audio</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/40 py-1.5 px-3 rounded-lg border border-slate-800/60">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Low Latency</span>
            </div>
          </div>

          <button
            onClick={onPlayFeatured}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-sm font-semibold tracking-wide text-white transition-all duration-200 shadow-lg shadow-blue-950/50 hover:shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Featured Live Now
          </button>
        </div>

        {/* Right side teaser card graphic */}
        <div className="lg:col-span-2 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[280px] bg-slate-950/60 rounded-xl p-4 border border-slate-800 backdrop-blur-sm shadow-2xl rotate-1 group-hover:rotate-0 transition-transform duration-300">
            <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-slate-900 border border-slate-800">
              <img 
                src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400&auto=format&fit=crop" 
                alt="FIFA Stadium" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#f8fafc]">LIVE BROADCAST</span>
              </div>
            </div>
            <h4 className="text-sm font-bold text-white truncate mb-1">
              {channel.name}
            </h4>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{channel.category}</span>
              {viewerCount !== undefined ? (
                <span className="text-blue-400 font-semibold font-mono">
                  {viewerCount.toLocaleString()} views
                </span>
              ) : (
                <span className="text-blue-400 font-semibold font-mono">1080p stream</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
