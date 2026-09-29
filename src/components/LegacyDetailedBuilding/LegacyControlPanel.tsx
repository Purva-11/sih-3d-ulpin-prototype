import {
  MapPin,
  Building,
  Layers,
  Home,
  QrCode,
  Loader2,
  Copy,
  User,
  Receipt,
  FileCheck,
  Box
} from 'lucide-react';
import type { ULPINResponse } from './legacyApi';

interface ControlPanelProps {
  state: string;
  setState: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  surveyPlotNo: string;
  setSurveyPlotNo: (v: string) => void;
  floorLevel: number;
  setFloorLevel: (v: number) => void;
  flatUnit: string;
  setFlatUnit: (v: string) => void;
  onGenerate: () => void;
  loading: boolean;
  result: ULPINResponse | null;
  copied: boolean;
  onCopy: () => void;
}

const STATES = [
  { code: 'MH', label: 'Maharashtra - MH' },
  { code: 'DL', label: 'Delhi - DL' },
  { code: 'KA', label: 'Karnataka - KA' },
  { code: 'TN', label: 'Tamil Nadu - TN' },
  { code: 'RJ', label: 'Rajasthan - RJ' },
  { code: 'UP', label: 'Uttar Pradesh - UP' },
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
    { code: 'COI', label: 'Coimbatore - COI' },
  ],
  RJ: [
    { code: 'JPR', label: 'Jaipur - JPR' },
    { code: 'JOD', label: 'Jodhpur - JOD' },
  ],
  UP: [
    { code: 'LKO', label: 'Lucknow - LKO' },
    { code: 'NOI', label: 'Noida - NOI' },
  ],
};

const FLAT_OPTIONS = ['Flat 101', 'Flat 102'];

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 block">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
        style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
      >
        {children}
      </select>
    </div>
  );
}

