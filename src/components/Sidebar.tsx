import React, { useState } from "react";
import { InventoryItem, CharacterMet, FactionReputation } from "../types";
import {
  Shield,
  Briefcase,
  Skull,
  UserCheck,
  Compass,
  Bookmark,
  ChevronRight,
  Info,
  Users,
  Sun,
  CloudRain,
  CloudLightning,
  Cloud
} from "lucide-react";

interface SidebarProps {
  characterName: string;
  characterClass: string;
  stepCount: number;
  questUpdate: string;
  inventoryList: InventoryItem[];
  charactersMet: CharacterMet[];
  theme: string;
  factions?: FactionReputation[];
  onOpenFeats?: () => void;
  weather?: string;
}

export default function Sidebar({
  characterName,
  characterClass,
  stepCount,
  questUpdate,
  inventoryList,
  charactersMet,
  theme,
  factions = [],
  onOpenFeats,
  weather
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"inventory" | "characters" | "factions">("inventory");
  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);

  const getRelationshipColor = (rel: string) => {
    const r = rel.toLowerCase();
    if (r.includes("companion") || r.includes("loyal")) return "bg-indigo-950/60 text-indigo-300 border-indigo-700/50";
    if (r.includes("nemesis") || r.includes("foe") || r.includes("enemy") || r.includes("suspicious")) return "bg-rose-950/60 text-rose-300 border-rose-700/50";
    if (r.includes("guide") || r.includes("ally") || r.includes("friend")) return "bg-emerald-950/60 text-emerald-300 border-emerald-700/50";
    return "bg-slate-850 text-slate-400 border-slate-700/50";
  };

  const getFactionStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("hostile")) return "bg-rose-950/60 text-rose-300 border-rose-700/40";
    if (s.includes("suspicious")) return "bg-amber-950/60 text-amber-300 border-amber-700/40";
    if (s.includes("friendly")) return "bg-emerald-955 bg-emerald-950/60 text-emerald-300 border-emerald-700/40";
    if (s.includes("revered")) return "bg-indigo-950/70 text-indigo-300 border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.2)]";
    return "bg-slate-900 border-slate-700 text-slate-400";
  };

  return (
    <div className="w-full md:w-80 bg-slate-900/50 border border-slate-800 rounded-none p-5 flex flex-col backdrop-blur-md h-full space-y-5" id="dashboard-sidebar-root">
      
      {/* 1. CHARACTER STATUS HEADER CARD */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-none p-4 flex items-center gap-3.5 relative overflow-hidden">
        <div className="absolute right-[-10px] bottom-[-15px] text-slate-800/20 pointer-events-none select-none font-sans font-bold italic text-6xl">
          #{stepCount}
        </div>
        <div className="w-11 h-11 rounded-none bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-lg">
          {characterName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 z-10">
          <div className="text-indigo-400 text-[10px] font-bold tracking-widest font-mono uppercase truncate" title={characterClass}>
            {characterClass ? characterClass.split(" — ")[0] : "Wanderer"}
          </div>
          <h3 className="text-slate-100 font-serif italic text-base truncate">{characterName}</h3>
          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
            <span>Universe: {theme || "The Void"}</span>
          </div>
        </div>
      </div>

      {/* 2. CURRENT QUEST TRACKER */}
      <div className="p-4 border border-slate-800 bg-indigo-950/20 rounded-none space-y-2">
        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
          CURRENT QUEST
        </div>
        <p className="text-indigo-100 text-xs font-mono font-medium leading-relaxed font-semibold">
          {questUpdate || "Explore the unknown regions of the world..."}
        </p>
        <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(15, stepCount * 12))}%` }}></div>
        </div>
      </div>

      {/* ATMOSPHERIC MATRIX (WEATHER SYSTEM) */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-none p-3.5 space-y-2 relative overflow-hidden" id="weather-sidebar-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold font-mono uppercase tracking-widest">
            <span className={`w-1.5 h-1.5 rounded-full ${
              (weather || "Clear").toLowerCase() === "storm" ? "bg-purple-400 animate-ping" : "bg-sky-450 bg-sky-400 animate-pulse"
            }`}></span>
            Atmospheric Matrix
          </div>
          <span className="text-[10px] font-mono text-slate-500 font-medium">ENV-SYNC</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 flex items-center justify-center border rounded-none shrink-0 ${
            (weather || "Clear").toLowerCase() === "storm" 
              ? "bg-purple-950/60 border-purple-500/50 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.25)]"
              : (weather || "Clear").toLowerCase() === "rain"
              ? "bg-blue-950/50 border-blue-500/40 text-blue-400"
              : (weather || "Clear").toLowerCase() === "fog"
              ? "bg-slate-900 border-slate-700 text-slate-300"
              : "bg-amber-950/30 border-amber-500/30 text-amber-500"
          }`}>
            {(() => {
              const cond = (weather || "Clear").toLowerCase();
              if (cond === "rain") return <CloudRain className="w-5 h-5 animate-pulse" />;
              if (cond === "storm") return <CloudLightning className="w-5 h-5 animate-bounce text-purple-300" />;
              if (cond === "fog") return <Cloud className="w-5 h-5 opacity-80" />;
              return <Sun className="w-5 h-5" />;
            })()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${
              (weather || "Clear").toLowerCase() === "storm" 
                ? "text-purple-400"
                : (weather || "Clear").toLowerCase() === "rain"
                ? "text-blue-400"
                : (weather || "Clear").toLowerCase() === "fog"
                ? "text-slate-300"
                : "text-amber-400"
            }`}>
              {weather || "Clear"}
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal font-mono">
              {(() => {
                const cond = (weather || "Clear").toLowerCase();
                if (cond === "rain") return "Rain slickens footing & washes tracks.";
                if (cond === "storm") return "Fierce storm. Action hazards active.";
                if (cond === "fog") return "Muffled sound. Visibility near zero.";
                return "Calm skies. Standard paths clear.";
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* FEATS OF VALOR SHORTCUT TRIGGER */}
      {onOpenFeats && (
        <button
          onClick={onOpenFeats}
          className="w-full py-2 bg-slate-950 hover:bg-amber-950/20 border border-slate-800 hover:border-amber-500/35 text-slate-400 hover:text-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.08)] transition-all text-[10px] font-bold font-mono tracking-widest uppercase flex items-center justify-center gap-1.5 cursor-pointer rounded-none active:scale-95"
          id="feats-valor-sidebar-btn"
        >
          <span>🏆</span> FEATS OF VALOR DOSSIER
        </button>
      )}

      {/* 3. DYNAMIC STATUS VIEWER TAB SWITCHER */}
      <div className="flex-1 flex flex-col min-h-0 space-y-3">
        <div className="flex border border-slate-800 p-0.5 bg-slate-950/50 rounded-none overflow-x-auto">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-1.5 px-1 text-center text-[10px] font-mono font-semibold rounded-none transition-all uppercase tracking-wider ${
              activeTab === "inventory"
                ? "bg-indigo-950/60 text-indigo-400 border border-indigo-800/45 scale-95 font-bold"
                : "text-slate-500 hover:text-slate-350"
            }`}
          >
            Inventory ({inventoryList.length})
          </button>
          <button
            onClick={() => setActiveTab("characters")}
            className={`flex-1 py-1.5 px-1 text-center text-[10px] font-mono font-semibold rounded-none transition-all uppercase tracking-wider ${
              activeTab === "characters"
                ? "bg-indigo-950/60 text-indigo-400 border border-indigo-800/45 scale-95 font-bold"
                : "text-slate-500 hover:text-slate-350"
            }`}
          >
            Encounters ({charactersMet.length})
          </button>
          <button
            onClick={() => setActiveTab("factions")}
            className={`flex-1 py-1.5 px-1 text-center text-[10px] font-mono font-semibold rounded-none transition-all uppercase tracking-wider ${
              activeTab === "factions"
                ? "bg-indigo-950/60 text-indigo-400 border border-indigo-800/45 scale-95 font-bold"
                : "text-slate-500 hover:text-slate-350"
            }`}
          >
            Factions ({factions.length})
          </button>
        </div>

        {/* CONTAINER CONTENT */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[180px] max-h-[300px] md:max-h-none">
          {activeTab === "inventory" ? (
            inventoryList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-600 space-y-2">
                <Briefcase className="w-8 h-8 opacity-30" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Vault Empty</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {inventoryList.map((item, index) => (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="group bg-slate-800/30 hover:bg-slate-800/60 transition-all border border-slate-700/40 hover:border-indigo-500/50 rounded-none p-3 flex items-center justify-between cursor-help"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-xs font-mono font-medium text-slate-200 group-hover:text-indigo-400 transition-colors uppercase tracking-wider">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono transition-transform group-hover:translate-x-0.5 select-none font-bold">
                      [INFO]
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "characters" ? (
            charactersMet.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-600 space-y-2">
                <Skull className="w-8 h-8 opacity-30" />
                <span className="text-[10px] font-mono uppercase tracking-widest">No Encounters</span>
              </div>
            ) : (
              <div className="space-y-2">
                {charactersMet.map((char, index) => {
                  const repVal = char.reputation !== undefined ? char.reputation : 50;
                  return (
                    <div
                      key={index}
                      className="bg-slate-800/30 border border-slate-700/40 rounded-none p-3 space-y-2 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-slate-200 font-bold text-xs truncate uppercase font-mono tracking-wider flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500/60" />
                          {char.name}
                        </h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-none border truncate font-bold font-mono tracking-widest scale-90 ${getRelationshipColor(char.relationship)}`}>
                          {char.relationship}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                        {char.notes}
                      </p>

                      {/* Rapport Indicator bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-mono text-slate-500">
                          <span>RAPPORT SCORE</span>
                          <span className="text-indigo-400 font-bold">{repVal}/100</span>
                        </div>
                        <div className="h-1 bg-slate-950 w-full rounded-none overflow-hidden border border-slate-800">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all" 
                            style={{ width: `${repVal}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            factions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-600 space-y-2">
                <Users className="w-8 h-8 opacity-30" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Factions Undiscovered</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {factions.map((faction, idx) => {
                  // standing ranges from -100 to 100. Normalize to 0 to 100 for progress bar
                  const standingPct = ((faction.standing + 100) / 200) * 100;
                  const getStandingSignalColor = (std: number) => {
                    if (std < -20) return "bg-rose-500";
                    if (std < 20) return "bg-slate-400";
                    return "bg-emerald-500";
                  };

                  return (
                    <div
                      key={idx}
                      className="bg-slate-850/40 border border-slate-800 rounded-none p-3 space-y-2 hover:bg-slate-800/40 transition-colors font-mono"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider">
                            {faction.name}
                          </h4>
                        </div>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-none border font-bold uppercase tracking-widest scale-90 ${getFactionStatusColor(faction.status)}`}>
                          {faction.status}
                        </span>
                      </div>

                      <p className="text-[9px] text-slate-400 leading-normal">
                        {faction.description}
                      </p>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-semibold text-slate-500">
                          <span>ALIGNMENT SPECTRUM</span>
                          <span className={`font-bold uppercase ${faction.standing < 0 ? "text-rose-400" : faction.standing > 0 ? "text-emerald-400" : "text-slate-400"}`}>
                            {faction.standing > 0 ? `+${faction.standing}` : faction.standing}
                          </span>
                        </div>
                        <div className="relative h-1.5 bg-slate-950 w-full rounded-none overflow-hidden border border-slate-850">
                          {/* Centered marker */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-700 z-10"></div>
                          <div
                            className={`h-full transition-all ${getStandingSignalColor(faction.standing)}`}
                            style={{ width: `${standingPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* 4. ITEM DESCRIPTION HOVER PANEL */}
      {hoveredItem && (
        <div className="bg-slate-950 border border-indigo-500/40 p-3 rounded-none text-[10px] text-slate-300 absolute md:bottom-5 left-[50%] md:left-5 translate-x-[-50%] md:translate-x-0 w-[calc(100%-40px)] md:w-72 shadow-lg animate-fade-in z-45 font-mono">
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold mb-1 uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            {hoveredItem.name}
          </div>
          <p className="leading-relaxed text-slate-400">{hoveredItem.description}</p>
        </div>
      )}

      {/* STATUS BAR FOOTER */}
      <div className="p-3 bg-slate-950/50 border border-slate-800 text-[10px] uppercase font-mono tracking-wider flex justify-between rounded-none text-slate-500 shrink-0 select-none">
        <span className="font-bold">Sanity: {Math.max(45, 100 - stepCount * 3)}%</span>
        <span className="font-bold">Matrix: Stable</span>
      </div>

    </div>
  );
}
