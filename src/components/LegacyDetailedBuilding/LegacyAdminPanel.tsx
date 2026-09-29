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
}

export default function LegacyAdminPanel({ onGenerate3D, onUploadBlueprint }: AdminPanelProps) {
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
      {activeTab === 'Parcel' && (
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
      )}
    </div>
  );
}