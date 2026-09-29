import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float, Html, Grid, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Parcel, Building as BuildingType, PropertyVolume } from '../types/cadastral';
import { Box, Layers, AlertTriangle } from 'lucide-react';

const FLOOR_HEIGHT = 1.2;
const BUILDING_WIDTH = 4.0;
const BUILDING_DEPTH = 3.0;

interface VolumetricPropertyProps {
  property: PropertyVolume;
  floorIndex: number;
  isSelected: boolean;
  isFloorSelected: boolean;
  onSelect: (prop: PropertyVolume) => void;
  buildingWidth: number;
  buildingDepth: number;
  floorHeight: number;
}

function VolumetricPropertyMesh({
  property,
  floorIndex,
  isSelected,
  isFloorSelected,
  onSelect,
  buildingWidth,
  buildingDepth,
  floorHeight,
}: VolumetricPropertyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isFlatA = property.unitCode.endsWith('01');
  const flatWidth = (buildingWidth - 0.15) / 2;

  const xPos = isFlatA ? -(flatWidth / 2 + 0.05) : flatWidth / 2 + 0.05;
  const yPos = floorIndex * floorHeight;

  const targetColor = useMemo(() => {
    if (isSelected) return new THREE.Color('#10B981'); // Emerald glow
    if (property.isDemoWarning) return new THREE.Color('#F59E0B'); // Warning Amber
    if (isFloorSelected) return new THREE.Color('#3B82F6'); // Active Floor Blue
    return new THREE.Color('#1E293B'); // Normal Slate
  }, [isSelected, property.isDemoWarning, isFloorSelected]);

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
    mat.color.lerp(targetColor, 0.12);
    const targetOpacity = isSelected ? 0.9 : isFloorSelected ? 0.6 : 0.25;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.12);
    mat.emissive.lerp(isSelected ? targetColor : new THREE.Color('#000000'), 0.1);
    mat.emissiveIntensity = isSelected ? 0.6 : property.isDemoWarning ? 0.4 : 0.05;
  });

  return (
    <group position={[xPos, yPos, 0]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(property);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[flatWidth, floorHeight * 0.85, buildingDepth]} />
        <meshPhysicalMaterial
          color="#1E293B"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.2}
          transmission={0.4}
          thickness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Volumetric Label */}
      <Html position={[0, floorHeight * 0.45, buildingDepth / 2 + 0.01]} center distanceFactor={10} occlude={false}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(property);
          }}
          style={{
            fontSize: '9px',
            fontFamily: 'JetBrains Mono, monospace',
            color: isSelected ? '#10B981' : property.isDemoWarning ? '#F59E0B' : '#94A3B8',
            whiteSpace: 'nowrap',
            background: 'rgba(15,23,42,0.85)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: `1px solid ${isSelected ? 'rgba(16,185,129,0.5)' : 'rgba(59,130,246,0.2)'}`,
            cursor: 'pointer',
          }}
        >
          {property.flatNumber} ({property.areaSqFt} sqft)
        </div>
      </Html>
    </group>
  );
}

interface UndergroundPipeMeshProps {
  assetId: string;
  name: string;
  type: string;
  depthM: number;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

function SubterraneanAssetMesh({ name, depthM, color, position, rotation }: UndergroundPipeMeshProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.2, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <Html position={[0, 0.4, 0]} center distanceFactor={12}>
        <div
          style={{
            fontSize: '8px',
            fontFamily: 'JetBrains Mono, monospace',
            color,
            background: 'rgba(15,23,42,0.9)',
            padding: '2px 5px',
            borderRadius: '4px',
            border: `1px solid ${color}`,
            whiteSpace: 'nowrap',
          }}
        >
          {name} (Z = -{depthM}m)
        </div>
      </Html>
    </group>
  );
}

interface SceneProps {
  parcel: Parcel;
  building: BuildingType;
  selectedFloorNumber: number;
  selectedPropertyId: string | null;
  onSelectFloor: (floorNo: number) => void;
  onSelectProperty: (prop: PropertyVolume) => void;
  isUndergroundView: boolean;
}

