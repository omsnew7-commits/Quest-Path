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
    characterBackground?: string;
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

export const PERSONALITY_SUFFIXES = [
  { 
    suffix: "the Wise", 
    description: "Deep thinker, cryptic, notices subtle runic arrays and historical links. Guided by ancient intellect.",
    promptExtra: "Personality Suffix Style: Cryptic, extremely analytical, wise, speaks in philosophical guidance, and highlights ancient runes or lore details."
  },
  { 
    suffix: "the Brave", 
    description: "Audacious, daring, leads with charisma and fearless curiosity. Guided by steel and glory.",
    promptExtra: "Personality Suffix Style: Bold, outspoken, highly courageous, prefers direct physical action, and stands ground against dangerous threats."
  },
  { 
    suffix: "the Shadow", 
    description: "Clandestine, quiet, suspicious, prefers stealth, bypasses confrontation. Guided by dark survival.",
    promptExtra: "Personality Suffix Style: Hushed, stealth-focused, cautious, utilizes shadows or clever tricks rather than direct confrontation."
  },
  { 
    suffix: "the Mad", 
    description: "Chaotic, volatile, prone to erratic brilliant impulses and wild schemes. Guided by pure chaos.",
    promptExtra: "Personality Suffix Style: Eccentric, unpredictable, prone to sudden flashes of chaotic tactical inspiration and erratic laughter."
  },
  { 
    suffix: "the Tinker", 
    description: "Analytical, structural, obsesses over components, gears, joints, and mechanics. Guided by engineering.",
    promptExtra: "Personality Suffix Style: Gadgeteer mind, analytical, speaks of gears, wires, and machinery, looking for parts or scrap."
  },
  { 
    suffix: "the Silenced", 
    description: "Stoic, laconic, expresses intent through silent nods, cold stares, and swift actions.",
    promptExtra: "Personality Suffix Style: Stoic, deeply silent, expresses thoughts through calculated gestures, nods, or quick deliberate actions."
  }
];

