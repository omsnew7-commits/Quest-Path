import React, { useState } from "react";
import { motion } from "motion/react";
import { PresetTheme, PresetStyle } from "../types";
import {
  Sword,
  Cpu,
  Eye,
  Rocket,
  Compass,
  ArrowRight,
  Shield,
  Sparkles,
  Palette,
  Image,
  User,
  Wand
} from "lucide-react";

interface ThemeSelectorProps {
  onStart: (config: {
    theme: string;
    artStyle: string;
    imageSize: "1K" | "2K" | "4K";
    characterName: string;
    characterClass: string;
  }) => void;
  loading: boolean;
}

const PRESET_THEMES: PresetTheme[] = [
  {
    id: "fantasy",
    name: "Medieval Fantasy",
    icon: "Sword",
    description: "Lost kingdoms, dragon lairs, ancestral oaths, and forgotten spells.",
    classes: ["Paladin", "Archmage", "Shadow Thief", "Elven Ranger"],
    suggestedPrompt: "Medieval fantasy oil painting, detailed, moody light"
  },
  {
    id: "cyberpunk",
    name: "Neon Cyberpunk",
    icon: "Cpu",
    description: "Megacorporations, cybernetic augments, deep-net hacks, and dark rain-slicked alleys.",
    classes: ["Netrunner", "Cyborg Mercenary", "Street Doc", "Corporate Agent"],
    suggestedPrompt: "Cyberpunk synthwave digital illustration, neon glow"
  },
  {
    id: "cosmic",
    name: "Cosmic Horror",
    icon: "Eye",
    description: "Dread mysteries, shifting shadows, ancient artifacts, and the fragility of sanity.",
    classes: ["Private Eye", "Occult Scholar", "Alienist", "Determined Reporter"],
    suggestedPrompt: "Cosmic horror dramatic dark oil sketch, eerie green ambient light"
  },
  {
    id: "scifi",
    name: "Deep Space Voyage",
    icon: "Rocket",
    description: "Derelict colony pods, solar anomalies, alien outposts, and mechanical hulls.",
    classes: ["Starship Pilot", "Systems Engineer", "Xenobiologist", "Scrap Salvager"],
    suggestedPrompt: "Retro sci-fi analog concept art, interstellar space"
  },
  {
    id: "pirate",
    name: "Plunder Seas",
    icon: "Compass",
    description: "Cursed doubloons, siren songs, rogue tides, and pirate brotherhood secrets.",
    classes: ["Galleon Captain", "Cutthroat Cannoneer", "Sea Witch", "Rogue Navigator"],
    suggestedPrompt: "Golden age pirate adventure detailed ink deck sketch"
  }
];

const PRESET_STYLES: PresetStyle[] = [
  { id: "watercolor", name: "Watercolor Portrait", description: "Whimsical colors with soft cotton-paper textures", tags: "Vibrant fantasy watercolor sketch with paper textures" },
  { id: "oil", name: "Dramatic Oil Painting", description: "Rich brushwork, high-contrast, moody classical fantasy style", tags: "Dark fantasy oil painting style, heavy impasto brushstrokes, realistic depth" },
  { id: "pixel", name: "Retro Pixel Art", description: "Detailed 16-bit nostalgic isometric roleplay visual aesthetic", tags: "Retro pixel art 16-bit, vibrant colors, detailed game stage design" },
  { id: "synth", name: "Neon Synthwave", description: "Cyan-magenta retro-futurism with wireframes & intense dark contrasts", tags: "Retro-futurism synthwave scene, wireframe accents, cyan and pink neon" },
  { id: "comic", name: "Comic Ink & Color", description: "Graphic graphic-novel sketches, dark ink linework, muted tones", tags: "Detailed comic book ink illustration style, crosshatching dark sketch" }
];

