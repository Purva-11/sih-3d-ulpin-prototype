import React, { useState } from 'react';
import { DataSourceInfo } from '../types/cadastral';
import { Server, Satellite, Mountain, Layers, CheckCircle2, Globe, Radio } from 'lucide-react';

interface DataSourcesPanelProps {
  sources: DataSourceInfo[];
}

export default function DataSourcesPanel({ sources }: DataSourcesPanelProps) {
  const [elevationMode, setElevationMode] = useState<'DEM' | 'DSM'>('DEM');

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-950 text-white overflow-hidden p-6 gap-6">
      {/* Left Data Sources List */}
      <div className="w-full md:w-96 glass-strong rounded-2xl border border-cyber/20 p-5 space-y-4 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Registry Data Sources</h2>
              <p className="text-[10px] text-slate-400 font-mono">Multi-Sensor Data Integration</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {sources.map((ds) => (
              <div key={ds.id} className="p-3 rounded-xl glass border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{ds.name}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-emerald font-mono font-semibold">
                    {ds.processingState}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">{ds.purpose}</p>
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono pt-1">
                  <span>Type: {ds.dataType}</span>
                  <span>Updated: {ds.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Feature Panel: DEM/DSM Elevation Toggle + GNSS/CORS Positioning */}
      <div className="flex-1 glass-strong rounded-2xl border border-cyber/20 p-6 overflow-y-auto space-y-6">
        {/* Section 1: DEM / DSM Elevation Visualization */}
        <div className="space-y-3 border-b border-slate-800 pb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald font-bold">Terrain Elevation Models</span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Mountain className="w-5 h-5 text-emerald" /> DEM vs DSM Elevation Profile
              </h2>
            </div>
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setElevationMode('DEM')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  elevationMode === 'DEM' ? 'bg-emerald text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                DEM (Ground Terrain)
              </button>
              <button
                onClick={() => setElevationMode('DSM')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  elevationMode === 'DSM' ? 'bg-cyber text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                DSM (Surface + Buildings)
              </button>
            </div>
          </div>

          <div className="glass p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold">
                {elevationMode === 'DEM' ? 'Digital Elevation Model (Bare Earth Z = 310.0m ASL)' : 'Digital Surface Model (Ground + 16.0m Godavari Building Volume)'}
              </span>
              <span className="text-emerald">Resolution: 1.0m Grid</span>
            </div>

            {/* Simulated Terrain SVG Diagram */}
            <div className="w-full h-40 rounded-xl bg-slate-950 border border-slate-800 p-4 relative overflow-hidden flex items-end">
              <svg viewBox="0 0 500 120" className="w-full h-full">
                {/* Bare earth ground curve */}
                <path d="M 0,90 Q 150,70 250,90 T 500,85" fill="none" stroke="#10B981" strokeWidth="3" />
                <path d="M 0,90 Q 150,70 250,90 T 500,85 L 500,120 L 0,120 Z" fill="rgba(16, 185, 129, 0.1)" />

                {/* Building structure on DSM */}
                {elevationMode === 'DSM' && (
                  <g className="animate-fade-in">
                    <rect x="180" y="25" width="80" height="65" fill="rgba(59, 130, 246, 0.4)" stroke="#60A5FA" strokeWidth="2" rx="2" />
                    <line x1="180" y1="25" x2="260" y2="25" stroke="#38BDF8" strokeWidth="3" />
                    <text x="190" y="55" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      Building DSM (+16m)
                    </text>
                  </g>
                )}
              </svg>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {elevationMode === 'DEM'
                ? 'DEM represents continuous bare-earth elevation excluding vegetation, buildings, and man-made structures.'
                : 'DSM includes natural terrain plus top elevation heights of artificial structures (essential for vertical 3D parcel registration).'}
            </p>
          </div>
        </div>

        {/* Section 2: GNSS / CORS Network Positioning */}
        <div className="space-y-3">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold">Geodetic Reference Frame</span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Satellite className="w-5 h-5 text-cyan-400" /> GNSS / CORS Network Real-Time Positioning
            </h2>
          </div>

          <div className="glass p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <Satellite className="w-5 h-5 text-cyan-400 mx-auto" />
                <span className="text-xs font-bold text-white font-mono">GNSS Satellites</span>
                <p className="text-[9px] text-slate-400">GPS / NavIC Signals</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <Radio className="w-5 h-5 text-emerald mx-auto animate-pulse" />
                <span className="text-xs font-bold text-white font-mono">CORS Station</span>
                <p className="text-[9px] text-slate-400">Continuous RTK Station</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <Globe className="w-5 h-5 text-blue-400 mx-auto" />
                <span className="text-xs font-bold text-white font-mono">Real-Time Correction</span>
                <p className="text-[9px] text-slate-400">Sub-Centimeter Accuracy</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald mx-auto" />
                <span className="text-xs font-bold text-white font-mono">Georeferenced Cadastre</span>
                <p className="text-[9px] text-slate-400">WGS84 / UTM Datum</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              The Continuously Operating Reference Stations (CORS) network delivers differential RTK corrections to ensure high-precision geodetic spatial coordinates for vertical 3D property volumes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
