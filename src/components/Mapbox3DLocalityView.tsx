import React, { useRef } from 'react';
import Map, { NavigationControl, FullscreenControl, MapRef, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, AlertTriangle, Layers } from 'lucide-react';
import { Parcel } from '../types/cadastral';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface Mapbox3DLocalityViewProps {
  parcels: Parcel[];
  selectedParcelId: string;
  selectedBuildingId: string | null;
  onSelectParcel: (parcelId: string) => void;
  onSelectBuilding: (buildingId: string) => void;
  onOpenDetailedView: () => void;
}

export default function Mapbox3DLocalityView({ parcels }: Mapbox3DLocalityViewProps) {
  const mapRef = useRef<MapRef>(null);

  const hasRealData = parcels.length > 0 && parcels[0].isSynthetic === false;
  
  const geojsonData = React.useMemo(() => {
    if (!hasRealData) return null;
    return {
      type: 'FeatureCollection',
      features: parcels.map((p) => ({
        type: 'Feature',
        properties: { id: p.id, label: p.surveyNumber },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [p.longitude - 0.0005, p.latitude - 0.0005],
              [p.longitude + 0.0005, p.latitude - 0.0005],
              [p.longitude + 0.0005, p.latitude + 0.0005],
              [p.longitude - 0.0005, p.latitude + 0.0005],
              [p.longitude - 0.0005, p.latitude - 0.0005],
            ]
          ]
        }
      }))
    };
  }, [parcels, hasRealData]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white p-8">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Mapbox Configuration Missing</h2>
        <p className="text-slate-400 max-w-md text-center">
          Mapbox access token is not configured. Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to your <code>.env.local</code> file in the project root to enable the 3D Satellite view.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0F172A] overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 79.0882, // Locality scale coordinate
          latitude: 21.1458,
          zoom: 17.5,
          pitch: 60, // Sufficient pitch to make geographic camera perspective visible
          bearing: -20
        }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      >
        {hasRealData && geojsonData && (
          <Source id="parcels-3d" type="geojson" data={geojsonData as any}>
            <Layer 
              id="parcel-fills-3d"
              type="fill"
              paint={{
                'fill-color': '#10b981',
                'fill-opacity': 0.1
              }}
            />
            <Layer 
              id="parcel-borders-3d"
              type="line"
              paint={{
                'line-color': '#10b981',
                'line-width': 2
              }}
            />
            <Layer 
              id="parcel-labels-3d"
              type="symbol"
              layout={{
                'text-field': ['get', 'label'],
                'text-size': 12,
                'text-anchor': 'center'
              }}
              paint={{
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1
              }}
            />
          </Source>
        )}

        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" visualizePitch={true} />
      </Map>

      {/* Floating GIS Information Panel */}
      <div className="absolute top-4 left-4 z-10 w-72 glass-strong border border-cyber/20 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/80 pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3D SATELLITE</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Real-world geographic reference
          </p>
          <p className="text-[10px] text-slate-400 font-mono mt-1">
            Mapbox Satellite
          </p>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto pointer-events-auto">
          <div className="space-y-2">
            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">MAP DATA</h3>
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Satellite imagery:</span>
                <span className="text-emerald font-bold">AVAILABLE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Cadastral geometry:</span>
                {hasRealData ? (
                  <span className="text-emerald font-bold">LOADED (IMPORTED)</span>
                ) : (
                  <span className="text-amber-500 font-bold">NOT LOADED</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">3D building geometry:</span>
                <span className="text-amber-500 font-bold">NOT LOADED</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/50">
            <p className="text-[9px] text-yellow-500 font-bold text-center leading-tight">
              DEMO / PROTOTYPE<br/>Satellite imagery is geographic<br/>reference imagery.
            </p>
          </div>
        </div>
      </div>

      {/* LAYER CONTROLS */}
      <div className="absolute top-4 right-14 z-10 glass-strong border border-cyber/20 rounded-xl shadow-2xl overflow-hidden flex flex-col w-48 pointer-events-auto">
        <div className="p-2 border-b border-slate-700/50 bg-slate-900/80">
           <h3 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1"><Layers className="w-3 h-3"/> BASE MAP</h3>
        </div>
        <div className="p-3 space-y-2 bg-slate-900/50">
          <label className="flex items-center justify-between cursor-pointer text-xs font-mono text-slate-300 hover:text-white transition-colors">
            <span>Satellite</span>
            <span className="text-emerald font-bold">✓</span>
          </label>
        </div>
      </div>
    </div>
  );
}
