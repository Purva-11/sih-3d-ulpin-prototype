import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Upload, FileImage, Layers, RefreshCw, Building, MapPin } from 'lucide-react';

export interface AdminFormData {
  ownerName: string;
  plotNo: string;
  latitude: string;
  longitude: string;
  stateCode: string;
  districtCode: string;
  totalFloors: number;
  selectedFloor: number;
  flatNumber: string;
  taxStatus: string;
  legacyUlpin?: string;
}

interface AdminPanelProps {
  onGenerate3D?: (data: AdminFormData) => void;
  onUploadBlueprint?: (file: File) => void;
  selectedFloor?: number;
  selectedFlat?: string;
}

const DEMO_PROPERTIES: Record<number, Record<string, any>> = {
  1: {
    'Flat 101': { id: 'PRP-101', type: 'Residential', owner: 'Sunita Patil', areaSqFt: 880, status: 'Occupied', tax: 'PAID', encumbrance: 'CLEAR' },
    'Flat 102': { id: 'PRP-102', type: 'Residential', owner: 'Rajesh Kumar', areaSqFt: 870, status: 'Occupied', tax: 'PENDING', encumbrance: 'CLEAR' }
  },
  2: {
    'Flat 201': { id: 'PRP-201', type: 'Residential', owner: 'Amit Desai', areaSqFt: 880, status: 'Occupied', tax: 'PAID', encumbrance: 'MORTGAGED' },
    'Flat 202': { id: 'PRP-202', type: 'Residential', owner: 'Sneha Joshi', areaSqFt: 870, status: 'Vacant', tax: 'PAID', encumbrance: 'CLEAR' }
  },
  3: {
    'Flat 301': { id: 'PRP-301', type: 'Residential', owner: 'Vikram Singh', areaSqFt: 880, status: 'Occupied', tax: 'PAID', encumbrance: 'CLEAR' },
    'Flat 302': { id: 'PRP-302', type: 'Residential', owner: 'Anjali Verma', areaSqFt: 870, status: 'Occupied', tax: 'PAID', encumbrance: 'CLEAR' }
  },
  4: {
    'Flat 401': { id: 'PRP-401', type: 'Residential', owner: 'Ramesh Gupta', areaSqFt: 880, status: 'Occupied', tax: 'PENDING', encumbrance: 'DISPUTE' },
    'Flat 402': { id: 'PRP-402', type: 'Residential', owner: 'Pooja Sharma', areaSqFt: 870, status: 'Occupied', tax: 'PAID', encumbrance: 'CLEAR' }
  },
  5: {
    'Flat 501': { id: 'PRP-501', type: 'Residential', owner: 'Suresh Iyer', areaSqFt: 880, status: 'Vacant', tax: 'PAID', encumbrance: 'CLEAR' },
    'Flat 502': { id: 'PRP-502', type: 'Residential', owner: 'Kavita Reddy', areaSqFt: 870, status: 'Occupied', tax: 'PAID', encumbrance: 'CLEAR' }
  }
};

export default function LegacyAdminPanel({ onGenerate3D, onUploadBlueprint, selectedFloor = 1, selectedFlat = 'Flat 101' }: AdminPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'Parcel' | 'Building' | 'Property'>('Parcel');

  const [formData, setFormData] = useState<AdminFormData>({
    ownerName: 'Sunita Patil',
    plotNo: '402/A',
    legacyUlpin: '142857361049',
    latitude: '21.1458',
    longitude: '79.0882',
    stateCode: 'MH',
    districtCode: 'NGP',
    totalFloors: 5,
    selectedFloor: 1,
    flatNumber: '101',
    taxStatus: 'PAID'
  });

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (onUploadBlueprint) onUploadBlueprint(file);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onGenerate3D) {
      onGenerate3D(formData);
    }
  };

  return (
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
            type="button"
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-1.5 text-[11px] font-mono font-bold rounded-full transition-colors ${activeTab === tab ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* PARCEL INFORMATION SECTION */}
        <div className="border border-slate-800 rounded-lg p-4 bg-[#111827] space-y-4 shrink-0">
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

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (onGenerate3D) onGenerate3D(formData);
            }}
            className="w-full py-2.5 bg-emerald-500 text-slate-900 font-bold rounded font-mono text-[11px] hover:bg-emerald-400 transition-colors mt-2 flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Save & Update 3D Scene Model
          </button>
        </div>

      {/* BUILDING INFORMATION SECTION */}
        <div className="border border-slate-800 rounded-lg p-4 bg-[#111827] space-y-4 shrink-0">
          <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2 mb-1">
            <Building className="w-3.5 h-3.5" /> 2. BUILDING SPATIAL ATTRIBUTES
          </h4>
          <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono inline-block">DEMO / SYNTHETIC DATA</span>
          
          <div className="space-y-3 text-[11px] font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Building Name</label>
              <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                Godavari Heights – Block A
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-slate-400 mb-1">Building ID</label>
                <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                  BLDG-402A-A01
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-slate-400 mb-1">Building Type</label>
                <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                  Residential
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-slate-400 mb-1">Total Floors</label>
                <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                  5
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-slate-400 mb-1">Total Units</label>
                <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                  10
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-slate-400 mb-1">Building Height</label>
                <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                  52.5 ft
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-slate-400 mb-1">Built-up Area</label>
                <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                  8,750 sq ft
                </div>
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Construction Status</label>
              <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                Completed
              </div>
            </div>
          </div>
        </div>

      {/* PROPERTY INFORMATION SECTION */}
        <div className="border border-slate-800 rounded-lg p-4 bg-[#111827] space-y-4 shrink-0">
          <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2 mb-1">
            <Layers className="w-3.5 h-3.5" /> 3. 3D PROPERTY ATTRIBUTES
          </h4>
          <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono inline-block">DEMO / SYNTHETIC DATA</span>
          
          <div className="space-y-3 text-[11px] font-mono">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-slate-400 mb-1">Selected Floor</label>
                <div className="w-full bg-emerald-500/20 border border-emerald-500/50 rounded px-3 py-2 text-emerald-400 font-bold">
                  Floor {selectedFloor}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-slate-400 mb-1">Selected Flat</label>
                <div className="w-full bg-emerald-500/20 border border-emerald-500/50 rounded px-3 py-2 text-emerald-400 font-bold">
                  {selectedFlat}
                </div>
              </div>
            </div>

            {DEMO_PROPERTIES[selectedFloor] && DEMO_PROPERTIES[selectedFloor][selectedFlat] ? (() => {
              const propData = DEMO_PROPERTIES[selectedFloor][selectedFlat];
              return (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Property ID</label>
                    <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                      {propData.id}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Owner Name</label>
                    <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                      {propData.owner}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-slate-400 mb-1">Property Type</label>
                      <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                        {propData.type}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-slate-400 mb-1">Area (sq ft)</label>
                      <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                        {propData.areaSqFt}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <div className="w-full bg-[#0f172a] border border-slate-700 rounded px-3 py-2 text-white">
                      {propData.status}
                    </div>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <div className={`flex-1 px-2 py-1 rounded text-center font-bold ${propData.tax === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      TAX: {propData.tax}
                    </div>
                    <div className={`flex-1 px-2 py-1 rounded text-center font-bold ${propData.encumbrance === 'CLEAR' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      ENC: {propData.encumbrance}
                    </div>
                  </div>
                </>
              );
            })() : (
              <div className="text-slate-500 italic p-4 text-center">No property data available.</div>
            )}
          </div>
        </div>
    </div>
  );
}