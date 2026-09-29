import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Upload, FileImage, Layers, Building, MapPin, Database, RefreshCw, CheckCircle } from 'lucide-react';
import { Parcel, Building as BuildingType, PropertyVolume } from '../../types/cadastral';

interface AdminPanelProps {
  onUpdateParcel: (updated: Partial<Parcel>) => void;
  onUpdateBuilding: (updated: Partial<BuildingType>) => void;
  onUpdateProperty: (updated: Partial<PropertyVolume>) => void;
  onUploadBlueprint?: (file: File) => void;
}

export default function AdminPanel({
  onUpdateParcel,
  onUpdateBuilding,
  onUpdateProperty,
  onUploadBlueprint,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'parcel' | 'building' | 'property' | 'underground'>('parcel');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form states
  const [parcelForm, setParcelForm] = useState({
    surveyNumber: '402/A',
    legacyUlpin: '142857361049',
    stateCode: 'MH',
    districtCode: 'NGP',
    areaSqM: 1250.5,
    latitude: 21.1458,
    longitude: 79.0882,
  });

  const [buildingForm, setBuildingForm] = useState({
    name: 'Godavari Heights — Block A',
    totalFloors: 5,
    floorHeightM: 3.2,
  });

  const [propertyForm, setPropertyForm] = useState({
    flatNumber: 'Flat 402',
    ownerName: 'Rahul Sharma',
    areaSqFt: 870,
    bottomElevationM: 12.8,
    topElevationM: 16.0,
  });

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (onUploadBlueprint) onUploadBlueprint(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (activeTab === 'parcel') {
      onUpdateParcel(parcelForm);
    } else if (activeTab === 'building') {
      onUpdateBuilding(buildingForm);
    } else if (activeTab === 'property') {
      onUpdateProperty(propertyForm);
    }
  };

  return (
    <aside className="w-full md:w-96 bg-slate-900/90 backdrop-blur-md border-r border-slate-800 text-white p-5 overflow-y-auto h-screen space-y-5">
      <div>
        <h2 className="text-sm font-bold text-emerald flex items-center gap-2">
          <Building className="text-emerald" size={18} />
          Ministry Admin & Survey Portal
        </h2>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SIH26011: Data Entry & Spatial Verification</p>
      </div>

      {/* Blueprint Upload */}
      <div className="glass p-3.5 rounded-xl border border-slate-700/60 space-y-2.5">
        <h3 className="text-xs font-semibold text-emerald flex items-center gap-2 uppercase tracking-wider font-mono">
          <FileImage size={14} /> Upload 2D CAD / Drone Blueprint
        </h3>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald bg-slate-950/60 p-3.5 rounded-xl cursor-pointer transition">
          <Upload className="text-slate-400 mb-1" size={18} />
          <span className="text-[11px] text-slate-300 font-medium text-center">
            {selectedFile ? selectedFile.name : 'Select 2D Floorplan Image / DWG'}
          </span>
          <span className="text-[9px] text-slate-500 mt-0.5 font-mono">PNG, JPG, SVG, CAD Layout</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>

        {previewUrl && (
          <div className="relative rounded-lg overflow-hidden border border-slate-600">
            <img src={previewUrl} alt="2D Blueprint Preview" className="w-full h-20 object-cover" />
            <span className="absolute top-1.5 right-1.5 bg-emerald text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <CheckCircle size={10} /> Extrusion Reference Ready
            </span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
        <button
          onClick={() => setActiveTab('parcel')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'parcel' ? 'bg-emerald text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
        >
          Parcel
        </button>
        <button
          onClick={() => setActiveTab('building')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'building' ? 'bg-emerald text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
        >
          Building
        </button>
        <button
          onClick={() => setActiveTab('property')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'property' ? 'bg-emerald text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
        >
          Property
        </button>
      </div>

      {/* Form Editor */}
      <form onSubmit={handleSubmit} className="glass p-4 rounded-xl border border-slate-800 space-y-3">
        {activeTab === 'parcel' && (
          <>
            <h3 className="text-xs font-semibold text-emerald font-mono uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> 1. Land Parcel Spatial Attributes
            </h3>
            <div>
              <label className="text-[10px] text-slate-400 font-mono">Survey Plot Number</label>
              <input
                type="text"
                value={parcelForm.surveyNumber}
                onChange={(e) => setParcelForm({ ...parcelForm, surveyNumber: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono">Existing 2D ULPIN — DEMO / SYNTHETIC</label>
              <input
                type="text"
                value={parcelForm.legacyUlpin}
                onChange={(e) => setParcelForm({ ...parcelForm, legacyUlpin: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-mono">Latitude (°N)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={parcelForm.latitude}
                  onChange={(e) => setParcelForm({ ...parcelForm, latitude: Number(e.target.value) })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono">Longitude (°E)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={parcelForm.longitude}
                  onChange={(e) => setParcelForm({ ...parcelForm, longitude: Number(e.target.value) })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'building' && (
          <>
            <h3 className="text-xs font-semibold text-cyber font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> 2. Building Structure Parameters
            </h3>
            <div>
              <label className="text-[10px] text-slate-400 font-mono">Building Name</label>
              <input
                type="text"
                value={buildingForm.name}
                onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <label className="text-[10px] text-slate-400 font-mono">Total Floors</label>
                <span className="text-xs font-bold text-emerald">{buildingForm.totalFloors} Floors</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={buildingForm.totalFloors}
                onChange={(e) => setBuildingForm({ ...buildingForm, totalFloors: Number(e.target.value) })}
                className="w-full accent-emerald mt-1 cursor-pointer"
              />
            </div>
          </>
        )}

        {activeTab === 'property' && (
          <>
            <h3 className="text-xs font-semibold text-purple-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> 3. 3D Property Volume Bounds
            </h3>
            <div>
              <label className="text-[10px] text-slate-400 font-mono">Flat / Property Number</label>
              <input
                type="text"
                value={propertyForm.flatNumber}
                onChange={(e) => setPropertyForm({ ...propertyForm, flatNumber: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono">Registered Owner Name</label>
              <input
                type="text"
                value={propertyForm.ownerName}
                onChange={(e) => setPropertyForm({ ...propertyForm, ownerName: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-emerald hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all glow-emerald mt-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Save & Update 3D Scene Model
        </button>
      </form>
    </aside>
  );
}