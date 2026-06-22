import React, { MouseEvent } from "react";
import { Radio, Heart } from "lucide-react";
import { TVChannel } from "../types";

export interface ChannelCardProps {
  key?: string | number;
  channel: TVChannel;
  isSelected: boolean;
  onSelect: (channel: TVChannel) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: MouseEvent, channel: TVChannel) => void;
}

export default function ChannelCard({ 
  channel, 
  isSelected, 
  onSelect,
  isFavorite,
  onToggleFavorite
}: ChannelCardProps): React.JSX.Element {
  return (
    <div
      onClick={() => onSelect(channel)}
      className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 flex flex-col justify-between h-36 ${
        isSelected 
          ? "bg-slate-900 border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)]" 
          : "bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 hover:shadow-lg"
      }`}
    >
      {/* Absolute top badge row */}
      <div className="flex items-start justify-between gap-2 z-10 font-sans">
        <span className="text-[10px] font-mono tracking-wide px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 uppercase truncate max-w-[70%]">
          {channel.category}
        </span>
        
        {/* Favorite heart icon */}
        <button
          onClick={(e) => onToggleFavorite(e, channel)}
          className={`p-1.5 rounded-lg bg-slate-950/80 backdrop-blur-sm border transition-all duration-200 ${
            isFavorite 
              ? "border-rose-950 text-rose-500 hover:bg-rose-950/20" 
              : "border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800/40"
          }`}
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-rose-500" : ""}`} />
        </button>
      </div>

      {/* Center Image Section */}
      <div className="flex items-center gap-3 my-2.5">
        <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1 relative overflow-hidden group-hover:border-slate-700 transition-colors shrink-0">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain max-h-full"
              onError={(e) => {
                // If logo fails, hide this image and show fallback icon
                (e.target as HTMLImageElement).outerHTML = '<div class="text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-radio w-5 h-5 text-blue-400"><circle cx="12" cy="12" r="2"></circle><path d="M16.2 7.8a6 6 0 0 1 0 8.4"></path><path d="M19 5a10 10 0 0 1 0 14"></path><path d="M7.8 16.2a6 6 0 0 1 0-8.4"></path><path d="M5 19a10 10 0 0 1 0-14"></path></svg></div>';
              }}
            />
          ) : (
            <Radio className="w-5 h-5 text-blue-400" />
          )}
        </div>
        
        {/* Name metadata */}
        <div className="min-w-0 pr-1">
          <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate leading-snug">
            {channel.name}
          </h4>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" />
            <span>Ready stream</span>
          </p>
        </div>
      </div>

      {/* Bottom selected layout indication */}
      <div className="text-[10px] font-mono text-slate-600 flex items-center justify-between">
        <span>DZt TV stream</span>
        {isSelected && (
          <span className="text-blue-400 font-semibold animate-pulse">
            Now Broadcasted
          </span>
        )}
      </div>
    </div>
  );
}
