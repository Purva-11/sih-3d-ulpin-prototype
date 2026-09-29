import React, { useState, useRef } from 'react';
import { Parcel } from '../types/cadastral';
import { MapPin, Maximize, Layers, AlertCircle } from 'lucide-react';
import Map, { NavigationControl, FullscreenControl, MapRef, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LOCALITY_FEATURES } from '../data/gisMockData';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface Cadastral2DMapProps {
  parcels: Parcel[];
  selectedParcelId: string;
  selectedBuildingId: string;
  onSelectParcel: (parcelId: string) => void;
  onSelectBuilding: (buildingId: string) => void;
  onSwitchTo3D: () => void;
}

export default function Cadastral2DMap({
  parcels,
  selectedParcelId,
  selectedBuildingId,
  onSelectParcel,
  onSelectBuilding,
  onSwitchTo3D,
}: Cadastral2DMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapMode, setMapMode] = useState<'MAP' | 'SATELLITE'>('MAP');

  const geojsonData = React.useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: parcels.map((p: Parcel) => {
        const size = Math.sqrt(p.areaSqM || 100) / 111111; // rough degree approx
        return {
          type: 'Feature',
          properties: { id: p.id, label: p.surveyNumber },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [p.longitude - size/2, p.latitude - size/2],
                [p.longitude + size/2, p.latitude - size/2],
                [p.longitude + size/2, p.latitude + size/2],
                [p.longitude - size/2, p.latitude + size/2],
                [p.longitude - size/2, p.latitude - size/2],
              ]
            ]
          }
        };
      })
    };
  }, [parcels]);

  const featuresGeojson = React.useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: LOCALITY_FEATURES.map((f) => {
        const w = (f.widthM) / 111111;
        const h = (f.depthM) / 111111;
        return {
          type: 'Feature',
          properties: { id: f.id, label: f.name, color: f.color || '#888' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [f.longitude - w/2, f.latitude - h/2],
                [f.longitude + w/2, f.latitude - h/2],
                [f.longitude + w/2, f.latitude + h/2],
                [f.longitude - w/2, f.latitude + h/2],
                [f.longitude - w/2, f.latitude - h/2],
              ]
            ]
          }
        };
      })
    };
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white p-8">
        <h2 className="text-xl font-bold mb-2">Mapbox Configuration Missing</h2>
        <p className="text-slate-400 max-w-md text-center">
          Mapbox access token is not configured. Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to your <code>.env.local</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-950 text-white overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 79.0882,
          latitude: 21.1458,
          zoom: 16,
          pitch: 0,
          bearing: 0
        }}
        mapStyle={mapMode === 'SATELLITE' ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/streets-v12"}
        maxPitch={0}
      >

        


        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" showCompass={false} />
      </Map>
      
      {/* MAP INFO PANEL */}
      <div className="absolute top-4 left-4 z-10 w-72 glass-strong border border-cyber/20 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/80 pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-emerald" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">GIS Locality</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Real-world geographic reference
          </p>
        </div>

        <div className="p-4 space-y-4 pointer-events-auto">
          <div className="space-y-2">
            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cadastral Overlays</h3>
            <div className="p-4 bg-emerald/10 border border-emerald/30 rounded-lg flex flex-col items-center justify-center text-center gap-2">
              <MapPin className="w-6 h-6 text-emerald" />
              <p className="text-xs text-emerald font-bold">Cadastral Topology Active</p>
              <p className="text-[10px] text-emerald/80">{parcels.length} parcels & features rendered.</p>
              <p className="text-[9px] text-emerald/60 mt-1">DEMO / SYNTHETIC CADASTRAL DATA</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/50">
            <button 
              onClick={onSwitchTo3D}
              className="w-full py-2.5 bg-gradient-to-r from-emerald to-cyber text-slate-900 font-bold rounded-lg hover:scale-[1.02] transition-all shadow-lg glow-emerald text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Maximize className="w-4 h-4" />
              EXPLORE 3D SATELLITE
            </button>
          </div>
        </div>
      </div>

      {/* BASEMAP CONTROLS */}
      <div className="absolute top-4 right-14 z-10 glass-strong border border-cyber/20 rounded-xl shadow-2xl overflow-hidden flex flex-col w-48 pointer-events-auto">
        <div className="p-2 bg-slate-900/80">
           <h3 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1 mb-2"><Layers className="w-3 h-3"/> Basemap</h3>
           <div className="flex gap-1">
              <button 
                onClick={() => setMapMode('MAP')} 
                className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${mapMode === 'MAP' ? 'bg-emerald text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                MAP
              </button>
              <button 
                onClick={() => setMapMode('SATELLITE')} 
                className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${mapMode === 'SATELLITE' ? 'bg-emerald text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                SATELLITE
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