export const CLASS_DESCRIPTIONS: Record<string, { description: string; advantage: string; traits: string[] }> = {
  // Medieval Fantasy
  "Paladin": {
    description: "A holy templar armored in ancestral steel, wielding radiant oaths, divine shields, and unmatched resilience to purge ancient plagues.",
    advantage: "Aegis Aura: Immune to decay & darkness, starts with an heirloom Consecrated Greatshield.",
    traits: ["Heavy Guard", "Radiant Smite", "Virtuous Path"]
  },
  "Archmage": {
    description: "A master of the cosmic weave, commanding elemental storms, rewriting spatial rifts, and shielding allies with force barrier wards.",
    advantage: "Aetheric Recall: Starts with an extra Mana Focus Ring and holds the rare ability to read glowing primal spell runes.",
    traits: ["Spellweaver", "Telekinetic Spark", "Runic Insight"]
  },
  "Shadow Thief": {
    description: "An agent of the silent dark, specializing in lockpicking, toxic daggers, precision backstabs, and fading entirely into cold shadows.",
    advantage: "Shadow Step: Exceptional stealth, starts with Lockpicks, and can bypass locked paths without requiring key items.",
    traits: ["Silent Stride", "Anatomical Strike", "Poison Craft"]
  },
  "Elven Ranger": {
    description: "A wilderness sentinel attuned to the heart of the woods, utilizing deadly longbow precision, tracking, and companion bond whispers.",
    advantage: "Bestial Whispers: Can communicate with wild creatures to solicit aid, starts with a Yew Compound Bow.",
    traits: ["Volley Fire", "Flora Attunement", "Feral Bond"]
  },
  // Neon Cyberpunk
  "Netrunner": {
    description: "A deep-net interface specialist capable of direct neuro-hacking, disabling security nodes, and reprogramming enemy cybernetics from afar.",
    advantage: "Overclock Deck: Can hack electronic security networks instantly, starts with a Neural Link Patch.",
    traits: ["Node Override", "Ping Scan", "Memory Wipe"]
  },
  "Cyborg Mercenary": {
    description: "A heavily augmented combat pioneer equipped with internal ballistic armor, thermoptic camouflage, and high-frequency vibro-blades.",
    advantage: "Subdermal Plating: Highly resilient to physical damage, starts with an integrated High-Freq Blade.",
    traits: ["Tactical Overdrive", "Camouflage Shield", "Micro-Missile"]
  },
  "Street Doc": {
    description: "An underground organic surgeon skilled in biological stem-cells, nanite patches, cybernetic overrides, and restorative stimulants.",
    advantage: "Med-Nano Infuser: Able to cure toxicity and injuries immediately, starts with a portable Omni-Trauma Kit.",
    traits: ["Biotic Burst", "Surgical Precision", "Chemical Booster"]
  },
  "Corporate Agent": {
    description: "A master of elite espionage and high-finance manipulation, wielding advanced satellite reconnaissance, hidden assets, and tactical leverage.",
    advantage: "Black Card Access: Extremely wealthy, accesses restricted corporate databases, starts with a secure Crypto Datapad.",
    traits: ["Insider Intel", "Assets Leverage", "Denial Protocol"]
  },
  // Cosmic Horror
  "Private Eye": {
    description: "A battered investigator skilled in lockpicking, physical combat, forensic deduction, and clinging to logic amid world-ending sanity shifts.",
    advantage: "Grit Resiliency: Enhanced mental recovery, starts with a Brass Magnifying glass and a .38 Special revolver.",
    traits: ["Deductive Vision", "Hard Boiled Stamina", "Instinct Alert"]
  },
  "Occult Scholar": {
    description: "A researcher of forbidden dark texts, translating eerie glyphs, drawing protective sigils, and channeling unstable minor ritual wards.",
    advantage: "Forbidden Codex: Can decipher cosmic inscriptions and cult runes, starts with an Incantation Grimoire.",
    traits: ["Eldritch Glyph", "Sanity Shield", "Contact Outer Sphere"]
  },
  "Alienist": {
    description: "A pioneering mind-doctor familiar with nightmares, treating acute hysteria, bolstering mental fortitude, and analyzing otherworldly signals.",
    advantage: "Psyche Safeguard: High resistance to sanity-shattering anomalies, starts with a soothing Soothe Serum Syringe.",
    traits: ["Hypnotic Suggestion", "Fear Dampener", "Symptom Analysis"]
  },
  "Determined Reporter": {
    description: "A resilient truth-seeker carrying press passes, recording gear, stealth techniques, and exposing sinister cult operations to light.",
    advantage: "Undercover Aura: Harder for cultists to detect in key social events, starts with a heavy Vintage Flash Camera.",
    traits: ["Expose Weakness", "Press Immunity", "Keen Observer"]
  },
  // Deep Space Voyage
  "Starship Pilot": {
    description: "An ace helm officer possessing hyper-reflexes, orbital navigation keys, and emergency flight thruster coordinates.",
    advantage: "Thruster Assist: Extremely high evasion in piloting segments, starts with a trusty Standard Thruster Module.",
    traits: ["Evasive Maneuver", "Overload Drive", "Sensor Sweep"]
  },
  "Systems Engineer": {
    description: "A machine whisperer wielding plasma torches, override algorithms, and kinetic tools to configure decaying hulls.",
    advantage: "Scrap Fusion: Can salvage stray wreckage pieces to upgrade equipment, starts with an Arc Plasma Welder.",
    traits: ["Jury-Rig", "Drone Command", "Structural Bypass"]
  },
  "Xenobiologist": {
    description: "A pioneering medical researcher tracking alien genome signatures, planetary atmospheres, mutations, and organic countermeasures.",
    advantage: "Biosphere Database: Able to identify organic flora/fauna hazards instantly, starts with an advanced Xeno-Scanner.",
    traits: ["Sample Extraction", "Anti-toxin Synthesis", "Pheromone Mimicry"]
  },
  "Scrap Salvager": {
    description: "A derelict vessel nomad expert in jury-rigging, gravity anchors, finding resource caches, and handling heavy industrial steel hooks.",
    advantage: "Hoarder Instinct: Uncovers extra hidden storage lockers, starts with a Lucky Grapple Grabber.",
    traits: ["Debris Mining", "Magnetic Pulser", "Scrap Armor"]
  },
  // Plunder Seas
  "Galleon Captain": {
    description: "A charismatic leader carrying heavy flintlocks, mutiny survival strategies, and high-seas navigation blueprints.",
    advantage: "Dread Authority: Commands pirate and merchant NPCs alike, starts with an Ornate Captain's Cutlass.",
    traits: ["Guiding Shot", "Inspirational Roar", "Broadside Order"]
  },
  "Cutthroat Cannoneer": {
    description: "A heavy demolitions veteran specializing in loaded powder kegs, siege weaponry, and raw double-barreled physical force.",
    advantage: "Powder Blast: High demolition capabilities, starts with a heavy Hand Cannon and quick-ignite fuses.",
    traits: ["Ignite Fuse", "Heavy Impact", "Fortress Breach"]
  },
  "Sea Witch": {
    description: "A mysterious ritualist channeling storm-magic currents, oceanic protection curses, and identifying cursed sea-siren gold.",
    advantage: "Siren Resonance: Immune to oceanic madness curses, starts with a glowing Sea Coral Focus.",
    traits: ["Tempest Curse", "Tide Call", "Siren Charm"]
  },
  "Rogue Navigator": {
    description: "A swift tide-scout navigating treacherous uncharted rifts, lockpicking damp chests, and predicting tidal waves.",
    advantage: "Rift Walker: High dynamic navigation response, starts with an iron Spyglass and a Compass Key.",
    traits: ["Tide Calculation", "Gale Dash", "Vortex Drift"]
  }
};

