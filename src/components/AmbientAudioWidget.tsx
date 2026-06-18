import React, { useEffect, useRef } from "react";
import { useAmbientAudio } from "./AmbientAudioContext";
import { 
  Volume2, 
  VolumeX, 
  Flame, 
  Compass, 
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function AmbientAudioWidget() {
  const {
    isPlaying,
    volume,
    activePreset,
    presetDescription,
    togglePlayback,
    setVolume,
    analyserNode,
    isTense,
    heartbeatRate
  } = useAmbientAudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Frequency Domain equalizers visualizer using the AnalyserNode
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let bufferLength = analyserNode ? analyserNode.frequencyBinCount : 32;
    let dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Mock peaceful simulation waves if audio context is not yet playing
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = isPlaying 
            ? Math.random() * 50 
            : Math.sin(Date.now() * 0.003 + i * 0.3) * 12 + 12;
        }
      }

      ctx.lineWidth = 1.5;
      const barWidth = (width / bufferLength) * 1.6;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.85;
        if (barHeight < 1) barHeight = 1;

        // Custom cyber and bio neon coloration based on active tension
        const hue = isTense 
          ? 340 + (i * 2) 
          : 240 + (i * 3); // Indigo tints or Crimson warning
        
        ctx.fillStyle = isPlaying 
          ? `hsla(${hue}, 80%, 60%, ${0.2 + (barHeight / height) * 0.7})`
          : `rgba(99, 102, 241, 0.15)`; // default faint blue state

        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isPlaying, isTense]);

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-4 font-mono space-y-3 relative overflow-hidden" id="ambient-hud-widget">
      
      {/* Background flare when tense */}
      {isTense && isPlaying && (
        <span className="absolute inset-0 bg-rose-950/10 pointer-events-none border border-rose-900/30 animate-pulse z-0" />
      )}

      {/* Header and status light */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-2 relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? (isTense ? "bg-rose-450" : "bg-emerald-500") : "bg-slate-500"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? (isTense ? "bg-rose-500" : "bg-emerald-600") : "bg-slate-600"}`}></span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isPlaying ? "PRO-SYNTH LEYLINE ONLINE" : "AMBIENT SANCTUARY"}
          </span>
        </div>
        
        {isTense && isPlaying && (
          <span className="flex items-center gap-1 text-[8px] bg-rose-955 bg-rose-950/50 border border-rose-800 text-rose-400 px-1.5 py-0.5 font-bold uppercase tracking-widest animate-pulse">
            <Flame className="w-2.5 h-2.5" />
            TENSION RATIO: {heartbeatRate}BPM
          </span>
        )}
      </div>

      {/* Track Name */}
      <div className="space-y-1 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            {isTense ? (
              <Flame className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-100 truncate flex items-center gap-1.5">
              {activePreset}
            </div>
            <div className="text-[8px] text-slate-500 leading-normal line-clamp-2">
              {presetDescription}
            </div>
          </div>
        </div>
      </div>

      {/* Equalizer Visualizer canvas */}
      <div className="relative h-7 bg-slate-900/60 border border-slate-850/50 flex items-end">
        <canvas 
          ref={canvasRef} 
          width={240} 
          height={28} 
          className="w-full h-full block"
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold select-none">
              Audio muted—Click play to synthesize
            </span>
          </div>
        )}
      </div>

      {/* Control row */}
      <div className="flex items-center gap-3 relative z-10">
        <button
          onClick={togglePlayback}
          className={`flex items-center justify-center p-2.5 border transition-all cursor-pointer ${
            isPlaying 
              ? "bg-slate-900 border-indigo-500/40 text-indigo-400 hover:text-indigo-300" 
              : "bg-indigo-950/40 border-indigo-500 text-indigo-300 hover:bg-indigo-900/40"
          }`}
          title={isPlaying ? "Mute soundtrack" : "Activate soundtrack"}
        >
          {isPlaying ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-[9px] text-slate-500">VOL:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-[9px] text-indigo-400 font-bold w-6 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

    </div>
  );
}
