import React, { useState, useEffect, useRef } from "react";
import { GameState } from "../types";
import {
  Sparkles,
  Compass,
  CornerDownRight,
  Zap,
  HelpCircle,
  Clock,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

interface GameConsoleProps {
  state: GameState;
  onChoice: (choice: string) => void;
  loading: boolean;
  gameActive: boolean;
  onRestart: () => void;
}

const DM_TIPS = [
  "You can type whatever you want in the custom actions scroll. Free will genuinely alters the destination!",
  "Make sure to ask Elda or the Sage DM for help if you find yourself stuck in a dead-end ruins block.",
  "Your inventory updates automatically. Magical artifacts you find might hold passive defensive powers.",
  "Companions can change their relationship state to Nemesis if you repeatedly betray their trust.",
  "Art style seeds are locked in at startup to yield visual style consistency across all generated locations."
];

export default function GameConsole({
  state,
  onChoice,
  loading,
  gameActive,
  onRestart
}: GameConsoleProps) {
  const [customAction, setCustomAction] = useState("");
  const [tipIndex, setTipIndex] = useState(0);

  // Typewriter style animation effect logic
  const [displayedText, setDisplayedText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const textToType = state.storyText || "Adventure is calling out from the shadows.";

  useEffect(() => {
    setDisplayedText("");
    setIsFinished(false);
    
    let currentIndex = 0;
    let timer: any = null;
    
    const type = () => {
      if (currentIndex < textToType.length) {
        setDisplayedText(textToType.substring(0, currentIndex + 1));
        currentIndex++;
        timer = setTimeout(type, 10); // Elegant, highly legible typing pace
      } else {
        setIsFinished(true);
      }
    };
    
    type();
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [textToType, state.stepCount]);

  const skipTypewriter = () => {
    if (!isFinished) {
      setDisplayedText(textToType);
      setIsFinished(true);
    }
  };

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % DM_TIPS.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAction.trim() || loading) return;
    onChoice(customAction.trim());
    setCustomAction("");
  };

  const fallbackPlaceholder = "https://picsum.photos/seed/adventure/800/450?blur=2";

  return (
    <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-none p-6 backdrop-blur-md flex flex-col min-h-0 space-y-6 animate-fade-in" id="game-console-root">
      
      {/* 1. LOADING SCREEN LAYER */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center space-y-6 min-h-[350px]">
          <div className="relative">
            <div className="w-16 h-16 rounded-none border-2 border-slate-800 border-t-indigo-500 animate-spin"></div>
            <Sparkles className="w-6 h-6 text-indigo-400 absolute top-5 left-5 animate-pulse" />
          </div>
          
          <div className="space-y-1 max-w-sm">
            <h3 className="text-slate-100 font-bold uppercase tracking-widest text-sm font-mono">Consulting the Matrix</h3>
            <p className="text-slate-500 text-[10px] font-mono tracking-widest animate-pulse">
              Synthesizing choices and rendering scene oil matrices...
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-none p-4 max-w-md w-full text-left space-y-1 font-mono">
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5" />
              SYSTEM LOG TIP
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              "{DM_TIPS[tipIndex]}"
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 2. MAIN WORKSPACE */}
          <div className="space-y-5 flex-1 min-h-0 overflow-y-auto pr-1">
            
            {/* WIDESCREEN IMAGE */}
            <div className="relative rounded-none overflow-hidden border border-slate-800/80 bg-slate-950 group h-52 sm:h-72 shrink-0">
              <img
                src={state.imageUrl || fallbackPlaceholder}
                alt={state.visualPrompt || "Adventure scene illustration"}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== fallbackPlaceholder) {
                    target.src = fallbackPlaceholder;
                  }
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10"></div>
              
              <div className="absolute top-4 left-4 z-20">
                <span className="px-2 py-1 bg-indigo-600 border border-indigo-400/50 text-[9px] font-bold uppercase tracking-widest text-slate-100 rounded-none">
                  Location: {state.theme || "Sovereign Region"}
                </span>
              </div>

              {/* IMAGE LABELS AND SIZES */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 z-20">
                <div className="min-w-0 pr-2">
                  <div className="text-indigo-400 text-[9px] font-bold font-mono uppercase tracking-widest mb-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    SCENE ATMOSPHERE VECTOR
                  </div>
                  <p className="text-slate-150 text-xs font-mono truncate leading-normal opacity-90 max-w-sm">
                    {state.visualPrompt || "Theme canvas initialized."}
                  </p>
                </div>
                <div className="px-2 py-1 bg-slate-950/80 border border-slate-800 rounded-none text-[9px] text-slate-400 font-mono tracking-widest uppercase font-bold shrink-0">
                  {state.imageSize} RESOLUTION
                </div>
              </div>
            </div>

            {/* STORY TEXT DISPLAY */}
            <div 
              onClick={skipTypewriter}
              className="bg-slate-950/30 border border-slate-800/80 p-6 rounded-none space-y-4 cursor-pointer select-none group/story hover:bg-slate-950/40 hover:border-slate-700/80 transition-all duration-300"
              title={!isFinished ? "Click to skip storyteller text animation" : undefined}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                  <Compass className="w-3.5 h-3.5 text-indigo-400/60" />
                  Dungeon Master Log (Step #{state.stepCount})
                </div>
                {!isFinished && (
                  <span className="text-[9px] font-mono text-indigo-400/70 group-hover/story:text-indigo-400 transition-colors uppercase tracking-widest animate-pulse flex items-center gap-1">
                    ⚡ CLICK TO BYPASS
                  </span>
                )}
              </div>
              <p className="text-slate-100 text-lg leading-relaxed font-serif italic whitespace-pre-line antialiased">
                {displayedText}
                {!isFinished && (
                  <span className="inline-block w-1.5 h-4 bg-indigo-500 ml-1.5 animate-pulse"></span>
                )}
              </p>
            </div>

            {/* DYNAMIC NPC DIALOGUE BLOCK */}
            {state.lastNPCDialogue && state.lastNPCDialogue.speaker && state.lastNPCDialogue.text && (
              <div className="bg-slate-950 border border-indigo-900 p-5 rounded-none space-y-3 shadow-[0_0_15px_rgba(99,102,241,0.05)] animate-fade-in relative overflow-hidden">
                <div className="absolute right-0 top-0 text-[65px] font-mono leading-none text-indigo-500/5 font-extrabold select-none pointer-events-none pr-3">
                  ”
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-1 bg-indigo-500"></div>
                    <span className="text-indigo-400 font-mono text-xs font-bold uppercase tracking-widest">
                      {state.lastNPCDialogue.speaker} speaks:
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono italic">({state.lastNPCDialogue.mood || "Neutral"})</span>
                  </div>
                  {state.lastNPCDialogue.relationImpact && (
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-semibold uppercase tracking-wider">
                      {state.lastNPCDialogue.relationImpact}
                    </span>
                  )}
                </div>
                <p className="text-slate-200 text-sm italic font-serif leading-relaxed pl-3 border-l-2 border-slate-800">
                  "{state.lastNPCDialogue.text}"
                </p>
              </div>
            )}

            {/* PROCEDURAL WORLD MAP & coordinates tracker */}
            {state.currentLocation && state.currentLocation.name && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-950/20 border border-slate-800 p-4 font-mono">
                {/* Current Location Badge and Regional Stats */}
                <div className="sm:col-span-5 space-y-2 border-b sm:border-b-0 sm:border-r border-slate-800/85 pb-3 sm:pb-0 sm:pr-4">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-indigo-500" />
                    PROCEDURAL MAP SECTOR
                  </div>
                  <h4 className="text-slate-150 text-xs font-bold uppercase tracking-wider">{state.currentLocation.name}</h4>
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                    REGION: {state.currentLocation.region || "The Sovereign Depths"}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-sans">
                    {state.currentLocation.description}
                  </p>
                </div>

                {/* Surrounding Landmarks Map Grid: Discovered and Unexplored nearby POIs */}
                <div className="sm:col-span-7 flex flex-col justify-between space-y-3 pl-0 sm:pl-2">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                      CHARTED TERRITORIES
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {state.currentLocation.discoveredPOIs && state.currentLocation.discoveredPOIs.length > 0 ? (
                        state.currentLocation.discoveredPOIs.map((poi, idx) => (
                          <span key={idx} className="text-[8px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                            ✓ {poi}
                          </span>
                        ))
                      ) : (
                        <span className="text-[8px] text-slate-600">No previous sites charted in this zone.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest block mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                      UNEXPLORED ANOMALIES NEARBY
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {state.currentLocation.unexploredPOIs && state.currentLocation.unexploredPOIs.length > 0 ? (
                        state.currentLocation.unexploredPOIs.map((poi, idx) => (
                          <button 
                            key={idx} 
                            disabled={loading}
                            onClick={() => {
                              onChoice(`Go to: ${poi}`);
                            }}
                            className="text-[8px] text-left px-2 py-0.5 bg-indigo-950/20 border border-indigo-500/30 text-indigo-300 font-bold hover:bg-indigo-650 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer uppercase tracking-wider"
                            title={`Carve a path to ${poi}`}
                          >
                            ⚡ {poi}
                          </button>
                        ))
                      ) : (
                        <span className="text-[8px] text-slate-600">The surrounding space has been scanned.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 3. DIVERGENT PRESET OPTIONS */}
          <div className="space-y-4 shrink-0">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              Choose Your Action Pathway
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {state.options.map((opt, i) => {
                const isLast = i === state.options.length - 1 && state.options.length > 1;
                const hoverBg = isLast ? "hover:bg-rose-600 hover:border-rose-450 hover:border-rose-400" : "hover:bg-indigo-600 hover:border-indigo-400";
                const labelColor = isLast ? "text-rose-400" : "text-indigo-400";
                const labelText = `Option ${["A", "B", "C", "D", "E", "F"][i] || i + 1}`;
                
                return (
                  <button
                    key={i}
                    onClick={() => onChoice(opt)}
                    disabled={loading}
                    className={`group text-left bg-slate-800/50 border border-slate-700/80 rounded-none p-4 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${hoverBg}`}
                  >
                    <div className={`text-[10px] ${labelColor} font-bold font-mono uppercase tracking-widest mb-1 group-hover:text-white transition-colors`}>
                      {labelText}
                    </div>
                    <p className="text-slate-200 text-xs font-sans leading-relaxed group-hover:text-white transition-colors">
                      {opt}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[9px] text-slate-600 font-mono uppercase tracking-widest">or carve your own destiny path</span>
              <div className="flex-grow border-t border-slate-800 font-bold"></div>
            </div>

            {/* CUSTOM MOVE FORM */}
            <form onSubmit={handleCustomSubmit} className="flex gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={120}
                  placeholder="Carve your own fate... e.g., 'Examine the glowing wall cavity with my brass glass instrument.'"
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-none px-4 py-3.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !customAction.trim()}
                className="flex items-center gap-1.5 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-100 border border-indigo-400/40 font-bold rounded-none transition-all cursor-pointer text-xs uppercase tracking-widest font-mono shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-300" />
                Submit
              </button>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
