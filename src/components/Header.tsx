import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, ShieldCheck, Boxes, Loader2, Map, Layers, Cpu, ShieldAlert, Database, Server, Check, Globe, UploadCloud } from 'lucide-react';
import { ViewMode } from '../types/cadastral';
import { searchCadastre, SearchMatch } from '../services/cadastralService';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onSelectSearchResult: (match: SearchMatch) => void;
  dataMode?: 'DEMO' | 'IMPORTED';
}

export default function Header({ currentView, onViewChange, onSelectSearchResult, dataMode = 'DEMO' }: HeaderProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchCadastre(val);
      setSearchResults(results);
      setShowDropdown(results.length > 0);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const navItems: { view: ViewMode; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: 'OVERVIEW', icon: Server },
    { view: '2d_gis', label: '2D GIS', icon: Map },
    { view: '2d_cadastral', label: '2D Cadastral', icon: Map },
    { view: '3d_satellite', label: '3D Satellite', icon: Globe },
    { view: '3d_locality', label: '3D Locality', icon: Layers },
    { view: '3d_scene', label: 'Detailed Building', icon: Building2 },
    { view: 'ai_processing', label: 'AI/ML Lab', icon: Cpu },
    { view: 'spatial_validation', label: 'Spatial Intelligence', icon: ShieldAlert },
    { view: 'data_sources', label: 'Data Sources', icon: Database },
  ];

  return (
    <header className="glass-strong border-b border-cyber/20 px-6 py-2.5 z-50 relative">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left - Title + Screening Tag */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald to-cyber flex items-center justify-center glow-emerald">
                <Building2 className="w-5 h-5 text-slate-950" strokeWidth={2.2} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald border-2 border-slate-950 animate-pulse-glow flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-slate-950" />
              </div>
            </div>

            <div>
              <h1 className="text-base font-bold text-white leading-tight tracking-tight flex items-center gap-2">
                BHOOMI-3D
                <span className="text-emerald text-xs text-glow font-semibold px-2 py-0.5 rounded bg-emerald/10 border border-emerald/30">
                  SIH26011 Prototype
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono tracking-wider">
                National 3D Bhoomi Registry · Volumetric Cadastral System
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald/10 border border-emerald/30">
            <ShieldCheck className="w-4 h-4 text-emerald" />
            <span className="text-xs font-semibold text-emerald tracking-wide">Stage 2 Screening Prototype</span>
          </div>
        </div>

        {/* Center - View Navigation Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-cyber/20 gap-1 flex-wrap">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onViewChange(item.view)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald/90 to-cyber/90 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right - Global Search & Branding */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                placeholder="Search Property, ID, Parcel..."
                className="w-64 pl-9 pr-8 py-1.5 text-xs rounded-lg glass border border-cyber/20 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/30 transition-all font-mono"
              />
              {searchLoading && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald animate-spin" />
              )}
            </div>

            {/* Instant Search Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-strong border border-emerald/30 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                <div className="p-2 border-b border-slate-700/50 bg-slate-950/80">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-semibold">
                    Matching Search Results ({searchResults.length})
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50">
                  {searchResults.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => {
                        onSelectSearchResult(match);
                        setShowDropdown(false);
                        setQuery('');
                      }}
                      className="w-full text-left p-2.5 hover:bg-emerald/10 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-emerald font-mono">
                          {match.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald/15 text-emerald font-semibold uppercase">
                          {match.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">{match.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-700/50">
            <Boxes className="w-5 h-5 text-cyber opacity-80" />
            <div className="text-right flex flex-col">
              <div className="flex items-center gap-1.5 justify-end">
                {dataMode === 'DEMO' ? (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold uppercase border border-amber-500/30">
                    Demo Dataset
                  </span>
                ) : (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-emerald/20 text-emerald font-bold uppercase border border-emerald/30">
                    Imported Dataset
                  </span>
                )}
                <p className="text-[11px] font-semibold text-slate-300 leading-tight">Ministry of Rural Dev</p>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight font-mono">
                DATA SOURCE: {dataMode === 'DEMO' ? 'Synthetic / Non-authoritative' : 'Imported Reference'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
