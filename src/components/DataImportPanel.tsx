import React, { useState } from 'react';
import { Upload, Database, AlertCircle, FileJson, CheckCircle2, XCircle } from 'lucide-react';
import { Parcel } from '../types/cadastral';

interface DataImportPanelProps {
  onImportComplete: (importedParcels: Parcel[]) => void;
}

export default function DataImportPanel({ onImportComplete }: DataImportPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateGeoJSON = (data: any) => {
    const errors: string[] = [];
    if (!data || data.type !== 'FeatureCollection') {
      errors.push('File must be a valid GeoJSON FeatureCollection.');
    }
    if (!data.features || !Array.isArray(data.features)) {
      errors.push('FeatureCollection must contain a "features" array.');
    } else {
      let missingGeometry = 0;
      let notPolygon = 0;
      data.features.forEach((feature: any) => {
        if (!feature.geometry) missingGeometry++;
        else if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') notPolygon++;
      });
      if (missingGeometry > 0) errors.push(`${missingGeometry} features are missing geometry.`);
      if (notPolygon > 0) errors.push(`${notPolygon} features are not Polygon/MultiPolygon.`);
    }
    
    // Very basic CRS check
    const crs = data.crs?.properties?.name || 'EPSG:4326 (assumed)';
    
    setValidationErrors(errors);
    return {
      featureCount: data.features?.length || 0,
      crs,
      isValid: errors.length === 0
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const meta = validateGeoJSON(json);
        setPreview({ ...meta, data: json });
      } catch (err) {
        setValidationErrors(['Invalid JSON file.']);
        setPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview || !preview.isValid) return;
    setIsImporting(true);

    try {
      // Simulate backend processing and converting GeoJSON to Application Parcel model
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newParcels: Parcel[] = preview.data.features.map((feature: any, idx: number) => {
        const coords = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0][0][0];
        
        return {
          id: `IMP-PARCEL-${idx + 1000}`,
          surveyNumber: feature.properties?.surveyNumber || feature.properties?.id || `SURVEY-${idx + 1}`,
          stateCode: feature.properties?.state || 'UKN',
          districtCode: feature.properties?.district || 'UKN',
          stateName: 'Imported State',
          districtName: 'Imported District',
          areaSqM: feature.properties?.area || 1000,
          areaAcres: (feature.properties?.area || 1000) * 0.000247105,
          latitude: coords[1],
          longitude: coords[0],
          boundaryStatus: 'VALIDATED',
          dataSource: 'IMPORTED DATASET',
          isAuthoritative: false,
          isSynthetic: false,
          sourceDatasetId: 'DATASET-001',
          buildings: [],
          undergroundAssets: []
        };
      });

      onImportComplete(newParcels);
      
    } catch (err) {
      setValidationErrors(['Failed to import data into database.']);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 p-8 overflow-y-auto">
      <div className="w-full max-w-3xl glass rounded-2xl border border-cyber/30 p-8">
        
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800">
          <Database className="w-8 h-8 text-emerald" />
          <div>
            <h2 className="text-xl font-bold text-white">Cadastral Data Ingestion (Phase 5)</h2>
            <p className="text-xs text-slate-400 font-mono">Import authoritative or reference geospatial datasets</p>
          </div>
        </div>

        {!file && (
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`w-full h-64 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
              dragActive ? 'border-emerald bg-emerald/10' : 'border-slate-700 bg-slate-900/50 hover:border-cyber/50 hover:bg-cyber/5'
            }`}
          >
            <Upload className={`w-12 h-12 mb-4 ${dragActive ? 'text-emerald' : 'text-slate-500'}`} />
            <p className="text-slate-300 font-bold mb-2">Drag and drop GeoJSON files here</p>
            <p className="text-slate-500 text-xs font-mono mb-4">Supports .geojson, .json (EPSG:4326/3857)</p>
            
            <label className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-pointer text-sm font-semibold transition-colors">
              Browse Files
              <input type="file" className="hidden" accept=".geojson,.json" onChange={handleChange} />
            </label>
          </div>
        )}

        {file && preview && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-start justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyber/10 flex items-center justify-center">
                  <FileJson className="w-5 h-5 text-cyber" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">{file.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button onClick={() => { setFile(null); setPreview(null); }} className="text-xs text-rose-400 hover:text-rose-300 font-mono">Cancel</button>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-950">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Import Preview</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm font-mono mb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase">Dataset Name</span>
                  <span className="text-slate-200">{file.name}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase">Features Count</span>
                  <span className="text-emerald font-bold">{preview.featureCount}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase">Detected CRS</span>
                  <span className="text-cyan-400">{preview.crs}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase">Validation Status</span>
                  <span className={preview.isValid ? 'text-emerald flex items-center gap-1' : 'text-rose-500 flex items-center gap-1'}>
                    {preview.isValid ? <><CheckCircle2 className="w-4 h-4" /> VALID</> : <><XCircle className="w-4 h-4" /> INVALID</>}
                  </span>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="p-3 mb-4 rounded bg-rose-950/30 border border-rose-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
                    <AlertCircle className="w-4 h-4" /> Validation Errors
                  </div>
                  <ul className="list-disc pl-6 text-xs text-rose-300/80 font-mono space-y-1">
                    {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-500 font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  DATA SOURCE STATUS: This dataset will be imported as <strong>IMPORTED / REFERENCE</strong> data. 
                  It is not automatically considered a legally authoritative cadastral record unless verified against the source registry.
                </p>
              </div>
            </div>

            <button 
              onClick={handleImport}
              disabled={!preview.isValid || isImporting}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                preview.isValid && !isImporting
                  ? 'bg-emerald text-slate-950 glow-emerald hover:scale-[1.01]' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isImporting ? (
                <>Importing to PostGIS...</>
              ) : (
                <>Import to Database</>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