function MainBuildingScene({
  parcel,
  building,
  selectedFloorNumber,
  selectedPropertyId,
  onSelectFloor,
  onSelectProperty,
  isUndergroundView,
}: SceneProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPosRef = useRef(new THREE.Vector3(7, 3, 8));
  const targetLookRef = useRef(new THREE.Vector3(0, 0, 0));
  const animatingRef = useRef(false);

  const bWidth = useMemo(() => {
    if (building.footprintPolygon && building.footprintPolygon.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      building.footprintPolygon.forEach(pt => {
        if (pt[0] < minX) minX = pt[0];
        if (pt[0] > maxX) maxX = pt[0];
      });
      return Math.max((maxX - minX) * 2, 2.0);
    }
    return 4.0;
  }, [building]);

  const bDepth = useMemo(() => {
    if (building.footprintPolygon && building.footprintPolygon.length > 0) {
      let minZ = Infinity, maxZ = -Infinity;
      building.footprintPolygon.forEach(pt => {
        if (pt[1] < minZ) minZ = pt[1];
        if (pt[1] > maxZ) maxZ = pt[1];
      });
      return Math.max((maxZ - minZ) * 2, 2.0);
    }
    return 3.0;
  }, [building]);

  const fHeight = useMemo(() => {
    return building.floorHeightM ? building.floorHeightM * 0.35 : 1.2;
  }, [building]);

  const parcelSize = useMemo(() => Math.sqrt(parcel.areaSqM || 100) * 0.3, [parcel]);

  const offsetY = -building.floors.length * fHeight * 0.5 + fHeight;

  useEffect(() => {
    const floorY = (selectedFloorNumber - Math.floor(building.floors.length / 2)) * fHeight;
    targetPosRef.current.set(bWidth * 1.5, isUndergroundView ? -4 : floorY + 2, bDepth * 1.5 + 2);
    targetLookRef.current.set(0, isUndergroundView ? -3 : floorY, 0);
    animatingRef.current = true;
  }, [selectedFloorNumber, isUndergroundView, building.floors.length, fHeight, bWidth, bDepth]);

  useFrame(() => {
    if (!animatingRef.current) return;
    camera.position.lerp(targetPosRef.current, 0.06);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookRef.current, 0.06);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(targetPosRef.current) < 0.05) {
      animatingRef.current = false;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 12, 6]} intensity={0.9} castShadow />
      <pointLight position={[-6, 4, -4]} intensity={0.5} color="#3B82F6" />

      {/* 2D Land Parcel Outline Box on Ground Plane */}
      <group position={[0, offsetY - fHeight * 0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[parcelSize, parcelSize]} />
          <meshStandardMaterial
            color="#0F172A"
            transparent
            opacity={isUndergroundView ? 0.2 : 0.8}
            roughness={0.9}
          />
        </mesh>
        {/* Parcel Boundary Border Outline */}
        <lineLoop position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                -parcelSize/2, -parcelSize/2, 0,
                parcelSize/2, -parcelSize/2, 0,
                parcelSize/2, parcelSize/2, 0,
                -parcelSize/2, parcelSize/2, 0
              ]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#10B981" linewidth={2} />
        </lineLoop>

        <Html position={[-parcelSize/2 + 0.5, 0.2, -parcelSize/2 + 0.8]} center distanceFactor={12}>
          <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#10B981', background: 'rgba(15,23,42,0.8)', padding: '2px 6px', borderRadius: '4px' }}>
            Parcel Boundary {parcel.surveyNumber} ({parcel.areaSqM} m²)
          </div>
        </Html>
      </group>

      {/* 3D Volumetric Building Floors */}
      <group position={[0, offsetY, 0]}>
        {building.floors.map((floor, fIdx) => {
          const isFloorSelected = selectedFloorNumber === floor.floorNumber;
          const yPos = fIdx * fHeight;

          return (
            <group key={floor.floorNumber}>
              {/* Floor Slab Separator */}
              <mesh position={[0, yPos - fHeight * 0.45, 0]}>
                <boxGeometry args={[bWidth + 0.15, 0.08, bDepth + 0.15]} />
                <meshStandardMaterial color={isFloorSelected ? '#10B981' : '#334155'} roughness={0.7} />
              </mesh>

              {/* Properties on Floor */}
              {floor.properties.map((prop) => (
                <VolumetricPropertyMesh
                  key={prop.id}
                  property={prop}
                  floorIndex={fIdx}
                  isSelected={selectedPropertyId === prop.id}
                  isFloorSelected={isFloorSelected}
                  onSelect={(p) => {
                    onSelectFloor(floor.floorNumber);
                    onSelectProperty(p);
                  }}
                  buildingWidth={bWidth}
                  buildingDepth={bDepth}
                  floorHeight={fHeight}
                />
              ))}

              {/* Floor Label */}
              <Float speed={1.5} rotationIntensity={0} floatIntensity={0.2}>
                <Text
                  position={[bWidth / 2 + 1.2, yPos, 0]}
                  fontSize={0.32}
                  color={isFloorSelected ? '#10B981' : '#64748B'}
                  anchorX="left"
                  anchorY="middle"
                  onClick={() => onSelectFloor(floor.floorNumber)}
                >
                  {`Floor ${floor.floorNumber}`}
                </Text>
              </Float>
            </group>
          );
        })}
      </group>

      {/* Subterranean Underground Assets Layer */}
      {isUndergroundView && (
        <group position={[0, offsetY - FLOOR_HEIGHT * 0.5, 0]}>
          <SubterraneanAssetMesh
            assetId="PIPE-W-102"
            name="Municipal Water Main"
            type="Water Pipeline"
            depthM={3.5}
            color="#3B82F6"
            position={[0, -1.2, 0]}
            rotation={[0, 0, Math.PI / 2]}
          />
          <SubterraneanAssetMesh
            assetId="SEW-401"
            name="Sewer Trunk Line"
            type="Sewer Line"
            depthM={5.0}
            color="#F59E0B"
            position={[0, -2.0, 1.2]}
            rotation={[0, 0, Math.PI / 2]}
          />
          <SubterraneanAssetMesh
            assetId="FIBER-C-09"
            name="Fiber Optic Cable"
            type="Fiber Optic Cable"
            depthM={1.8}
            color="#10B981"
            position={[0, -0.6, -1.2]}
            rotation={[0, 0, Math.PI / 2]}
          />

          {/* Subterranean Basement Parking Vault */}
          <mesh position={[0, -1.5, 0]}>
            <boxGeometry args={[3.8, 1.2, 2.8]} />
            <meshStandardMaterial color="#475569" transparent opacity={0.3} wireframe />
          </mesh>
        </group>
      )}

      <Grid
        position={[0, offsetY - FLOOR_HEIGHT * 0.52, 0]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3B82F6"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#10B981"
        fadeDistance={25}
        fadeStrength={1.5}
        infiniteGrid
      />

      <ContactShadows position={[0, offsetY - FLOOR_HEIGHT * 0.5, 0]} opacity={0.4} scale={15} blur={2.5} far={8} color="#10B981" />
      <Environment preset="night" />

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={3}
        maxDistance={25}
        maxPolarAngle={isUndergroundView ? Math.PI : Math.PI / 2.05}
        target={[0, 0, 0]}
      />
    </>
  );
}

