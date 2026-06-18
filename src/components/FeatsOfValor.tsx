import React, { useEffect, useState, useRef } from "react";
import { GameState } from "../types";
import { 
  Trophy, 
  Map, 
  Compass, 
  Handshake, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Flame, 
  Award,
  ChevronRight,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  Shield,
  Milestone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FeatsOfValorProps {
  state: GameState | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface Feat {
  id: string;
  title: string;
  description: string;
  category: "Exploration" | "Map" | "Diplomacy" | "Arsenal" | "Chronicle";
  target: number;
  currentValue: (state: GameState) => number;
  icon: React.ComponentType<any>;
  tier: "Bronze" | "Silver" | "Gold";
  flavorText: string;
}

export default function FeatsOfValor({ state, isOpen, onClose }: FeatsOfValorProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [playSounds, setPlaySounds] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Define achievements
  const featsList: Feat[] = [
    {
      id: "steps_1",
      title: "Initiate Voyager",
      description: "Take your first courageous steps into the unknown grid.",
      category: "Exploration",
      target: 1,
      currentValue: (s) => s.stepCount || 0,
      icon: Compass,
      tier: "Bronze",
      flavorText: "The longest odyssey starts with an initial spark of devotion."
    },
    {
      id: "steps_15",
      title: "Pioneer Ranger",
      description: "Traverse through at least 15 active territory steps.",
      category: "Exploration",
      target: 15,
      currentValue: (s) => s.stepCount || 0,
      icon: Milestone,
      tier: "Silver",
      flavorText: "Dusty boots are the medal of a tireless explorer."
    },
    {
      id: "steps_30",
      title: "Legendary Vanguard",
      description: "Carve a deep path in history spanning 30+ narrative moves.",
      category: "Exploration",
      target: 30,
      currentValue: (s) => s.stepCount || 0,
      icon: Flame,
      tier: "Gold",
      flavorText: "No terrain too steep, no cave too dark. Your footsteps echo down history."
    },
    {
      id: "locations_1",
      title: "First Horizons",
      description: "Chart your first unique coordinates sector point.",
      category: "Map",
      target: 1,
      currentValue: (s) => {
        const set = new Set((s.visitedCoords || []).map(c => c.name));
        if (s.currentLocation?.name) set.add(s.currentLocation.name);
        return set.size;
      },
      icon: Map,
      tier: "Bronze",
      flavorText: "A blank parchment begins to fill with mountain peaks and delta shores."
    },
    {
      id: "locations_5",
      title: "Cosmic Cartographer",
      description: "Map and chart 5 unique coordinate regions.",
      category: "Map",
      target: 5,
      currentValue: (s) => {
        const set = new Set((s.visitedCoords || []).map(c => c.name));
        if (s.currentLocation?.name) set.add(s.currentLocation.name);
        return set.size;
      },
      icon: Award,
      tier: "Silver",
      flavorText: "You hold the leyline intersections of the stars and plains inside your mind."
    },
    {
      id: "factions_1",
      title: "Initiate Envoy",
      description: "Earn positive/acceptable standings with at least one sovereign faction.",
      category: "Diplomacy",
      target: 1,
      currentValue: (s) => {
        return (s.factions || []).filter(f => f.standing >= 20 || ["Friendly", "Revered"].includes(f.status)).length;
      },
      icon: Handshake,
      tier: "Bronze",
      flavorText: "A friendly nod in the tavern is worth more than ten solid iron plates."
    },
    {
      id: "factions_3",
      title: "Realm Peacemaker",
      description: "Unlock high respect with 3 factions to foster realm-wide alliances.",
      category: "Diplomacy",
      target: 3,
      currentValue: (s) => {
        return (s.factions || []).filter(f => f.standing >= 20 || ["Friendly", "Revered"].includes(f.status)).length;
      },
      icon: Trophy,
      tier: "Gold",
      flavorText: "They sing your praises in the high courts, crypts, and pixel grids alike."
    },
    {
      id: "inventory_5",
      title: "Hoarder of Relics",
      description: "Discover and carry 5 mystical gear pieces inside your pack.",
      category: "Arsenal",
      target: 5,
      currentValue: (s) => (s.inventoryList || []).length,
      icon: Shield,
      tier: "Silver",
      flavorText: "Brass glass instruments, runic scrolls, and ancient daggers fit nicely."
    },
    {
      id: "characters_3",
      title: "Worldly Chronicler",
      description: "Encounter and interact with 3 unique individuals in key sectors.",
      category: "Chronicle",
      target: 3,
      currentValue: (s) => (s.charactersMet || []).length,
      icon: BookOpen,
      tier: "Bronze",
      flavorText: "Everyone has a secret narrative. You are the one who listens."
    }
  ];

  // Helper sound synthesiser to celebrate and play chords
  const playAchievementChime = () => {
    if (!playSounds) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioCtxClass();
      if (!audioCtxRef.current) audioCtxRef.current = ctx;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Arpeggiated Major Major7th chord representing triumphant completion
      const frequencies = [261.63, 329.63, 392.00, 493.88, 523.25]; // C4, E4, G4, B4, C5
      
      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        
        gainNode.gain.setValueAtTime(0, now + index * 0.08);
        gainNode.gain.linearRampToValueAtTime(0.06, now + index * 0.08 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 1.2);
        
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 1.5);
      });
    } catch (e) {
      console.warn("Unable to synthesize chord chime:", e);
    }
  };

  // Play a chime when modal opens to acknowledge the player's valor
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        playAchievementChime();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate dynamic stats
  const steps = state?.stepCount || 0;
  
  const visitedLocationsSet = new Set((state?.visitedCoords || []).map(c => c.name));
  if (state?.currentLocation?.name) {
    visitedLocationsSet.add(state.currentLocation.name);
  }
  const uniqueLocations = visitedLocationsSet.size;

  const befriendedFactions = (state?.factions || [])
    .filter(f => f.standing >= 20 || ["Friendly", "Revered"].includes(f.status)).length;

  const inventoryCount = (state?.inventoryList || []).length;
  const charactersCount = (state?.charactersMet || []).length;

  const evaluatedFeats = featsList.map((feat) => {
    const currentVal = state ? feat.currentValue(state) : 0;
    const isCompleted = currentVal >= feat.target;
    return {
      ...feat,
      currentVal,
      isCompleted,
      progressPercent: Math.min(100, Math.round((currentVal / feat.target) * 100))
    };
  });

  const completedCount = evaluatedFeats.filter(f => f.isCompleted).length;
  const totalCount = evaluatedFeats.length;

  const categories = ["All", "Exploration", "Map", "Diplomacy", "Arsenal", "Chronicle"];
  
  const filteredFeats = evaluatedFeats.filter(
    (f) => activeCategory === "All" || f.category === activeCategory
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto" id="feats-valor-overlay">
        
        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 shadow-2xl p-5 md:p-7 min-h-[500px] flex flex-col font-mono rounded"
          id="feats-valor-modal"
        >
          
          {/* Glowing runic background highlights */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-505 bg-indigo-500/5 filter blur-2xl pointer-events-none rounded-full" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-505 bg-indigo-500/5 filter blur-2xl pointer-events-none rounded-full" />

          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5 relative z-10 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-indigo-400" />
                <h2 className="text-slate-100 text-sm font-bold uppercase tracking-widest">
                  Feats of Valor Dossier
                </h2>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-loose">
                Tracking permanent character achievements & legendary path progression
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Sound Toggle */}
              <button
                onClick={() => setPlaySounds(!playSounds)}
                className={`p-2 border transition-all text-xs cursor-pointer ${
                  playSounds 
                    ? "bg-slate-900 border-indigo-500/30 text-indigo-400" 
                    : "bg-slate-950 border-slate-800 text-slate-600"
                }`}
                title={playSounds ? "Mute achievement bells" : "Enable achievement bells"}
              >
                {playSounds ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Dismiss Button */}
              <button
                onClick={onClose}
                className="p-2 bg-slate-950 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-500/40 text-slate-450 hover:text-rose-400 transition-all rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Character Banner and General Stats */}
          {state && (
            <div className="bg-slate-950/60 border border-slate-850 p-4 mb-5 grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0" id="feats-summary-stats-banner">
              <div className="col-span-2 space-y-1 border-r border-slate-850 pr-4">
                <span className="text-[9px] text-slate-550 text-slate-500 font-bold uppercase tracking-widest">HERO OF RECTITUDE</span>
                <h3 className="text-indigo-300 font-serif italic text-base truncate">{state.characterName || "Anonymous Hero"}</h3>
                <p className="text-[9px] text-slate-450 uppercase tracking-wider line-clamp-1">{state.characterClass ? state.characterClass.split(".")[0] : "Wanderer"}</p>
              </div>

              <div className="text-center py-1 border-r border-slate-850/50">
                <span className="text-[8px] text-slate-500 block font-bold tracking-widest">ODYSSEY PATH</span>
                <span className="text-sm font-bold text-slate-300">{steps} <span className="text-[9px] font-normal text-slate-550 text-slate-500">steps</span></span>
              </div>

              <div className="text-center py-1 border-r border-slate-850/50">
                <span className="text-[8px] text-slate-500 block font-bold tracking-widest">AREAS VISITED</span>
                <span className="text-sm font-bold text-slate-300">{uniqueLocations} <span className="text-[9px] font-normal text-slate-550 text-slate-500">sectors</span></span>
              </div>

              <div className="text-center py-1">
                <span className="text-[8px] text-slate-500 block font-bold tracking-widest">COMPLETED FEATS</span>
                <span className="text-sm font-bold text-indigo-400">{completedCount} <span className="text-[9px] font-normal text-slate-500">/ {totalCount}</span></span>
              </div>
            </div>
          )}

          {/* Achievement unlocked general progress bar */}
          <div className="mb-5 space-y-1 shrink-0">
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Overall Codex Completion Ratio</span>
              <span className="text-indigo-400">{Math.round((completedCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-950 border border-slate-850 w-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-indigo-500"
              />
            </div>
          </div>

          {/* Filter Categories Navbar */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-850 pb-3 mb-5 shrink-0" id="feats-category-filter">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border rounded cursor-pointer transition-all ${
                  activeCategory === cat
                    ? "bg-indigo-950/40 border-indigo-500 text-indigo-300"
                    : "bg-slate-950 border-slate-850 text-slate-450 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {cat}
                {cat === "All" ? ` (${evaluatedFeats.length})` : ` (${evaluatedFeats.filter(f => f.category === cat).length})`}
              </button>
            ))}
          </div>

          {/* Achievements Grid Content */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 select-none" id="feats-grid-scrollbox">
            {filteredFeats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFeats.map((feat) => {
                  const Icon = feat.icon;
                  const isCompleted = feat.isCompleted;
                  
                  return (
                    <motion.div
                      key={feat.id}
                      layout
                      className={`relative p-4 border flex flex-col justify-between transition-all ${
                        isCompleted
                          ? "bg-slate-900 border-indigo-500/30 text-slate-200"
                          : "bg-slate-950 border-slate-850 text-slate-500"
                      }`}
                      id={`feat-${feat.id}`}
                    >
                      {/* Completion check tag */}
                      {isCompleted ? (
                        <span className="absolute top-4 right-4 text-emerald-400 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="absolute top-4 right-4 text-slate-600 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 mb-0.5" />
                          LOCKED
                        </span>
                      )}

                      {/* Header with Title and Tier */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 border rounded ${isCompleted ? "bg-indigo-950/20 border-indigo-500/40" : "bg-slate-900 border-slate-800"}`}>
                            <Icon className={`w-4 h-4 ${isCompleted ? "text-indigo-400 animate-pulse" : "text-slate-600"}`} />
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? "text-slate-100" : "text-slate-500"}`}>
                              {feat.title}
                            </h4>
                            <span className={`text-[8px] font-bold uppercase px-1 rounded-none inline-block border ${
                              feat.tier === "Gold" 
                                ? "border-amber-500/30 bg-amber-950/10 text-amber-500" 
                                : feat.tier === "Silver"
                                ? "border-slate-400/35 bg-slate-100/5 text-slate-350 text-slate-300"
                                : "border-amber-700/30 bg-amber-950/10 text-amber-700"
                            }`}>
                              {feat.tier} tier
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className={`text-[10px] leading-relaxed font-sans ${isCompleted ? "text-slate-300" : "text-slate-600"}`}>
                          {feat.description}
                        </p>
                      </div>

                      {/* Progress Bar and stats indicator */}
                      <div className="mt-4 pt-3 border-t border-slate-850/50 space-y-2">
                        <div className="flex justify-between text-[8px] font-bold tracking-widest text-slate-500">
                          <span>PROGRESS INDEX</span>
                          <span>{feat.currentVal} / {feat.target}</span>
                        </div>
                        
                        <div className="h-1.5 bg-slate-900 border border-slate-850 w-full rounded-none overflow-hidden relative">
                          <div 
                            className={`h-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-indigo-650 bg-indigo-500/40"}`}
                            style={{ width: `${feat.progressPercent}%` }}
                          />
                        </div>

                        {/* Flavor Lore */}
                        {isCompleted && (
                          <p className="text-[9px] text-indigo-400 italic font-serif leading-relaxed pt-1.5 pl-2 border-l border-indigo-500/20">
                            "{feat.flavorText}"
                          </p>
                        )}
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center space-y-2 border border-dashed border-slate-800">
                <Award className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">No achievements logged here.</h4>
                <p className="text-[10px] text-slate-550 text-slate-500 max-w-xs mx-auto font-sans leading-normal">
                  Toggle other filter categories or initiate wider exploratory moves to generate metrics for this sector.
                </p>
              </div>
            )}
          </div>

          {/* Footer warning */}
          <div className="mt-5 border-t border-slate-850 pt-3 text-[9px] text-slate-500 flex justify-between uppercase tracking-widest shrink-0">
            <span>COGNITIVE REGISTER: ACTIVE</span>
            <span>PROUDLY ACHIEVED VIA GENESIS CODEBASE</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
