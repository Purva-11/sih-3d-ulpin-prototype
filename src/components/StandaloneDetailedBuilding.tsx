import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Environment, Line } from '@react-three/drei';
import * as THREE from 'three';
import { 
  MapPin, Home, Copy, User, Box, Upload, Building, Layers
} from 'lucide-react';

// ---------------------------------------------------------
// STATIC DEMO DATA (Matching the screenshot exactly)
// ---------------------------------------------------------

const DEMO_BUILDING = {
  name: "Godavari Heights - Block A",
  type: "Residential",
  totalFloors: 7,
  footprintWidth: 24,  // meters
  footprintDepth: 20,  // meters
  floors: [
    { num: 1, label: "Floor 1", height: 3.2, elevationStart: 0 },
    { num: 2, label: "Floor 2", height: 3.2, elevationStart: 3.2 },
    { num: 3, label: "Floor 3", height: 3.2, elevationStart: 6.4 },
    { num: 4, label: "Floor 4", height: 3.2, elevationStart: 9.6 },
    { num: 5, label: "Floor 5", height: 3.2, elevationStart: 12.8 },
    { num: 6, label: "Floor 6", height: 3.2, elevationStart: 16.0 },
    { num: 7, label: "Floor 7", height: 3.2, elevationStart: 19.2 },
  ]
};

const getFloorProperties = (floorNum: number) => {
  return [1, 2].map(unit => ({
    id: `U${floorNum}0${unit}`,
    unitNum: `Flat ${floorNum}0${unit}`,
    area: 80.82, // m2
    sqft: unit === 1 ? 880 : 870,
    owner: `Sunita Patil`,
  }));
};

// ---------------------------------------------------------
// 3D RENDERING COMPONENTS
// ---------------------------------------------------------

