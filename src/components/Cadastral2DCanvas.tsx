import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Parcel, Building } from '../types/cadastral';
import { ContextFeature } from '../data/gisMockData';
import { Maximize, Box, Map as MapIcon, Crosshair } from 'lucide-react';

interface Cadastral2DCanvasProps {
  parcels: Parcel[];
  features: ContextFeature[];
  selectedParcelId: string;
  selectedBuildingId: string;
  onSelectParcel: (parcelId: string) => void;
  onSelectBuilding: (buildingId: string) => void;
  onSwitchTo3D: () => void;
}

const ORIGIN_LAT = 21.1458;
const ORIGIN_LNG = 79.0882;
const DEG_TO_METERS = 111111;

function getLocalCoordinates(lat: number, lng: number) {
  const z = (lat - ORIGIN_LAT) * DEG_TO_METERS;
  const x = (lng - ORIGIN_LNG) * Math.cos(ORIGIN_LAT * Math.PI / 180) * DEG_TO_METERS;
  return { x, z: -z }; // Invert z for typical 2D canvas (y points down)
}

export default function Cadastral2DCanvas({
  parcels,
  features,
  selectedParcelId,
  selectedBuildingId,
  onSelectParcel,
  onSelectBuilding,
  onSwitchTo3D
}: Cadastral2DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredEntity, setHoveredEntity] = useState<{ type: 'parcel'|'building', id: string, name: string } | null>(null);

  // Auto-fit locality on first load
  useEffect(() => {
    if (parcels.length > 0 && containerRef.current) {
      handleFitLocality();
    }
  }, [parcels.length]);

  const handleFitLocality = useCallback(() => {
    if (!containerRef.current || parcels.length === 0) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Find bounds
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    parcels.forEach(p => {
      const { x, z } = getLocalCoordinates(p.latitude, p.longitude);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });
    
    const rangeX = (maxX - minX) || 100;
    const rangeZ = (maxZ - minZ) || 100;
    
    const scaleX = width / (rangeX + 200);
    const scaleZ = height / (rangeZ + 200);
    const scale = Math.min(scaleX, scaleZ);
    
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    
    setTransform({
      x: width / 2 - centerX * scale,
      y: height / 2 - centerZ * scale,
      scale
    });
  }, [parcels]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#0F172A'; // Slate-950
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // Grid lines for reference
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1 / transform.scale;
    const gridSize = 100;
    for (let i = -2000; i <= 2000; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, -2000);
      ctx.lineTo(i, 2000);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-2000, i);
      ctx.lineTo(2000, i);
      ctx.stroke();
    }

    // Draw contextual features (Roads, Parks)
    features.forEach(f => {
      const { x, z } = getLocalCoordinates(f.latitude, f.longitude);
      ctx.fillStyle = f.type === 'ROAD' ? '#334155' : (f.color || '#475569');
      ctx.globalAlpha = f.type === 'ROAD' ? 1.0 : 0.6;
      ctx.fillRect(x - f.widthM / 2, z - f.depthM / 2, f.widthM, f.depthM);
    });

    ctx.globalAlpha = 1.0;

    // Draw parcels
    parcels.forEach(p => {
      const { x, z } = getLocalCoordinates(p.latitude, p.longitude);
      const size = Math.sqrt(p.areaSqM || 100);
      const isSelected = p.id === selectedParcelId;

      ctx.fillStyle = isSelected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.05)';
      ctx.strokeStyle = isSelected ? '#10b981' : '#475569';
      ctx.lineWidth = isSelected ? 3 / transform.scale : 1 / transform.scale;
      
      ctx.beginPath();
      ctx.rect(x - size / 2, z - size / 2, size, size);
      ctx.fill();
      ctx.stroke();

      // Draw buildings
      p.buildings.forEach(b => {
        const isBldgSelected = b.id === selectedBuildingId;
        const bPos = getLocalCoordinates(b.latitude, b.longitude);
        
        let bw = 8, bd = 8;
        if (b.footprintPolygon && b.footprintPolygon.length > 0) {
          let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
          b.footprintPolygon.forEach(pt => {
            if (pt[0] < minX) minX = pt[0];
            if (pt[0] > maxX) maxX = pt[0];
            if (pt[1] < minZ) minZ = pt[1];
            if (pt[1] > maxZ) maxZ = pt[1];
          });
          bw = (maxX - minX);
          bd = (maxZ - minZ);
        }

        ctx.fillStyle = isBldgSelected ? '#f59e0b' : '#cbd5e1';
        ctx.strokeStyle = isBldgSelected ? '#fff' : '#64748b';
        ctx.lineWidth = 1 / transform.scale;
        
        ctx.beginPath();
        ctx.rect(bPos.x - bw / 2, bPos.z - bd / 2, bw, bd);
        ctx.fill();
        ctx.stroke();
      });
    });

    ctx.restore();
  }, [parcels, features, transform, selectedParcelId, selectedBuildingId]);

  // Handle interactions
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoomFactor = Math.exp(wheel * zoomIntensity);
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform(prev => {
      const newScale = Math.max(0.1, Math.min(prev.scale * zoomFactor, 20));
      return {
        x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
        y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
        scale: newScale
      };
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }

    // Hit test for hover
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - transform.x) / transform.scale;
    const mouseZ = (e.clientY - rect.top - transform.y) / transform.scale;

    let found: { type: 'parcel'|'building', id: string, name: string } | null = null;
    
    for (let i = parcels.length - 1; i >= 0; i--) {
      const p = parcels[i];
      // Check buildings first (z-index wise)
      for (let j = p.buildings.length - 1; j >= 0; j--) {
        const b = p.buildings[j];
        const bPos = getLocalCoordinates(b.latitude, b.longitude);
        let bw = 8, bd = 8;
        if (b.footprintPolygon && b.footprintPolygon.length > 0) {
          bw = Math.max(...b.footprintPolygon.map(pt => pt[0])) - Math.min(...b.footprintPolygon.map(pt => pt[0]));
          bd = Math.max(...b.footprintPolygon.map(pt => pt[1])) - Math.min(...b.footprintPolygon.map(pt => pt[1]));
        }
        if (Math.abs(mouseX - bPos.x) <= bw/2 && Math.abs(mouseZ - bPos.z) <= bd/2) {
          found = { type: 'building', id: b.id, name: b.name };
          break;
        }
      }
      if (found) break;

      // Check parcel
      const pPos = getLocalCoordinates(p.latitude, p.longitude);
      const size = Math.sqrt(p.areaSqM || 100);
      if (Math.abs(mouseX - pPos.x) <= size/2 && Math.abs(mouseZ - pPos.z) <= size/2) {
        found = { type: 'parcel', id: p.id, name: p.surveyNumber };
        break;
      }
    }
    
    setHoveredEntity(found);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hoveredEntity) {
      if (hoveredEntity.type === 'building') {
        onSelectBuilding(hoveredEntity.id);
      } else {
        onSelectParcel(hoveredEntity.id);
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#0F172A] select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Top Left Toolbar */}
      <div className="absolute top-4 left-4 z-10 w-72 glass-strong border border-cyber/20 rounded-xl shadow-2xl overflow-hidden flex flex-col pointer-events-none">
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/80 pointer-events-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-emerald" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">2D Cadastral</h2>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            High-Performance 2D Vector Cadastre
          </p>
        </div>
        
        <div className="p-4 space-y-4 pointer-events-auto">
          <div className="p-3 bg-emerald/10 border border-emerald/30 rounded-lg text-center">
            <p className="text-xs text-emerald font-bold">Locality Scale Demonstration</p>
            <p className="text-[10px] text-emerald/80">{parcels.length.toLocaleString()} parcels loaded</p>
            <p className="text-[9px] text-emerald/60 mt-1">DEMO / SYNTHETIC CADASTRAL DATA</p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleFitLocality}
              className="flex-1 py-2 bg-slate-800 text-slate-300 hover:text-white font-bold rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-xs flex items-center justify-center gap-2"
            >
              <Crosshair className="w-3 h-3" /> FIT LOCALITY
            </button>
          </div>
          
          <button 
            onClick={onSwitchTo3D}
            className="w-full py-2.5 bg-gradient-to-r from-emerald to-cyber text-slate-900 font-bold rounded-lg hover:scale-[1.02] transition-all shadow-lg text-xs flex items-center justify-center gap-2"
          >
            <Box className="w-4 h-4" /> OPEN 3D LOCALITY
          </button>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredEntity && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-full shadow-lg text-xs text-white flex items-center gap-2 pointer-events-none font-mono">
          <span className="text-emerald">{hoveredEntity.type === 'parcel' ? 'Parcel' : 'Building'}</span>
          <span className="text-slate-400">{hoveredEntity.id}</span>
          <span className="font-bold">{hoveredEntity.name}</span>
        </div>
      )}
    </div>
  );
}
