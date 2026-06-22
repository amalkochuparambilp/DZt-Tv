import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tv, Sparkles, Wifi } from "lucide-react";

interface SplashProps {
  onDismiss: () => void;
}

export default function Splash({ onDismiss }: SplashProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 2200; // 2.2 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const computed = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(computed);

      if (computed >= 100) {
        clearInterval(interval);
        setTimeout(onDismiss, 300);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 bg-[#07080a] flex flex-col items-center justify-center z-50 overflow-hidden select-none"
    >
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Decorative scan lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-20" />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center text-center px-6 relative z-10"
      >
        {/* Animated TV transmission waves */}
        <div className="relative mb-6">
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-blue-500/20 filter blur-md"
          />
          <motion.div
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              duration: 2,
              delay: 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-indigo-500/15 filter blur-lg"
          />
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.3)] border border-blue-400/30">
            <Tv className="w-12 h-12 text-white" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </motion.div>
          </div>
        </div>

        {/* Brand typography */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2"
        >
          DZt <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-extrabold">Tv</span>
        </motion.h1>

        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 0.6 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm font-mono tracking-widest uppercase text-slate-400"
        >
          Live Streaming Hub
        </motion.p>
      </motion.div>

      {/* Progress and loading info */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 text-center z-10">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 animate-pulse text-blue-500" />
            <span>CONNECTING STREAMS</span>
          </div>
          <span>{progress}%</span>
        </div>
        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Skip button option */}
        <button
          onClick={onDismiss}
          className="mt-6 px-4 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 active:scale-95 duration-150"
        >
          Skip Intro
        </button>
      </div>
    </motion.div>
  );
}