export default function ThemeSelector({ onStart, loading }: ThemeSelectorProps) {
  const [theme, setTheme] = useState<PresetTheme>(PRESET_THEMES[0]);
  const [stylePreset, setStylePreset] = useState<PresetStyle>(PRESET_STYLES[0]);
  const [customStyle, setCustomStyle] = useState("");
  const [useCustomStyle, setUseCustomStyle] = useState(false);
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [characterName, setCharacterName] = useState("");
  const [characterClass, setCharacterClass] = useState(PRESET_THEMES[0].classes[0]);

  const handleThemeChange = (selected: PresetTheme) => {
    setTheme(selected);
    setCharacterClass(selected.classes[0]);
  };

  const getThemeIcon = (iconName: string) => {
    switch (iconName) {
      case "Sword": return <Sword className="w-5 h-5 text-indigo-400" />;
      case "Cpu": return <Cpu className="w-5 h-5 text-cyan-400" />;
      case "Eye": return <Eye className="w-5 h-5 text-indigo-300" />;
      case "Rocket": return <Rocket className="w-5 h-5 text-indigo-400" />;
      case "Compass": return <Compass className="w-5 h-5 text-indigo-300" />;
      default: return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStyle = useCustomStyle ? (customStyle || "Digital Painting") : stylePreset.tags;
    onStart({
      theme: theme.name,
      artStyle: finalStyle,
      imageSize,
      characterName: characterName.trim() || "Mysterious Wanderer",
      characterClass
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8" id="theme-selector-root">
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/40 border border-indigo-500/30 rounded-none text-indigo-400 text-xs font-semibold mb-3 font-mono"
        >
          <Sparkles className="w-3.5 h-3.5" />
          INFINITE ADVENTURE MATRIX
        </motion.div>
        <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-100 mb-2 font-sans md:text-4xl text-center">
          Forge Your Path
        </h1>
        <p className="text-slate-400 text-xs font-mono max-w-lg mx-auto">
          Every decision shifts the narrative fabric. Choose your identity, theme, and art style to sculpt your custom AI fantasy.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CHARACTER INFO CARD */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-none p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">1. Create Adventurer</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">ADVENTURER NAME</label>
              <input
                type="text"
                maxLength={24}
                placeholder="Enter custom hero name (e.g. Eldrin Stonefelt)..."
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-none px-4 py-3 text-slate-200 text-xs outline-none transition-all placeholder:text-slate-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">CHOOSE CLASS ROLE</label>
              <div className="grid grid-cols-2 gap-2">
                {theme.classes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCharacterClass(c)}
                    className={`px-3 py-2 text-xs font-semibold border transition-all text-center rounded-none font-mono ${
                      characterClass === c
                        ? "bg-indigo-950/40 border-indigo-500 text-indigo-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* STORY THEME */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-none p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Wand className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">2. Select Narrative Universe</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {PRESET_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t)}
                className={`flex flex-col text-left p-4 rounded-none border transition-all ${
                  theme.id === t.id
                    ? "bg-slate-900/80 border-indigo-500 text-white"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
              >
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-none w-fit mb-3">
                  {getThemeIcon(t.icon)}
                </div>
                <div className="font-bold text-[10px] text-white mb-1 uppercase tracking-wider font-mono">{t.name}</div>
                <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ART STYLE & RESOLUTION CONTAINER */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-none p-6 backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">3. Artistic Direction & Fidelity</h2>
            </div>
            <button
              type="button"
              onClick={() => setUseCustomStyle(!useCustomStyle)}
              className="text-[10px] font-mono text-slate-500 hover:text-indigo-400 transition-colors uppercase font-bold tracking-wider"
            >
              {useCustomStyle ? "[ Use Presets ]" : "[ Enter Custom Prompt ]"}
            </button>
          </div>

          {useCustomStyle ? (
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">CUSTOM ART STYLE DESCRIPTOR</label>
              <textarea
                placeholder="Examples: 'Hyper-detailed steampunk line art, neon copper glows, pencil shading'..."
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-none px-4 py-3 text-slate-200 text-xs outline-none transition-all placeholder:text-slate-600 font-mono"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {PRESET_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStylePreset(st)}
                  className={`flex flex-col text-left p-3 rounded-none border transition-all ${
                    stylePreset.id === st.id
                      ? "bg-slate-900/80 border-indigo-500 text-white"
                      : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <div className="font-bold text-[10px] text-white mb-1 uppercase tracking-wider font-mono">{st.name}</div>
                  <div className="text-[10px] text-slate-500 leading-relaxed">{st.description}</div>
                </button>
              ))}
            </div>
          )}

          {/* Render target resolution selector */}
          <div className="pt-2">
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-3 font-mono flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-slate-500" />
              IMAGE RESOLUTION INTENSITY (GEMINI PRO IMAGE)
            </label>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {(["1K", "2K", "4K"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setImageSize(sz)}
                  className={`py-2 rounded-none text-xs font-semibold border transition-all flex flex-col items-center justify-center font-mono ${
                    imageSize === sz
                      ? "bg-indigo-950/40 border-indigo-500 text-indigo-300"
                      : "bg-slate-950 border-slate-810 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="font-bold uppercase tracking-wider">{sz} Resolution</span>
                  <span className="text-[9px] text-slate-500">
                    {sz === "1K" ? "1024x1024" : sz === "2K" ? "2048x2048" : "4096x4096"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-slate-100 disabled:bg-slate-800 border border-indigo-400 font-bold rounded-none transition-all uppercase tracking-widest text-xs cursor-pointer active:scale-[0.98]"
          >
            {loading ? "INITIALIZING STORY MATRIX..." : "EMBARK ON ADVENTURE"}
            <ArrowRight className="w-5 h-5 text-indigo-300" />
          </button>
        </div>
      </form>
    </div>
  );
}