export default function ThemeSelector({ onStart, loading }: ThemeSelectorProps) {
  const [theme, setTheme] = useState<PresetTheme>(PRESET_THEMES[0]);
  const [stylePreset, setStylePreset] = useState<PresetStyle>(PRESET_STYLES[0]);
  const [customStyle, setCustomStyle] = useState("");
  const [useCustomStyle, setUseCustomStyle] = useState(false);
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [characterName, setCharacterName] = useState("");
  const [characterBackground, setCharacterBackground] = useState("");
  const [characterClass, setCharacterClass] = useState(PRESET_THEMES[0].classes[0]);
  const [characterSuffix, setCharacterSuffix] = useState(PERSONALITY_SUFFIXES[0].suffix);

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
    
    // Embed class details & advantage in characterClass for seamless model ingestion
    const descObj = CLASS_DESCRIPTIONS[characterClass];
    
    const chosenSuffixObj = PERSONALITY_SUFFIXES.find(s => s.suffix === characterSuffix);
    const suffixPrompt = chosenSuffixObj ? chosenSuffixObj.promptExtra : "";

    const fullClassString = descObj 
      ? `${characterClass} — Advantage: ${descObj.advantage}. Overview: ${descObj.description}. ${suffixPrompt}`
      : `${characterClass}. ${suffixPrompt}`;

    const baseName = characterName.trim() || "Mysterious Wanderer";
    let finalName = baseName;
    if (characterSuffix && !baseName.toLowerCase().endsWith(characterSuffix.toLowerCase())) {
      finalName = `${baseName} ${characterSuffix}`;
    }

    onStart({
      theme: theme.name,
      artStyle: finalStyle,
      imageSize,
      characterName: finalName,
      characterClass: fullClassString,
      characterBackground: characterBackground.trim()
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

          <div className="pt-2">
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
              <span>Background / Motivation (Optional)</span>
              <span className="text-[9px] text-indigo-400 normal-case font-mono font-medium">Influences early-game story and NPC interactions</span>
            </label>
            <textarea
              maxLength={300}
              placeholder="What drives your hero? (e.g. 'Seeking the fabled heartstone to cure my dying village', 'Hunted by the Crimson Guild after stealing their prototype energy cube')..."
              value={characterBackground}
              onChange={(e) => setCharacterBackground(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-none px-4 py-3 text-slate-200 text-xs outline-none transition-all placeholder:text-slate-600 font-mono resize-none leading-relaxed"
            />
          </div>

          {/* PERSONALITY SUFFIX SELECTION */}
          <div className="border-t border-slate-800/60 pt-4 space-y-3" id="personality-suffix-section">
            <div className="flex justify-between items-center">
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                CHARACTER PERSONALITY SUFFIX (E.G. "MODAK THE WISE")
              </label>
              <span className="text-[9px] text-indigo-400 font-mono font-semibold hidden sm:inline">
                Narrative dialouge tone aligns with this trait
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {PERSONALITY_SUFFIXES.map((item) => (
                <button
                  key={item.suffix}
                  type="button"
                  onClick={() => setCharacterSuffix(item.suffix)}
                  className={`px-2 py-2 text-[10px] font-semibold border transition-all text-center rounded-none font-mono cursor-pointer ${
                    characterSuffix === item.suffix
                      ? "bg-indigo-950/40 border-indigo-500 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.2)] font-bold text-white"
                      : "bg-slate-950 border-slate-800 text-slate-450 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {item.suffix}
                </button>
              ))}
            </div>

            {/* Suffix Dossier Panel */}
            {characterSuffix && (
              <div className="bg-indigo-950/10 border border-indigo-500/15 p-3.5 font-mono text-[10px] text-slate-450 leading-relaxed rounded-none" id="suffix-dossier-panel">
                <span className="text-indigo-400 font-bold uppercase tracking-wider text-[9px] mr-1.5">[ACTIVE INFLUENCE COGNITION]</span>
                <span className="text-slate-300 font-sans">
                  {PERSONALITY_SUFFIXES.find(s => s.suffix === characterSuffix)?.description}
                </span>
              </div>
            )}
          </div>

          {/* CLASS DOSSIER CARD */}
          {CLASS_DESCRIPTIONS[characterClass] && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 bg-slate-950/70 border border-slate-800 p-4 font-mono space-y-3"
              id="class-dossier"
            >
              <div className="flex items-center justify-between border-b border-secondary border-slate-900 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-indigo-500"></span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    Class Dossier: {characterClass}
                  </span>
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-indigo-950/60 border border-indigo-500/35 text-indigo-300 font-semibold uppercase tracking-widest">
                  Starting Kit Primed
                </span>
              </div>
              
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                {CLASS_DESCRIPTIONS[characterClass].description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[10px] text-slate-400">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Special Starting Advantage</span>
                  <span className="text-emerald-400 font-semibold block bg-emerald-950/10 border border-emerald-900/30 px-2 py-1">
                    {CLASS_DESCRIPTIONS[characterClass].advantage}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Specialized Tactical Traits</span>
                  <div className="flex flex-wrap gap-1">
                    {CLASS_DESCRIPTIONS[characterClass].traits.map((trait, i) => (
                      <span 
                        key={i} 
                        className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 text-slate-400 font-semibold uppercase font-mono"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