function DemoBuildingModel({ 
  selectedFloor, 
  selectedUnit 
}: { 
  selectedFloor: number; 
  selectedUnit: string | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Total height calculation to center it
  const totalHeight = 7 * 3.2;

  return (
    <group ref={groupRef} position={[0, -totalHeight / 2 + 2, 0]}>
      {/* Ground boundary glowing box */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DEMO_BUILDING.footprintWidth + 6, DEMO_BUILDING.footprintDepth + 6]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DEMO_BUILDING.footprintWidth + 6, DEMO_BUILDING.footprintDepth + 6]} />
        <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.8} />
      </mesh>
      
      {/* Ground boundary text */}
      <Html position={[0, 0.1, DEMO_BUILDING.footprintDepth / 2 + 1]} center distanceFactor={80} zIndexRange={[0, 0]}>
        <div className="text-emerald-400 font-mono text-[10px] font-bold whitespace-nowrap text-center opacity-80 pointer-events-none">
          Parcel<br/>boundary<br/>402/A<br/>(1250.5...)
        </div>
      </Html>

      {DEMO_BUILDING.floors.map((floor) => {
        const isSelectedFloor = selectedFloor === floor.num;
        const yPos = floor.elevationStart + (floor.height / 2);
        const slabY = floor.elevationStart;

        // Colors based on the screenshot
        // Floor 1 is cyan block, upper floors are dark brownish/grey glass
        // Selected floor block is orange transparent? Or is it just the label?
        const baseFloorColor = floor.num === 1 ? "#0284c7" : "#1e293b";
        
        return (
          <group key={floor.num}>
            {/* Slab */}
            <mesh position={[0, slabY, 0]}>
              <boxGeometry args={[DEMO_BUILDING.footprintWidth + 2, 0.4, DEMO_BUILDING.footprintDepth + 2]} />
              <meshStandardMaterial color="#1e293b" roughness={0.9} />
            </mesh>

            {/* Floor Volume */}
            <mesh position={[0, yPos, 0]}>
              <boxGeometry args={[DEMO_BUILDING.footprintWidth, floor.height * 0.95, DEMO_BUILDING.footprintDepth]} />
              <meshStandardMaterial 
                color={baseFloorColor} 
                transparent
                opacity={floor.num === 1 ? 0.6 : 0.3}
                roughness={0.1}
                depthWrite={false}
              />
            </mesh>

            {/* Floor Label Beside Building */}
            {floor.num <= 7 && (
              <group position={[DEMO_BUILDING.footprintWidth / 2 + 2, yPos, 0]}>
                <Html center distanceFactor={80} zIndexRange={[100, 0]}>
                  <div className="font-mono text-slate-400 text-3xl font-light whitespace-nowrap opacity-60">
                    Floor {floor.num}
                  </div>
                </Html>
              </group>
            )}

            {/* Property Units and Labels */}
            {getFloorProperties(floor.num).map((unit, idx) => {
              const isUnitSelected = selectedUnit === unit.id && isSelectedFloor;
              
              // We divide the floor into 2 halves (front and back)
              const zOffset = idx === 0 ? DEMO_BUILDING.footprintDepth / 4 : -DEMO_BUILDING.footprintDepth / 4;
              
              // Label position (floating on the left)
              const labelX = -(DEMO_BUILDING.footprintWidth / 2 + 6);
              const labelY = yPos;
              const labelZ = zOffset;

              return (
                <group key={unit.id}>
                  {/* The Flat Volume */}
                  {isUnitSelected && (
                    <mesh position={[0, yPos, zOffset]}>
                      <boxGeometry args={[DEMO_BUILDING.footprintWidth - 0.2, floor.height * 0.9, (DEMO_BUILDING.footprintDepth / 2) - 0.2]} />
                      <meshStandardMaterial 
                        color="#f59e0b" // Orange highlight like in the screenshot
                        transparent
                        opacity={0.4}
                        depthWrite={false}
                      />
                    </mesh>
                  )}

                  {/* Connecting Line */}
                  <Line 
                    points={[
                      [labelX + 2, labelY, labelZ], 
                      [-DEMO_BUILDING.footprintWidth/2, labelY, labelZ]
                    ]} 
                    color="#475569" 
                    lineWidth={1} 
                    transparent 
                    opacity={0.5} 
                  />

                  {/* Floating Flat Label */}
                  <Html position={[labelX, labelY, labelZ]} center distanceFactor={60} zIndexRange={[100, 0]}>
                    <div style={{
                      background: '#0f172a',
                      color: isUnitSelected ? '#f59e0b' : '#94a3b8', // Orange if selected, else slate
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      border: `1px solid ${isUnitSelected ? '#f59e0b' : '#334155'}`,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none'
                    }}>
                      {unit.unitNum} ({unit.sqft} sqft)
                    </div>
                  </Html>
                </group>
              );
            })}
          </group>
        );
      })}

      {/* Top Slab (Roof) */}
      <mesh position={[0, 7 * 3.2, 0]}>
        <boxGeometry args={[DEMO_BUILDING.footprintWidth + 2, 0.4, DEMO_BUILDING.footprintDepth + 2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Green glow on very top (like screenshot showing green top floor) */}
      <mesh position={[0, 7 * 3.2 + 0.2, 0]}>
        <boxGeometry args={[DEMO_BUILDING.footprintWidth, 1, DEMO_BUILDING.footprintDepth]} />
        <meshStandardMaterial color="#10b981" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* Ground plane grid */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0B1120" roughness={1} />
        <gridHelper args={[200, 40, '#0ea5e9', '#0f172a']} rotation={[Math.PI / 2, 0, 0]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------
// MAIN EXPORTED COMPONENT
// ---------------------------------------------------------

export default function StandaloneDetailedBuilding() {
  const [selectedFloor, setSelectedFloor] = useState<number>(7);
  const [selectedUnitIdx, setSelectedUnitIdx] = useState<number>(1); // index 0 or 1 for Flat 101/102

  const [leftTab, setLeftTab] = useState<'Parcel' | 'Building' | 'Property'>('Parcel');

  // Derived state
  const activeFloorData = DEMO_BUILDING.floors.find(f => f.num === selectedFloor)!;
  const floorUnits = getFloorProperties(selectedFloor);
  const activeUnitData = floorUnits[selectedUnitIdx];
  const selectedUnitId = activeUnitData.id;

  const generatedId = `MHNGP-402A-A01-F0${selectedFloor}-U${selectedFloor}0${selectedUnitIdx + 1}`;

  return (
    <div className="w-full h-full flex overflow-hidden bg-[#0B1120] text-slate-300 font-sans">
      
      {/* LEFT PANEL: DATA ENTRY & VERIFICATION */}
      <div className="w-80 h-full flex flex-col gap-4 p-4 overflow-y-auto border-r border-slate-800/50 bg-[#0f172a]/50 z-10">
        
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="p-1.5 bg-emerald-500/20 rounded">
            <Building className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-emerald-50 font-mono tracking-wide">Ministry Admin & Survey Portal</h2>
            <h3 className="text-[10px] font-mono text-slate-400">SIH26011: Data Entry & Spatial Verification</h3>
          </div>
        </div>

        {/* UPLOAD 2D CAD / DRONE BLUEPRINT */}
        <div className="border border-slate-800 rounded-lg p-4 bg-[#111827]">
          <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
            <Upload className="w-3.5 h-3.5" /> UPLOAD 2D CAD / DRONE BLUEPRINT
          </h4>
          <div className="border border-dashed border-slate-600 rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-[#0f172a]">
            <Upload className="w-4 h-4 text-slate-400 mb-2" />
            <p className="text-[11px] text-white font-bold font-mono mb-1">Select 2D Floorplan Image / DWG</p>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">PNG, JPG, SVG, CAD Layout</p>
          </div>
        </div>

        {/* SEGMENTED TABS */}
        <div className="flex rounded-full overflow-hidden border border-emerald-500/20 bg-[#0f172a] p-0.5">
          {['Parcel', 'Building', 'Property'].map(tab => (
            <button
              key={tab}
              onClick={() => setLeftTab(tab as any)}
              className={`flex-1 py-1.5 text-[11px] font-mono font-bold rounded-full transition-colors ${leftTab === tab ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* PARCEL INFORMATION SECTION */}
        {leftTab === 'Parcel' && (
          <div className="border border-slate-800 rounded-lg p-4 bg-[#111827] space-y-4">
            <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5" /> 1. LAND PARCEL SPATIAL ATTRIBUTES
            </h4>
            
            <div className="space-y-3 text-[11px] font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Survey Plot Number</label>
                <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                  402/A
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Legacy 2D ULPIN (if available)</label>
                <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                  142857361049
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-slate-400 mb-1">Latitude (°N)</label>
                  <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                    21.1458
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-slate-400 mb-1">Longitude (°E)</label>
                  <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                    79.0882
                  </div>
                </div>
              </div>
            </div>
            
            <button className="w-full py-2.5 bg-emerald-500 text-slate-900 font-bold rounded font-mono text-[11px] hover:bg-emerald-400 transition-colors mt-2 flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Save & Update 3D Scene Model
            </button>
          </div>
        )}
      </div>

      {/* CENTER: ONE 3D BUILDING CANVAS */}
      <div className="flex-1 relative h-full">
        <Canvas camera={{ position: [-50, 40, 60], fov: 35 }}>
          <color attach="background" args={['#0B1120']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[50, 80, 40]} intensity={1.5} />
          <directionalLight position={[-50, 40, -40]} intensity={0.5} />
          
          <DemoBuildingModel 
            selectedFloor={selectedFloor} 
            selectedUnit={selectedUnitId}
          />
          
          <OrbitControls 
            target={[0, 0, 0]}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={20}
            maxDistance={250}
            makeDefault
          />
          <Environment preset="city" />
        </Canvas>
      </div>

      {/* RIGHT PANEL: VERTICAL CADASTRAL INFO */}
      <div className="w-[340px] h-full flex flex-col gap-3 p-4 overflow-y-auto border-l border-slate-800/50 bg-[#0f172a]/50 z-10">
        
        {/* TOP REGISTRATION SECTION */}
        <div className="space-y-1 mb-2">
          <h2 className="text-[13px] font-bold text-white font-mono flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-400" /> Generate Prototype 3D Property ID
          </h2>
          <h3 className="text-[9px] text-slate-500 uppercase font-mono tracking-widest pl-6">VOLUMETRIC REGISTRATION</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-2">
          <div>
            <span className="text-slate-500 block mb-1">STATE CODE</span>
            <div className="bg-[#111827] border border-slate-700 rounded p-2 text-slate-300 flex justify-between items-center">
              <span>Maharashtra - MH</span>
              <span className="text-xs">▼</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">DISTRICT CODE</span>
            <div className="bg-[#111827] border border-slate-700 rounded p-2 text-slate-300 flex justify-between items-center">
              <span>Nagpur - NGP</span>
              <span className="text-xs">▼</span>
            </div>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-[10px] font-mono mb-2">
            <span className="text-slate-400 flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-emerald-400" /> Select Floor Level:</span>
            <span className="text-emerald-400 font-bold">Level {selectedFloor}</span>
          </div>
          <div className="relative h-2 bg-slate-800 rounded-full mb-4">
            <input
              type="range"
              min={1}
              max={DEMO_BUILDING.totalFloors}
              value={selectedFloor}
              onChange={(e) => {
                setSelectedFloor(Number(e.target.value));
                setSelectedUnitIdx(0); // Reset unit index on floor change
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            {/* Custom slider track visual */}
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full pointer-events-none" style={{ width: `${((selectedFloor - 1) / (DEMO_BUILDING.totalFloors - 1)) * 100}%` }}></div>
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full shadow-lg pointer-events-none transition-all" style={{ left: `calc(${((selectedFloor - 1) / (DEMO_BUILDING.totalFloors - 1)) * 100}% - 8px)` }}></div>
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 font-mono px-1">
            <span>F1</span><span>F2</span><span>F3</span><span>F4</span><span>F5</span><span>F6</span><span>F7</span>
          </div>
        </div>

        {/* TARGET PROPERTY UNIT */}
        <div className="mb-4">
          <h3 className="text-[10px] text-slate-400 font-mono mb-2 flex items-center gap-1"><Home className="w-3.5 h-3.5 text-blue-400" /> Target Property Unit:</h3>
          <div className="flex gap-2">
            {floorUnits.map((unit, idx) => {
              const isSel = selectedUnitIdx === idx;
              return (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnitIdx(idx)}
                  className={`flex-1 py-2 rounded text-[11px] font-mono font-bold transition-all border ${
                    isSel ? 'bg-[#1e293b] border-slate-600 text-white' : 'bg-[#111827] border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {unit.unitNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* PROTOTYPE 3D PROPERTY ID CARD */}
        <div className="border border-slate-700 bg-[#111827] rounded-xl p-4 text-center relative mb-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-3">PROTOTYPE 3D PROPERTY ID</p>
          
          <p className="text-xl font-mono font-bold text-emerald-400 break-all mb-4">
            {generatedId}
          </p>
          
          <button className="w-full py-2 rounded border border-slate-600 bg-[#1e293b] text-[11px] text-white hover:bg-slate-700 transition-all flex items-center justify-center gap-2 font-mono mb-4">
            <Copy className="w-3.5 h-3.5" /> Copy Identifier
          </button>
          
          <div className="border border-orange-500/50 bg-orange-500/10 text-orange-400 text-[9px] font-mono p-2 rounded">
            Prototype identifier — not an official government ULPIN.
          </div>
        </div>

        {/* TRUE 3D SPATIAL VOLUME BOUNDS */}
        <div className="border border-slate-800 bg-[#111827] rounded-xl p-4 space-y-3">
          <h2 className="text-[10px] font-bold text-white uppercase font-mono flex items-center gap-2 mb-2">
            <Box className="w-3.5 h-3.5 text-cyan-400" /> TRUE 3D SPATIAL VOLUME BOUNDS
          </h2>
          
          <div className="space-y-2 text-[10px] font-mono">
            <div className="flex justify-between"><span className="text-slate-500">Parent Parcel:</span><span className="text-slate-300 font-bold">402/A (PARCEL-402/A)</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Building / Floor:</span><span className="text-slate-300 font-bold">{DEMO_BUILDING.name} - Floor {activeFloorData.num}</span></div>
            
            <div className="h-px bg-slate-800 my-2"></div>
            
            <div className="flex justify-between"><span className="text-slate-500">Bottom Z-Elevation:</span><span className="text-emerald-400 font-bold">{activeFloorData.elevationStart.toFixed(2)} m</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Top Z-Elevation:</span><span className="text-emerald-400 font-bold">{(activeFloorData.elevationStart + activeFloorData.height).toFixed(2)} m</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Height (ΔZ):</span><span className="text-slate-300 font-bold">{activeFloorData.height.toFixed(2)} m</span></div>
            
            <div className="h-px bg-slate-800 my-2"></div>
            
            <div className="flex justify-between"><span className="text-slate-500">Floor Area:</span><span className="text-slate-300 font-bold">{activeUnitData.sqft} sq ft ({activeUnitData.area.toFixed(2)} m²)</span></div>
            <div className="flex justify-between pt-1"><span className="text-slate-500">Total Enclosed Volume:</span><span className="text-cyan-400 font-bold">{(activeUnitData.area * activeFloorData.height).toFixed(1)} m³</span></div>
          </div>
        </div>

        {/* OWNERSHIP & STATUS */}
        <div className="border border-slate-800 bg-[#111827] rounded-xl p-4">
          <h2 className="text-[10px] text-slate-500 uppercase font-mono mb-2 tracking-wider">OWNERSHIP & STATUS</h2>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200 font-mono">{activeUnitData.owner}</span>
          </div>
          
          <div className="flex gap-2 text-[9px] font-mono font-bold">
            <div className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded">TAX: PAID</div>
            <div className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded">ENCUMBRANCE: CLEAR</div>
          </div>
        </div>

      </div>
    </div>
  );
}