function VolumeMetaRow({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-slate-400 tracking-wide font-mono">{label}</span>
      <span className={`text-[11px] font-mono font-semibold ${highlight ? 'text-emerald-400' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

export default function LegacyControlPanel(props: ControlPanelProps) {
  const {
    state,
    setState,
    district,
    setDistrict,
    surveyPlotNo,
    floorLevel,
    setFloorLevel,
    flatUnit,
    setFlatUnit,
    onGenerate,
    loading,
    result,
    copied,
    onCopy,
  } = props;

  const districtOptions = DISTRICTS[state] || DISTRICTS.MH;
  
  // Calculate dynamic ID based on floor level and unit like Standalone does,
  // or use result.ulpin if available
  const unitSuffix = flatUnit.includes('2') ? 2 : 1;
  const generatedId = result?.ulpin || `MHNGP-402A-A01-F0${floorLevel}-U${floorLevel}0${unitSuffix}`;
  const elevationStart = (floorLevel - 1) * 3.2;
  const topElevation = elevationStart + 3.2;
  const sqft = unitSuffix === 1 ? 880 : 870;
  const sqm = unitSuffix === 1 ? 81.75 : 80.82;
  const volume = (sqm * 3.2).toFixed(1);

  return (
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
          <div className="bg-[#111827] border border-slate-700 rounded p-2 text-slate-300 flex justify-between items-center relative">
            <select value={state} onChange={(e) => setState(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.label}</option>
              ))}
            </select>
            <span className="pointer-events-none">{STATES.find(s => s.code === state)?.label || 'Maharashtra - MH'}</span>
            <span className="text-xs pointer-events-none">▼</span>
          </div>
        </div>
        <div>
          <span className="text-slate-500 block mb-1">DISTRICT CODE</span>
          <div className="bg-[#111827] border border-slate-700 rounded p-2 text-slate-300 flex justify-between items-center relative">
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
              {districtOptions.map((d) => (
                <option key={d.code} value={d.code}>{d.label}</option>
              ))}
            </select>
            <span className="pointer-events-none">{districtOptions.find(d => d.code === district)?.label || 'Nagpur - NGP'}</span>
            <span className="text-xs pointer-events-none">▼</span>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-[10px] font-mono mb-2">
          <span className="text-slate-400 flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-emerald-400" /> Select Floor Level:</span>
          <span className="text-emerald-400 font-bold">Level {floorLevel}</span>
        </div>
        <div className="relative h-2 bg-slate-800 rounded-full mb-4">
          <input
            type="range"
            min={1}
            max={5}
            value={floorLevel}
            onChange={(e) => {
              const fl = Number(e.target.value);
              setFloorLevel(fl);
              setFlatUnit(`Flat ${fl}01`);
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          {/* Custom slider track visual */}
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full pointer-events-none" style={{ width: `${((floorLevel - 1) / 4) * 100}%` }}></div>
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full shadow-lg pointer-events-none transition-all" style={{ left: `calc(${((floorLevel - 1) / 4) * 100}% - 8px)` }}></div>
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 font-mono px-1">
          <span>F1</span><span>F2</span><span>F3</span><span>F4</span><span>F5</span>
        </div>
      </div>

      {/* TARGET PROPERTY UNIT */}
      <div className="mb-4">
        <h3 className="text-[10px] text-slate-400 font-mono mb-2 flex items-center gap-1"><Home className="w-3.5 h-3.5 text-blue-400" /> Target Property Unit:</h3>
        <div className="flex gap-2">
          {[1, 2].map((idx) => {
            const displayUnit = `Flat ${floorLevel}0${idx}`;
            const isSel = flatUnit === displayUnit;
            return (
              <button
                key={displayUnit}
                onClick={() => setFlatUnit(displayUnit)}
                className={`flex-1 py-2 rounded text-[11px] font-mono font-bold transition-all border ${
                  isSel ? 'bg-[#1e293b] border-slate-600 text-white' : 'bg-[#111827] border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {displayUnit}
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
        
        <button 
          onClick={onCopy}
          className="w-full py-2 rounded border border-slate-600 bg-[#1e293b] text-[11px] text-white hover:bg-slate-700 transition-all flex items-center justify-center gap-2 font-mono mb-4">
          <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Identifier'}
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
          <div className="flex justify-between"><span className="text-slate-500">Building / Floor:</span><span className="text-slate-300 font-bold">Godavari Heights – Block A · Floor {floorLevel}</span></div>
          
          <div className="h-px bg-slate-800 my-2"></div>
          
          <div className="flex justify-between"><span className="text-slate-500">Bottom Z-Elevation:</span><span className="text-emerald-400 font-bold">{elevationStart.toFixed(2)} m</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Top Z-Elevation:</span><span className="text-emerald-400 font-bold">{topElevation.toFixed(2)} m</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Height (ΔZ):</span><span className="text-slate-300 font-bold">3.20 m</span></div>
          
          <div className="h-px bg-slate-800 my-2"></div>
          
          <div className="flex justify-between"><span className="text-slate-500">Floor Area:</span><span className="text-slate-300 font-bold">{sqft} sq ft ({sqm.toFixed(2)} m²)</span></div>
          <div className="flex justify-between pt-1"><span className="text-slate-500">Total Enclosed Volume:</span><span className="text-cyan-400 font-bold">{volume} m³</span></div>
        </div>
      </div>

      {/* OWNERSHIP & STATUS */}
      <div className="border border-slate-800 bg-[#111827] rounded-xl p-4">
        <h2 className="text-[10px] text-slate-500 uppercase font-mono mb-2 tracking-wider">OWNERSHIP & STATUS</h2>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 font-mono">Sunita Patil</span>
        </div>
        
        <div className="flex gap-2 text-[9px] font-mono font-bold">
          <div className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded">TAX: PAID</div>
          <div className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded">ENCUMBRANCE: CLEAR</div>
        </div>
      </div>

    </div>
  );
}
