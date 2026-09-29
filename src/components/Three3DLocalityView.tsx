import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Html, Instances, Instance, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { Maximize, Layers, Crosshair } from 'lucide-react';
import { Parcel, Building } from '../types/cadastral';
import { ContextFeature } from '../data/gisMockData';

interface Three3DLocalityViewProps {
  parcels: Parcel[];
  features: ContextFeature[];
  selectedBuildingId: string | null;
  onSelectBuilding: (buildingId: string) => void;
  onOpenDetailedView: () => void;
}

const ORIGIN_LAT = 21.1458;
const ORIGIN_LNG = 79.0882;
const DEG_TO_METERS = 111111;

function getLocalCoordinates(lat: number, lng: number) {
  const x = (lng - ORIGIN_LNG) * (DEG_TO_METERS * Math.cos(ORIGIN_LAT * Math.PI / 180));
  const z = -(lat - ORIGIN_LAT) * DEG_TO_METERS;
  return { x, z };
}

function InstancedBuildings({ 
  buildings, 
  selectedId, 
  onSelect 
}: { 
  buildings: Building[], 
  selectedId: string | null,
  onSelect: (id: string) => void
}) {
  return (
    <Instances limit={10000} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} metalness={0.1} />
      {buildings.map((b) => {
        const height = b.totalHeightM || (b.totalFloors * (b.floorHeightM || 3.2));
        let width = 8;
        let depth = 8;

        if (b.footprintPolygon && b.footprintPolygon.length > 0) {
          const xs = b.footprintPolygon.map(p => p[0]);
          const zs = b.footprintPolygon.map(p => p[1]);
          width = Math.max(1, Math.max(...xs) - Math.min(...xs));
          depth = Math.max(1, Math.max(...zs) - Math.min(...zs));
        }

        const { x, z } = getLocalCoordinates(b.latitude, b.longitude);
        const isSelected = selectedId === b.id;
        const color = isSelected ? '#f59e0b' : '#94A3B8';

        return (
          <Instance
            key={b.id}
            position={[x, height / 2, z]}
            scale={[width, height, depth]}
            color={color}
            onClick={(e) => { e.stopPropagation(); onSelect(b.id); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = ''; }}
          />
        );
      })}
    </Instances>
  );
}

