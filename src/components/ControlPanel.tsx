import React, { useState } from 'react';
import {
  Layers,
  Home,
  QrCode,
  Copy,
  Check,
  User,
  Box,
  Building,
  MapPin,
  ShieldAlert,
  Database,
  Info
} from 'lucide-react';
import { Parcel, Building as BuildingType, PropertyVolume, VolumetricProperty } from '../types/cadastral';
import { generateVolumetricProperty } from '../services/api';

function generateDeterministicOwner(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const names = ['Rajesh Sharma', 'Amit Verma', 'Sanjay Gupta', 'Priya Patil', 'Neha Deshmukh', 'Vikram Singh', 'Anita Reddy', 'Rahul Joshi', 'Sunil Kumar', 'Meera Iyer'];
  const types = ['Individual', 'Joint', 'Corporate', 'HUF'];
  
  return {
    name: names[Math.abs(hash) % names.length],
    type: types[Math.abs(hash) % types.length],
    contact: 'DEMO RECORD'
  };
}

interface ControlPanelProps {
  parcels: Parcel[];
  selectedParcel: Parcel;
  selectedBuilding: BuildingType;
  selectedFloorNumber: number;
  selectedProperty: PropertyVolume | null;
  onSelectFloor: (floorNo: number) => void;
  onSelectProperty: (property: PropertyVolume) => void;
  onUpdateParcel: (updated: Partial<Parcel>) => void;
}

const STATES = [
  { code: 'MH', label: 'Maharashtra - MH' },
  { code: 'DL', label: 'Delhi - DL' },
  { code: 'KA', label: 'Karnataka - KA' },
  { code: 'TN', label: 'Tamil Nadu - TN' },
];

const DISTRICTS: Record<string, { code: string; label: string }[]> = {
  MH: [
    { code: 'NGP', label: 'Nagpur - NGP' },
    { code: 'MUM', label: 'Mumbai - MUM' },
    { code: 'PUN', label: 'Pune - PUN' },
  ],
  DL: [
    { code: 'CND', label: 'Central Delhi - CND' },
    { code: 'NDL', label: 'New Delhi - NDL' },
  ],
  KA: [
    { code: 'BLR', label: 'Bengaluru - BLR' },
    { code: 'MYS', label: 'Mysuru - MYS' },
  ],
  TN: [
    { code: 'CEN', label: 'Chennai - CEN' },
  ],
};

