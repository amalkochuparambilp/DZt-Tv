import { useEffect, useRef, useState, MouseEvent, ChangeEvent } from "react";
import Hls from "hls.js";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCw, AlertOctagon, Activity, Radio, Info 
} from "lucide-react";
import { TVChannel } from "../types";

interface VideoPlayerProps {
  channel: TVChannel;
  viewerCount?: number;
}

export default function VideoPlayer({ channel, viewerCount }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [metadata, setMetadata] = useState<{ resolution: string; type: string }>({
    resolution: "Auto",
    type: "HLS"
  });

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Autohide controls on hover
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Initialize and load stream
  const initPlayer = () => {
    const video = videoRef.current;
    if (!video) return;

    // Clean up existing Hls ref
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    setIsPlaying(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferSize: 30 * 1024 * 1024, // 30 MB
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsRef.current = hls;

      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);
        // Autoplay
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            setIsPlaying(false);
            console.log("Autoplay blocked, waiting for user click.");
          });

        // Determine quality level
        if (data.levels && data.levels.length > 0) {
          const maxLevel = data.levels[data.levels.length - 1];
          const height = maxLevel.height || "720";
          setMetadata({
            resolution: `${height}p`,
            type: "HLS Stream"
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS Network Error, attempting to recover...", data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS Media Error, attempting recovery...", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal Live Stream Error:", data);
              setHasError(true);
              setErrorMessage("Fail to establish broadcast connection. Live stream may be currently offline.");
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Apple Safari check
      video.src = channel.url;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
          
        setMetadata({
          resolution: "HD (Native)",
          type: "Apple Native HLS"
        });
      });

      video.addEventListener("error", () => {
        setHasError(true);
        setErrorMessage("Native loading error: Stream is unresponsive.");
        setIsLoading(false);
      });
    } else {
      setHasError(true);
      setErrorMessage("Your browser does not support playing HTTP Live Streams (.m3u8).");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.url]);

  // Clean volume interaction
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted || volume === 0;
    }
  }, [volume, isMuted]);

  // Custom Controls Action Handles
  const togglePlay = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video || hasError || isLoading) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Playback error:", err));
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) {
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error("Error enabling fullscreen:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error("Error exiting fullscreen:", err));
    }
  };

  // Keep fullscreen state synchronized on hardware actions (Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      id="video-player-root"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group shadow-[0_0_50px_rgba(30,41,59,0.3)] border border-slate-800/60 select-none flex items-center justify-center text-white"
    >
      {/* Cinematic Glowing Background Aura */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none filter blur-2xl z-0" />

      {/* Actual HTML5 Video Tag */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        className="w-full h-full object-contain relative z-10 cursor-pointer"
        playsInline
      />

      {/* Big Splash Playing / Action Indicator */}
      <div 
        onClick={togglePlay}
        className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        {!isPlaying && !isLoading && !hasError && (
          <div className="w-16 h-16 rounded-full bg-blue-600/95 flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:scale-110 active:scale-95 transition-transform duration-200">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
        )}
      </div>

      {/* Loading Overlay Spinner */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/80 z-30 flex flex-col items-center justify-center gap-3">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
          </div>
          <p className="text-slate-400 font-mono text-xs tracking-wider animate-pulse uppercase">
            Establishing Live Connection...
          </p>
        </div>
      )}

      {/* Error Fallback Display */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col items-center justify-center gap-4 text-center p-6">
          <AlertOctagon className="w-16 h-16 text-rose-500 animate-bounce" />
          <div className="max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">Connection Issues Detoured</h3>
            <p className="text-sm text-slate-400 mb-4 font-sans">{errorMessage}</p>
            <div className="text-xs text-indigo-400 font-mono mb-6 bg-indigo-950/30 py-1.5 px-3 rounded-lg border border-indigo-900/30 inline-block break-all max-w-full">
              Source: {channel.url}
            </div>
          </div>
          <button
            onClick={initPlayer}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-medium text-sm transition-all duration-200 shadow-lg shadow-blue-900/30 active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
            Retry Stream Connection
          </button>
        </div>
      )}

      {/* Interactive Controls Bar overlay */}
      <div 
        className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-5 pt-12 transition-all duration-300 flex flex-col gap-3 ${
          showControls ? "opacity-100 translateY-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        {/* Top details row inside player */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {channel.logo ? (
              <img 
                src={channel.logo} 
                alt="" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 object-contain p-0.5 shrink-0" 
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-900 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 text-blue-400" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-semibold truncate leading-tight">{channel.name}</h2>
              <p className="text-xs text-slate-400 font-medium tracking-wide flex items-center gap-1">
                <span>{channel.category}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="font-mono text-[10px] text-slate-500">{metadata.type}</span>
              </p>
            </div>
          </div>

          {/* Indicators right side */}
          <div className="flex items-center gap-2">
            {channel.id === 'fifa-live' && viewerCount !== undefined && (
              <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{viewerCount.toLocaleString()} Watching</span>
              </span>
            )}
            <span className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              LIVE
            </span>
            <span className="shrink-0 hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/50 text-slate-300 text-[10px] font-mono uppercase">
              <Info className="w-3 h-3 text-slate-400" />
              {metadata.resolution}
            </span>
          </div>
        </div>

        {/* Buttons Control Tray */}
        <div className="flex items-center justify-between border-t border-slate-800/40 pt-2.5">
          {/* Left Buttons Tray */}
          <div className="flex items-center gap-3">
            <button 
              onClick={togglePlay}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-white cursor-pointer active:scale-95"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>

            <button 
              onClick={initPlayer}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-slate-400 hover:text-white cursor-pointer active:scale-95"
              title="Refresh Stream"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Controllers */}
            <div className="flex items-center gap-1.5 group/vol pl-1">
              <button 
                onClick={toggleMute}
                className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 md:w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 group-hover/vol:bg-slate-700 transition-colors"
              />
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-slate-400 hover:text-white cursor-pointer active:scale-95"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