function InstancedParcels({ parcels, selectedParcelId }: { parcels: Parcel[], selectedParcelId: string | null }) {
  return (
    <Instances limit={10000} receiveShadow>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial opacity={0.4} transparent />
      {parcels.map(p => {
        const { x, z } = getLocalCoordinates(p.latitude, p.longitude);
        const size = Math.sqrt(p.areaSqM || 100) * 0.95; // 0.95 to create visual gap between parcels
        
        return (
          <Instance
            key={p.id}
            position={[x, 0.02, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[size, size, 1]}
            color={p.id === selectedParcelId ? '#10b981' : '#334155'}
          />
        );
      })}
    </Instances>
  );
}

function InstancedRoads({ features }: { features: ContextFeature[] }) {
  const roads = features.filter(f => f.type === 'ROAD');
  if (roads.length === 0) return null;
  return (
    <Instances limit={500} receiveShadow>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial roughness={1} />
      {roads.map(f => {
        const { x, z } = getLocalCoordinates(f.latitude, f.longitude);
        return (
          <Instance
            key={f.id}
            position={[x, 0.05, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[f.widthM, f.depthM, 1]}
            color={f.color || '#334155'}
          />
        );
      })}
    </Instances>
  );
}

function InstancedParksAndComm({ features }: { features: ContextFeature[] }) {
  const others = features.filter(f => f.type !== 'ROAD');
  if (others.length === 0) return null;
  
  return (
    <Instances limit={500} receiveShadow castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.9} />
      {others.map(f => {
        const { x, z } = getLocalCoordinates(f.latitude, f.longitude);
        const h = f.heightM || 0.1;
        return (
          <Instance
            key={f.id}
            position={[x, h / 2, z]}
            scale={[f.widthM, h, f.depthM]}
            color={f.color || '#22c55e'}
          />
        );
      })}
    </Instances>
  );
}

function UndergroundInfrastructure() {
  const generateNetwork = (count: number, yLevel: number, radius: number, gridSpacing: number) => {
    const segments = [];
    // Fixed seed replacement for consistent demo look
    let seed = 12345 + Math.abs(yLevel) * 100;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      const isHoriz = random() > 0.5;
      const numSegments = 2 + Math.floor(random() * 8);
      const length = gridSpacing * numSegments;
      const cx = Math.round(((random() - 0.5) * 1200) / gridSpacing) * gridSpacing;
      const cz = Math.round(((random() - 0.5) * 1200) / gridSpacing) * gridSpacing;
      
      if (isHoriz) {
        segments.push({ position: [cx + length/2, yLevel, cz], scale: [radius, length, radius], rotation: [0, 0, Math.PI / 2] });
      } else {
        segments.push({ position: [cx, yLevel, cz + length/2], scale: [radius, length, radius], rotation: [Math.PI / 2, 0, 0] });
      }
    }
    return segments;
  };

  const water = useMemo(() => generateNetwork(150, -6, 1.2, 20), []);
  const electrical = useMemo(() => generateNetwork(200, -3, 0.6, 10), []);
  const optical = useMemo(() => generateNetwork(300, -1.5, 0.3, 5), []);
  const utility = useMemo(() => generateNetwork(100, -10, 1.8, 30), []);

  return (
    <group>
      {/* Water: blue/cyan */}
      <Instances limit={water.length} castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#06b6d4" roughness={0.3} metalness={0.6} emissive="#06b6d4" emissiveIntensity={0.2} />
        {water.map((s, i) => <Instance key={`w-${i}`} position={s.position as any} scale={s.scale as any} rotation={s.rotation as any} />)}
      </Instances>
      
      {/* Electrical: yellow/orange */}
      <Instances limit={electrical.length} castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.5} metalness={0.8} emissive="#f59e0b" emissiveIntensity={0.3} />
        {electrical.map((s, i) => <Instance key={`e-${i}`} position={s.position as any} scale={s.scale as any} rotation={s.rotation as any} />)}
      </Instances>

      {/* Optical: purple/magenta */}
      <Instances limit={optical.length} castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshStandardMaterial color="#d946ef" roughness={0.2} metalness={0.9} emissive="#d946ef" emissiveIntensity={0.5} />
        {optical.map((s, i) => <Instance key={`o-${i}`} position={s.position as any} scale={s.scale as any} rotation={s.rotation as any} />)}
      </Instances>

      {/* Utility: green/teal */}
      <Instances limit={utility.length} castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#14b8a6" roughness={0.6} metalness={0.4} emissive="#14b8a6" emissiveIntensity={0.2} />
        {utility.map((s, i) => <Instance key={`u-${i}`} position={s.position as any} scale={s.scale as any} rotation={s.rotation as any} />)}
      </Instances>
    </group>
  );
}