export default function ControlPanel({
  parcels,
  selectedParcel,
  selectedBuilding,
  selectedFloorNumber,
  selectedProperty,
  onSelectFloor,
  onSelectProperty,
  onUpdateParcel,
}: ControlPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProperty, setGeneratedProperty] = useState<VolumetricProperty | null>(null);

  // Single source of truth active floor & active property
  const activeFloor =
    selectedBuilding.floors.find((f) => f.floorNumber === selectedFloorNumber) ||
    selectedBuilding.floors[0];

  const activeProperty =
    (selectedProperty && selectedProperty.floorNumber === selectedFloorNumber
      ? selectedProperty
      : activeFloor.properties[1] || activeFloor.properties[0]) || activeFloor.properties[0];

  const handleCopy = () => {
    if (generatedProperty) {
      navigator.clipboard.writeText(generatedProperty.prototype3DId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerate = async () => {
    if (!activeProperty) return;
    setIsGenerating(true);
    try {
      const response = await generateVolumetricProperty({
        localityCode: `${selectedParcel.stateCode}-${selectedParcel.districtCode}`,
        parcelId: selectedParcel.surveyNumber || selectedParcel.id,
        buildingId: selectedBuilding.id,
        floorId: `F${activeProperty.floorNumber}`,
        propertyId: activeProperty.flatNumber || activeProperty.id,
        floorNumber: activeProperty.floorNumber,
        zMinM: activeProperty.bottomElevationM,
        zMaxM: activeProperty.topElevationM,
        footprintAreaM2: activeProperty.areaSqM
      });
      setGeneratedProperty(response as any);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset generated property when selecting a different one
  React.useEffect(() => {
    setGeneratedProperty(null);
  }, [activeProperty.id]);

  const buildingOwner = React.useMemo(() => generateDeterministicOwner(selectedBuilding.id), [selectedBuilding.id]);
  const propertyOwner = React.useMemo(() => generateDeterministicOwner(activeProperty.id), [activeProperty.id]);
  const buildingBuiltUpArea = React.useMemo(() => {
    let area = 0;
    selectedBuilding.floors.forEach(f => {
      f.properties.forEach(p => area += p.areaSqM);
    });
    return area;
  }, [selectedBuilding]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto p-4 glass-strong border-l border-cyber/15 custom-scrollbar">
      
      {/* BUILDING INFORMATION */}
      <div className="glass rounded-2xl p-5 border border-slate-700/50 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Building className="w-4 h-4 text-emerald" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Building Information</h3>
        </div>
        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Building Name:</span>
            <span className="text-slate-200 font-bold text-right">{selectedBuilding.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Building ID:</span>
            <span className="text-slate-200 font-bold">{selectedBuilding.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Template ID:</span>
            <span className="text-slate-200">Demo Building Template</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Building Type:</span>
            <span className="text-slate-200">{selectedBuilding.name.includes('COMMERCIAL') ? 'Commercial' : selectedBuilding.name.includes('APARTMENT') ? 'Apartment' : 'Residential'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Number of Floors:</span>
            <span className="text-slate-200 font-bold">{selectedBuilding.totalFloors}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Total Height:</span>
            <span className="text-slate-200">{selectedBuilding.totalHeightM.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Built-up Area:</span>
            <span className="text-slate-200">{buildingBuiltUpArea.toFixed(1)} m²</span>
          </div>
          
          {/* Building Owner */}
          <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700/50">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Primary Property Holder</span>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-white">{buildingOwner.name}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">Type: {buildingOwner.type}</span>
              <span className="text-amber-500 font-bold px-1.5 rounded bg-amber-500/10">SYNTHETIC DATA</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOCATION & SPATIAL */}
      <div className="glass rounded-2xl p-5 border border-slate-700/50 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Location Information</h3>
        </div>
        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Parent Parcel ID:</span>
            <span className="text-cyan-400 font-bold">{selectedParcel.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Survey / Plot No:</span>
            <span className="text-slate-200">{selectedParcel.surveyNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Latitude:</span>
            <span className="text-slate-200">{selectedBuilding.latitude.toFixed(5)}° N</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Longitude:</span>
            <span className="text-slate-200">{selectedBuilding.longitude.toFixed(5)}° E</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Locality:</span>
            <span className="text-slate-200">Nagpur Urban Zone</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">District:</span>
            <span className="text-slate-200">Nagpur</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">State:</span>
            <span className="text-slate-200">Maharashtra</span>
          </div>
          <div className="flex justify-between py-1 mt-2">
            <span className="text-slate-400">Data Status:</span>
            <span className="text-amber-500 font-bold">DEMO COORDINATE</span>
          </div>
        </div>
      </div>

      {/* FLOOR & PROPERTY SELECTION */}
      <div className="glass rounded-2xl p-5 border border-emerald/25 space-y-4 glow-emerald">
        <h3 className="text-xs font-bold text-emerald uppercase tracking-wider font-mono flex items-center gap-2">
          <Layers className="w-4 h-4" /> 3D Spatial Navigation
        </h3>
        
        {/* Floor Level Range Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Select Floor Level:</span>
            <span className="text-emerald font-bold font-mono">Floor {selectedFloorNumber}</span>
          </div>
          <input
            type="range"
            min={1}
            max={selectedBuilding.totalFloors}
            value={selectedFloorNumber}
            onChange={(e) => onSelectFloor(Number(e.target.value))}
            className="w-full cursor-pointer accent-emerald"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span className={1 === selectedFloorNumber ? 'text-emerald font-bold' : ''}>F1</span>
            <span className={selectedBuilding.totalFloors === selectedFloorNumber ? 'text-emerald font-bold' : ''}>F{selectedBuilding.totalFloors}</span>
          </div>
        </div>

        {/* Flat Unit Toggle */}
        <div className="space-y-2 pt-2">
          <label className="text-[11px] text-slate-400 font-mono block">Select Property Unit:</label>
          <div className="grid grid-cols-2 gap-2">
            {activeFloor.properties.map((prop) => {
              const isSelected = activeProperty.id === prop.id;
              return (
                <button
                  key={prop.id}
                  onClick={() => onSelectProperty(prop)}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all ${
                    isSelected
                      ? 'bg-emerald/20 border-emerald text-emerald font-bold glow-emerald'
                      : 'glass border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {prop.flatNumber}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PROPERTY INFORMATION */}
      <div className="glass rounded-2xl p-5 border border-cyan-500/30 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Home className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Property Information</h3>
        </div>
        
        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Property ID:</span>
            <span className="text-slate-200 font-bold text-right">{activeProperty.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Flat / Unit:</span>
            <span className="text-cyan-400 font-bold">{activeProperty.flatNumber}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Floor Number:</span>
            <span className="text-slate-200">{activeProperty.floorNumber}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Property Type:</span>
            <span className="text-slate-200">{activeProperty.propertyType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Carpet Area:</span>
            <span className="text-slate-200">{activeProperty.areaSqFt} sq ft</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Built-up Area:</span>
            <span className="text-slate-200">{activeProperty.areaSqM.toFixed(1)} m²</span>
          </div>
          
          <div className="pt-2 pb-1 text-cyan-400 font-bold mt-2">Volumetric Bounds</div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Bottom Z-Elevation:</span>
            <span className="text-emerald font-bold">{activeProperty.bottomElevationM.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Top Z-Elevation:</span>
            <span className="text-emerald font-bold">{activeProperty.topElevationM.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Height:</span>
            <span className="text-slate-200">{activeProperty.heightM.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400">Approx Volume:</span>
            <span className="text-slate-200">{activeProperty.volumeM3.toFixed(1)} m³</span>
          </div>
          <div className="flex justify-between py-1 mt-2">
            <span className="text-slate-400">Property Status:</span>
            <span className="text-amber-500 font-bold">DEMO / SYNTHETIC</span>
          </div>

          {/* Property Owner */}
          <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700/50">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Unit Property Holder</span>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-white">{propertyOwner.name}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">Type: {propertyOwner.type}</span>
              <span className="text-amber-500 font-bold px-1.5 rounded bg-amber-500/10">DEMO OWNER DATA</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA PROVENANCE & ULPIN GENERATOR */}
      <div className="glass rounded-2xl p-5 border border-amber-500/30 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Data Provenance</h3>
        </div>
        
        <div className="space-y-1.5 text-[10px] font-mono mb-4">
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Data Source:</span>
            <span className="text-amber-400 text-right font-bold">Synthetic Demonstration Dataset</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Authority:</span>
            <span className="text-slate-300">Not Connected</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Gov Database:</span>
            <span className="text-slate-300">NOT CONNECTED</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Official ULPIN:</span>
            <span className="text-red-400 font-bold">NOT AVAILABLE</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Visualization:</span>
            <span className="text-slate-300">Demo Building Template</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald/30 text-center space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Prototype 3D Property ID</p>
          
          {!generatedProperty ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2 rounded-lg bg-emerald/10 border border-emerald/50 text-emerald font-bold hover:bg-emerald/20 transition-all font-mono text-xs"
            >
              {isGenerating ? 'GENERATING...' : 'GENERATE PROTOTYPE ID'}
            </button>
          ) : (
            <div className="animate-fade-in">
              <p className="text-sm font-mono font-bold text-emerald text-glow break-all mb-2">
                {generatedProperty.prototype3DId}
              </p>
              
              <button
                onClick={handleCopy}
                className="w-full py-1.5 rounded-lg glass border border-emerald/30 text-xs text-emerald hover:bg-emerald/10 transition-all flex items-center justify-center gap-1.5 font-mono"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy Identifier</>
                )}
              </button>
            </div>
          )}
          <div className="text-[9px] text-amber-500/80 font-mono leading-tight pt-1">
            NOT AN OFFICIAL GOVERNMENT ULPIN<br/>Prototype identifier for SIH demo only.
          </div>
        </div>
      </div>

    </div>
  );
}