function ConceptualFloorPlan2D({
  building,
  selectedFloorNumber,
  selectedPropertyId,
  onSelectProperty,
}: {
  building: BuildingType;
  selectedFloorNumber: number;
  selectedPropertyId: string | null;
  onSelectProperty: (prop: PropertyVolume) => void;
}) {
  const floor = building.floors.find((f) => f.floorNumber === selectedFloorNumber) || building.floors[0];
  
  if (!floor) return null;

  // Calculate bounding box for SVG viewbox
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  floor.properties.forEach(p => {
    minX = Math.min(minX, p.xRangeM[0]);
    maxX = Math.max(maxX, p.xRangeM[1]);
    minY = Math.min(minY, p.yRangeM[0]);
    maxY = Math.max(maxY, p.yRangeM[1]);
  });
  
  // Add padding
  const padding = 1;
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;
  
  const width = maxX - minX;
  const height = maxY - minY;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8">
      <div className="flex items-center gap-2 mb-6 border border-amber-500/30 bg-amber-500/10 px-4 py-2 rounded text-amber-500 font-mono text-xs shadow-lg">
        <AlertTriangle className="w-4 h-4" />
        <span>CONCEPTUAL FLOOR PLAN: This is synthetic prototype data, not an actual surveyed architectural plan.</span>
      </div>
      
      <div className="relative w-full max-w-2xl aspect-square bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-8 flex items-center justify-center overflow-hidden">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3B82F6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="w-full h-full drop-shadow-2xl">
          <defs>
            <pattern id="hatch" width="0.2" height="0.2" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="0.2" stroke="#334155" strokeWidth="0.05" />
            </pattern>
          </defs>
          
          {/* Building Outer Bounds Outline */}
          <rect 
            x={minX + padding - 0.2} 
            y={minY + padding - 0.2} 
            width={width - padding*2 + 0.4} 
            height={height - padding*2 + 0.4} 
            fill="url(#hatch)" 
            stroke="#475569" 
            strokeWidth="0.05"
            rx="0.1"
          />

          {floor.properties.map((prop) => {
            const isSelected = prop.id === selectedPropertyId;
            const w = prop.xRangeM[1] - prop.xRangeM[0];
            const h = prop.yRangeM[1] - prop.yRangeM[0];
            return (
              <g 
                key={prop.id} 
                className="cursor-pointer transition-all duration-300"
                onClick={() => onSelectProperty(prop)}
              >
                <rect
                  x={prop.xRangeM[0]}
                  y={prop.yRangeM[0]}
                  width={w}
                  height={h}
                  fill={isSelected ? '#10B981' : '#1E293B'}
                  stroke={isSelected ? '#34D399' : '#64748B'}
                  strokeWidth="0.05"
                  className="transition-all duration-300 hover:opacity-80"
                  rx="0.05"
                />
                <text 
                  x={prop.xRangeM[0] + w/2} 
                  y={prop.yRangeM[0] + h/2} 
                  textAnchor="middle" 
                  dominantBaseline="central"
                  fontSize="0.2"
                  fill={isSelected ? '#064E3B' : '#CBD5E1'}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {prop.unitCode}
                </text>
                <text 
                  x={prop.xRangeM[0] + w/2} 
                  y={prop.yRangeM[0] + h/2 + 0.25} 
                  textAnchor="middle" 
                  dominantBaseline="central"
                  fontSize="0.12"
                  fill={isSelected ? '#064E3B' : '#94A3B8'}
                  fontFamily="monospace"
                >
                  {prop.areaSqFt} sqft
                </text>
                {prop.isDemoWarning && (
                  <text
                     x={prop.xRangeM[0] + 0.1}
                     y={prop.yRangeM[0] + 0.2}
                     fontSize="0.15"
                     fill="#F59E0B"
                  >
                    ⚠️
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-4 left-4 font-mono text-[10px] text-slate-500">
          Scale: Synthetic Relative Offsets
        </div>
        <div className="absolute top-4 right-4 bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700 font-bold text-xs text-white shadow-lg">
          Floor {floor.floorNumber}
        </div>
      </div>
    </div>
  );
}

export interface Building3DProps {
  parcel: Parcel;
  building: BuildingType;
  selectedFloorNumber: number;
  selectedPropertyId: string | null;
  onSelectFloor: (floorNo: number) => void;
  onSelectProperty: (prop: PropertyVolume) => void;
  isUndergroundView?: boolean;
}

export default function Building3D(props: Building3DProps) {
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

  return (
    <div className="relative w-full h-full bg-slate-950">
      
      {/* Top Toggle Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-700/50 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setViewMode('3D')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all ${
            viewMode === '3D' 
              ? 'bg-emerald text-slate-900 glow-emerald shadow-lg scale-[1.02]' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Box className="w-4 h-4" />
          3D VOLUME
        </button>
        <button
          onClick={() => setViewMode('2D')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all ${
            viewMode === '2D' 
              ? 'bg-emerald text-slate-900 glow-emerald shadow-lg scale-[1.02]' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          2D FLOOR PLAN
        </button>
      </div>

      {viewMode === '3D' ? (
        <Canvas shadows camera={{ position: [7, 3, 8], fov: 45 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
          <MainBuildingScene {...props} isUndergroundView={props.isUndergroundView || false} />
        </Canvas>
      ) : (
        <ConceptualFloorPlan2D 
          building={props.building} 
          selectedFloorNumber={props.selectedFloorNumber} 
          selectedPropertyId={props.selectedPropertyId} 
          onSelectProperty={props.onSelectProperty} 
        />
      )}
    </div>
  );
}