export default function Three3DLocalityView({
  parcels,
  features,
  selectedBuildingId,
  onSelectBuilding,
  onOpenDetailedView
}: Three3DLocalityViewProps) {
  
  const allBuildings = useMemo(() => {
    return parcels.flatMap(p => p.buildings);
  }, [parcels]);

  const selectedBuilding = allBuildings.find(b => b.id === selectedBuildingId);
  const selectedParcelId = selectedBuilding?.parentParcelId || null;

  const controlsRef = useRef<any>(null);

  const handleFitLocality = () => {
    if (controlsRef.current) {
      // Zoom out to see a large area
      controlsRef.current.object.position.set(200, 300, 200);
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  useEffect(() => {
    if (selectedBuilding && controlsRef.current) {
      const { x, z } = getLocalCoordinates(selectedBuilding.latitude, selectedBuilding.longitude);
      const h = selectedBuilding.totalHeightM || 10;
      controlsRef.current.target.set(x, h/2, z);
    }
  }, [selectedBuildingId]);

  return (
    <div className="relative w-full h-full bg-[#0F172A] overflow-hidden">
      <Canvas shadows camera={{ position: [200, 300, 200], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[100, 150, 100]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
        
        <group position={[0, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[5000, 5000]} />
            <meshStandardMaterial color="#0B0F19" roughness={1} transparent opacity={0.75} depthWrite={false} />
          </mesh>
          <Grid args={[2000, 2000]} cellSize={5} cellThickness={0.5} cellColor="#1E293B" sectionSize={50} sectionColor="#334155" fadeDistance={1500} />
          <ContactShadows opacity={0.6} scale={500} blur={2} far={20} color="#000000" />
        </group>

        <InstancedParcels parcels={parcels} selectedParcelId={selectedParcelId} />
        <InstancedRoads features={features} />
        <InstancedParksAndComm features={features} />
        
        <UndergroundInfrastructure />
        
        <InstancedBuildings 
          buildings={allBuildings} 
          selectedId={selectedBuildingId}
          onSelect={onSelectBuilding}
        />

        {selectedBuilding && (
          <Html position={[
            getLocalCoordinates(selectedBuilding.latitude, selectedBuilding.longitude).x, 
            (selectedBuilding.totalHeightM || 10) + 5, 
            getLocalCoordinates(selectedBuilding.latitude, selectedBuilding.longitude).z
          ]} center zIndexRange={[100, 0]}>
            <div className="bg-slate-900 border border-emerald/50 px-2 py-1 rounded text-[10px] text-emerald font-mono whitespace-nowrap shadow-lg">
              {selectedBuilding.name || selectedBuilding.id}
            </div>
          </Html>
        )}

        <Environment preset="city" />
        <OrbitControls 
          ref={controlsRef}
          enablePan 
          enableZoom 
          enableRotate 
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={10}
          maxDistance={1500}
        />
      </Canvas>

      <div className="absolute top-4 left-4 z-10 w-72 glass-strong border border-cyber/20 rounded-xl shadow-2xl overflow-hidden flex flex-col pointer-events-none">
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/80 pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-emerald" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3D Locality Model</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {allBuildings.length.toLocaleString()} Urban Volumes Loaded
          </p>
        </div>
        
        <div className="p-4 space-y-4 pointer-events-auto">
          <div className="p-3 bg-emerald/10 border border-emerald/30 rounded-lg text-center">
             <p className="text-[9px] text-emerald/60 uppercase">DEMO / SYNTHETIC CADASTRAL DATA</p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleFitLocality}
              className="flex-1 py-2 bg-slate-800 text-slate-300 hover:text-white font-bold rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-xs flex items-center justify-center gap-2"
            >
              <Crosshair className="w-3 h-3" /> FIT LOCALITY
            </button>
          </div>

          {selectedBuilding ? (
            <div className="space-y-3 animate-fade-in mt-4">
              <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selected Building</h3>
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-emerald font-mono">ID:</span>
                  <span className="text-[10px] text-white font-bold truncate max-w-[150px] text-right" title={selectedBuilding.id}>{selectedBuilding.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-emerald font-mono">Height:</span>
                  <span className="text-[10px] text-white font-bold">{selectedBuilding.totalHeightM || (selectedBuilding.totalFloors * (selectedBuilding.floorHeightM || 3.2))}m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-emerald font-mono">Floors:</span>
                  <span className="text-[10px] text-white font-bold">{selectedBuilding.totalFloors}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                  <span className="text-[10px] text-emerald font-mono">Engine:</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">InstancedMesh</span>
                </div>
              </div>
              <button 
                onClick={onOpenDetailedView}
                className="w-full py-2.5 bg-gradient-to-r from-emerald to-cyber text-slate-900 font-bold rounded-lg hover:scale-[1.02] transition-all shadow-lg glow-emerald text-xs flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
              >
                <Maximize className="w-4 h-4" />
                OPEN DETAILED BUILDING
              </button>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-500 font-mono">Select a building volume to inspect.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
