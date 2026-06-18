import React, { useState } from "react";
import { motion } from "motion/react";
import { GameState, VisitedCoordinate } from "../types";
import { Compass, MapPin, Sparkles, Navigation, Info, Eye } from "lucide-react";

interface MiniMapProps {
  state: GameState;
}

export default function MiniMap({ state }: MiniMapProps) {
  const [selectedNode, setSelectedNode] = useState<{ name: string; x: number; y: number; step?: number; type: string } | null>(null);
  const [zoom, setZoom] = useState<number>(18); // Pixels per grid unit

  const { currentLocation, visitedCoords = [], stepCount } = state;

  // Current positions
  const currentX = currentLocation?.x ?? 0;
  const currentY = currentLocation?.y ?? 0;
  const currentName = currentLocation?.name || "Unknown Coordinates";
  const currentRegion = currentLocation?.region || "Unknown Continuum";

  // Build a unique set of explored points
  const pointsMap = new Map<string, VisitedCoordinate>();
  visitedCoords.forEach((pt) => {
    pointsMap.set(`${pt.x},${pt.y}`, pt);
  });
  
  // Make sure current position is represented
  if (currentLocation && currentLocation.x !== undefined && currentLocation.y !== undefined) {
    const key = `${currentLocation.x},${currentLocation.y}`;
    if (!pointsMap.has(key)) {
      pointsMap.set(key, {
        name: currentName,
        x: currentLocation.x,
        y: currentLocation.y,
        step: stepCount
      });
    }
  }

  const exploredNodes = Array.from(pointsMap.values());

  // Procedural positioning for unexplored POIs using deterministic hashing
  const getPoiDisplacement = (name: string, baseX: number, baseY: number) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
    // Grid distance 2 to 4
    const distance = 2.5 + (Math.abs(hash >> 3) % 2); 
    const dx = Math.round(Math.cos(angle) * distance);
    const dy = Math.round(Math.sin(angle) * distance);
    
    // Check conflicts, shift slightly if needed
    return {
      x: baseX + (dx === 0 ? 2 : dx),
      y: baseY + (dy === 0 ? 2 : dy)
    };
  };

  const unexploredPOIs = (currentLocation?.unexploredPOIs || []).map((poi) => {
    const loc = getPoiDisplacement(poi, currentX, currentY);
    return {
      name: poi,
      x: loc.x,
      y: loc.y,
      type: "unexplored"
    };
  });

  // SVG parameters
  const width = 320;
  const height = 260;
  const centerX = width / 2;
  const centerY = height / 2;

  // Convert grid (x, y) to SVG screen coordinates centering on current player position
  const toScreen = (gx: number, gy: number) => {
    const screenX = centerX + (gx - currentX) * zoom;
    const screenY = centerY - (gy - currentY) * zoom; // Invert Y axis
    return { x: screenX, y: screenY };
  };

  // Generate background grid lines based on offset from player position
  const renderBackgroundGrid = () => {
    const cells = 8;
    const lines = [];

    // vertical grid lines
    const startCellX = Math.floor((currentX - cells) / 2) * 2;
    const endCellX = Math.ceil((currentX + cells) / 2) * 2;
    for (let gx = startCellX; gx <= endCellX; gx += 2) {
      const { x } = toScreen(gx, 0);
      if (x >= 0 && x <= width) {
        lines.push(
          <line
            key={`v-${gx}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke="#1e293b"
            strokeWidth="0.5"
            strokeDasharray={gx === 0 ? "0" : "1, 4"}
            opacity={gx === 0 ? 0.6 : 0.3}
          />
        );
      }
    }

    // horizontal grid lines
    const startCellY = Math.floor((currentY - cells) / 2) * 2;
    const endCellY = Math.ceil((currentY + cells) / 2) * 2;
    for (let gy = startCellY; gy <= endCellY; gy += 2) {
      const { y } = toScreen(0, gy);
      if (y >= 0 && y <= height) {
        lines.push(
          <line
            key={`h-${gy}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="#1e293b"
            strokeWidth="0.5"
            strokeDasharray={gy === 0 ? "0" : "1, 4"}
            opacity={gy === 0 ? 0.6 : 0.3}
          />
        );
      }
    }

    // Radial sweep rings centered on the active coordinate
    const rings = [1.5, 3.5, 6];
    rings.forEach((r, idx) => {
      const rPx = r * zoom;
      lines.push(
        <circle
          key={`ring-${idx}`}
          cx={centerX}
          cy={centerY}
          r={rPx}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="0.5"
          strokeDasharray="2, 8"
          opacity={0.15 - idx * 0.03}
        />
      );
    });

    return lines;
  };

  // Generate connection line path
  const sortedExplored = [...exploredNodes].sort((a, b) => a.step - b.step);
  
  const pointsPathString = sortedExplored
    .map((pt, idx) => {
      const { x, y } = toScreen(pt.x, pt.y);
      return `${idx === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-4 font-mono space-y-4 rounded" id="mini-map-container">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Procedural Reality Map</span>
        </div>
        <div className="text-[9px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          GRID [{currentX}, {currentY}]
        </div>
      </div>

      {/* RENDER VIEWPORT CAROUSEL */}
      <div className="relative overflow-hidden w-full h-[260px] bg-slate-950 border border-slate-800 flex items-center justify-center rounded">
        {/* Radar Sweep FX */}
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-5"></div>

        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="cursor-crosshair select-none">
          {/* Background grid indicators */}
          {renderBackgroundGrid()}

          {/* SENSOR SWEEP LINE */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + Math.cos((Date.now() / 1500) % (Math.PI * 2)) * 120}
            y2={centerY + Math.sin((Date.now() / 1500) % (Math.PI * 2)) * 120}
            stroke="#6366f1"
            strokeWidth="0.75"
            opacity="0.12"
          />

          {/* HISTORIC PATH TAKEN LINE */}
          {sortedExplored.length > 1 && (
            <path
              d={pointsPathString}
              fill="none"
              stroke="#6366f1"
              strokeWidth="1.5"
              strokeDasharray="1, 3"
              opacity="0.55"
            />
          )}

          {/* UNEXPLORED PATHWAY LEADS (Lines radiating outward) */}
          {unexploredPOIs.map((poi, idx) => {
            const screenStart = toScreen(currentX, currentY);
            const screenEnd = toScreen(poi.x, poi.y);
            return (
              <line
                key={`path-unexplored-${idx}`}
                x1={screenStart.x}
                y1={screenStart.y}
                x2={screenEnd.x}
                y2={screenEnd.y}
                stroke="#d946ef"
                strokeWidth="1"
                strokeDasharray="2, 5"
                opacity="0.3"
              />
            );
          })}

          {/* UNEXPLORED RADAR TARGETS */}
          {unexploredPOIs.map((poi, idx) => {
            const { x, y } = toScreen(poi.x, poi.y);
            const isSelected = selectedNode?.name === poi.name;
            return (
              <g 
                key={`poi-unexplored-${idx}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode({ ...poi, step: undefined });
                }}
                className="cursor-pointer group"
              >
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#020617"
                  stroke="#d946ef"
                  strokeWidth="1.2"
                  strokeDasharray="1, 1"
                  className="group-hover:stroke-pink-400 transition-colors"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? "8" : "3"}
                  fill="none"
                  stroke="#d946ef"
                  strokeWidth="0.5"
                  className="animate-ping"
                  style={{ animationDuration: "3s" }}
                  opacity="0.3"
                />
                <text
                  x={x}
                  y={y + 3}
                  fontSize="7"
                  fontFamily="monospace"
                  fill="#d946ef"
                  textAnchor="middle"
                  className="font-bold select-none group-hover:fill-pink-300"
                >
                  ?
                </text>
              </g>
            );
          })}

          {/* EXPLORED TIMELINE CHECKPOINTS */}
          {exploredNodes.map((node, idx) => {
            const { x, y } = toScreen(node.x, node.y);
            const isPlayerCurrent = node.x === currentX && node.y === currentY;
            const isOrigin = node.x === 0 && node.y === 0;
            const isSelected = selectedNode?.x === node.x && selectedNode?.y === node.y;

            return (
              <g
                key={`explored-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode({ ...node, type: isOrigin ? "origin" : "checkpoint" });
                }}
                className="cursor-pointer group"
              >
                {/* Visual pulse for player position */}
                {isPlayerCurrent && (
                  <>
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1"
                      opacity="0.2"
                      className="animate-ping"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="0.75"
                      opacity="0.35"
                    />
                  </>
                )}

                {/* Main node bubble */}
                <circle
                  cx={x}
                  cy={y}
                  r={isPlayerCurrent ? "5.5" : isSelected ? "5.5" : "4.5"}
                  fill={isPlayerCurrent ? "#10b981" : isOrigin ? "#3b82f6" : "#1e293b"}
                  stroke={isSelected ? "#ffffff" : isPlayerCurrent ? "#059669" : isOrigin ? "#2563eb" : "#4f46e5"}
                  strokeWidth={isSelected ? "1.5" : "1"}
                  className="group-hover:stroke-indigo-400 group-hover:scale-110 transition-transform"
                />

                {/* Inner marker decoration */}
                {isOrigin && !isPlayerCurrent && (
                  <circle cx={x} cy={y} r="1.5" fill="#ffffff" />
                )}
              </g>
            );
          })}
        </svg>

        {/* MAP OVERLAYS */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 border border-slate-800 px-2 py-1 flex items-center gap-1 text-[9px] text-slate-400 rounded">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span className="truncate max-w-[150px]" title={currentName}>{currentName}</span>
        </div>

        {/* CONTROLS (Zom In/Out) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            onClick={() => setZoom(Math.min(zoom + 4, 32))}
            title="Magnify Spatial Array"
            className="w-5 h-5 flex items-center justify-center bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-100 rounded active:scale-90"
          >
            +
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 4, 10))}
            title="Distant Scanner Array"
            className="w-5 h-5 flex items-center justify-center bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-100 rounded active:scale-90"
          >
            -
          </button>
        </div>
      </div>

      {/* QUICK STATS & DETAIL INSPECTION FOLLOWER */}
      <div className="bg-slate-950 p-3 border border-slate-850 space-y-2 rounded">
        {selectedNode ? (
          <div className="space-y-1 animate-fade-in text-[10px]">
            <div className="flex items-center justify-between text-slate-500 border-b border-slate-900 pb-1">
              <span className="font-bold text-[8px] uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3 h-3 text-indigo-400" />
                Mapped Node Signal
              </span>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-slate-300 transform scale-90"
              >
                ✕
              </button>
            </div>
            <div className="text-slate-200 font-bold flex items-center justify-between">
              <span className="truncate max-w-[190px]">{selectedNode.name}</span>
              <span className="text-[8px] px-1 bg-slate-900 border border-slate-800 text-indigo-400 rounded uppercase">
                {selectedNode.type}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 leading-normal">
              Coordinates: ({selectedNode.x}, {selectedNode.y}).
              {selectedNode.step !== undefined 
                ? ` Discovered during timeline stage step ${selectedNode.step}.` 
                : " Currently waiting to be crossed in future choices."}
            </p>
          </div>
        ) : (
          <div className="text-[10px] text-slate-450 text-slate-400 space-y-1.5 leading-relaxed">
            <div className="flex items-center justify-between text-slate-500 text-[8px] border-b border-slate-900 pb-1">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-500" />
                Continuum Mappings
              </span>
              <span>ACTIVE SCAN</span>
            </div>
            <p className="text-[9px] text-slate-400">
              Region: <span className="text-indigo-400 font-bold uppercase">{currentRegion}</span>
            </p>
            <p className="text-[9px] text-slate-500">
              Select any map marker node (including coordinates or pathways ?) to read specific historical timeline logs.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
