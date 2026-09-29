import React, { Suspense, useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import DashboardStats from './components/DashboardStats';
import Mapbox3DLocalityView from './components/Mapbox3DLocalityView';
import Three3DLocalityView from './components/Three3DLocalityView';
import Cadastral2DMap from './components/Cadastral2DMap';
import Cadastral2DCanvas from './components/Cadastral2DCanvas';
import ControlPanel from './components/ControlPanel';
import AdminPanel from './components/AdminPanel';
import AIMLProcessingLab from './components/AIMLProcessingLab';
import SpatialValidationPanel from './components/SpatialValidationPanel';
import DataSourcesPanel from './components/DataSourcesPanel';
import DataImportPanel from './components/DataImportPanel';

const IntegratedDashboard = React.lazy(() => import('./components/IntegratedDashboard'));
const StandaloneDetailedBuilding = React.lazy(() => import('./components/StandaloneDetailedBuilding'));
const LegacyDetailedBuilding = React.lazy(() => import('./components/LegacyDetailedBuilding/LegacyDetailedBuilding'));
import { ContextFeature } from './data/gisMockData';

import {
  Parcel,
  Building,
  PropertyVolume,
  ViewMode,
  ValidationIssue,
  ValidationSummary,
  AIJobResult,
  DataSourceInfo,
} from './types/cadastral';
import {
  fetchParcels,
  runValidationAPI,
  fetchValidationIssues,
  fetchValidationSummary,
  fetchAIJobs,
  fetchDataSources,
  SearchMatch,
  searchCadastre
} from './services/cadastralService';

function LoadingScreen() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="inline-block w-12 h-12 rounded-xl bg-gradient-to-br from-emerald to-cyber animate-spin mb-4 glow-emerald" />
        <p className="text-sm text-slate-300 font-mono">Initializing National 3D Bhoomi Registry Engine...</p>
        <p className="text-[10px] text-slate-500 font-mono mt-1">SIH26011 Stage 2 Screening Prototype</p>
      </div>
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [dataMode, setDataMode] = useState<'DEMO' | 'IMPORTED'>('DEMO');
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string>('PARCEL-402/A');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('BLD-NGP-402A-01');
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number>(4);
  const [selectedProperty, setSelectedProperty] = useState<PropertyVolume | null>(null);

  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [aiJobs, setAiJobs] = useState<AIJobResult[]>([]);
  const [dataSources, setDataSources] = useState<DataSourceInfo[]>([]);
  const [localityFeatures, setLocalityFeatures] = useState<ContextFeature[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial dataset
  useEffect(() => {
    async function loadInitialData() {
      try {
        const { fetchLocalityFeatures } = await import('./services/cadastralService');
        const [loadedParcels, loadedIssues, loadedSummary, loadedJobs, loadedDS, loadedStats, loadedHealth, loadedFeatures] = await Promise.all([
          fetchParcels(),
          fetchValidationIssues().catch(() => []),
          fetchValidationSummary().catch(() => null),
          fetchAIJobs(),
          fetchDataSources(),
          fetch('/api/stats').then(res => res.json()).catch(() => null),
          fetch('/api/health').then(res => res.json()).catch(err => ({ status: 'error', database: 'disconnected', error: String(err) })),
          fetchLocalityFeatures().catch(() => [])
        ]);

        setParcels(loadedParcels);
        setValidationIssues(loadedIssues);
        if (loadedSummary) setValidationSummary(loadedSummary);
        setAiJobs(loadedJobs);
        setDataSources(loadedDS);
        setLocalityFeatures(loadedFeatures);
        setDbStats(loadedStats);
        setHealthStatus(loadedHealth);

        const initialParcel = loadedParcels[0];
        if (initialParcel && initialParcel.buildings[0]) {
          const bldg = initialParcel.buildings[0];
          setSelectedParcelId(initialParcel.id);
          setSelectedBuildingId(bldg.id);
          const fl4 = bldg.floors.find((f) => f.floorNumber === 4) || bldg.floors[0];
          setSelectedFloorNumber(4);
          setSelectedProperty(fl4.properties[1] || fl4.properties[0]);
        }
      } catch (err) {
        console.error('Failed to load initial cadastral data', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Show all parcels to demonstrate a full locality
  const filteredParcels = parcels;

  const currentParcel = filteredParcels.find((p) => p.id === selectedParcelId) || filteredParcels[0];
  const currentBuilding =
    currentParcel?.buildings.find((b) => b.id === selectedBuildingId) || currentParcel?.buildings[0];

  // Single Source of Truth selection handlers
  const handleSelectFloor = useCallback(
    (floorNo: number) => {
      setSelectedFloorNumber(floorNo);
      if (currentBuilding) {
        const targetFloor =
          currentBuilding.floors.find((f) => f.floorNumber === floorNo) || currentBuilding.floors[0];
        if (targetFloor && targetFloor.properties.length > 0) {
          const currentSuffix = selectedProperty ? selectedProperty.unitCode.slice(-2) : '02';
          const match =
            targetFloor.properties.find((p) => p.unitCode.endsWith(currentSuffix)) ||
            targetFloor.properties[0];
          setSelectedProperty(match);
        }
      }
    },
    [currentBuilding, selectedProperty]
  );

  const handleSelectProperty = useCallback((prop: PropertyVolume) => {
    setSelectedProperty(prop);
    setSelectedFloorNumber(prop.floorNumber);
  }, []);

  const handleSelectParcel = useCallback(
    (parcelId: string) => {
      setSelectedParcelId(parcelId);
      const targetParcel = parcels.find((p) => p.id === parcelId);
      if (targetParcel && targetParcel.buildings[0]) {
        const bldg = targetParcel.buildings[0];
        setSelectedBuildingId(bldg.id);
        const fl = bldg.floors.find((f) => f.floorNumber === 4) || bldg.floors[0];
        const prop = fl.properties[1] || fl.properties[0];
        setSelectedFloorNumber(fl.floorNumber);
        setSelectedProperty(prop);
      }
    },
    [parcels]
  );

  const handleResetContext = useCallback(() => {
    if (parcels.length > 0 && parcels[0].buildings.length > 0) {
      const initialParcel = parcels[0];
      const bldg = initialParcel.buildings[0];
      setSelectedParcelId(initialParcel.id);
      setSelectedBuildingId(bldg.id);
      const fl4 = bldg.floors.find((f) => f.floorNumber === 4) || bldg.floors[0];
      setSelectedFloorNumber(fl4 ? fl4.floorNumber : 1);
      setSelectedProperty(fl4 && fl4.properties.length > 0 ? fl4.properties[0] : null);
    }
  }, [parcels]);

  const handleSelectBuilding = useCallback(
    (bldgId: string) => {
      setSelectedBuildingId(bldgId);

      // Find which parcel contains this building
      const targetParcel = parcels.find(p => p.buildings.some(b => b.id === bldgId));
      if (targetParcel) {
        if (targetParcel.id !== selectedParcelId) {
          setSelectedParcelId(targetParcel.id);
        }

        const bldg = targetParcel.buildings.find((b) => b.id === bldgId);
        if (bldg && bldg.floors.length > 0) {
          const fl = bldg.floors.find((f) => f.floorNumber === 4) || bldg.floors[0];
          const prop = fl.properties[1] || fl.properties[0];
          setSelectedFloorNumber(fl.floorNumber);
          setSelectedProperty(prop);
        }
      }
    },
    [parcels, selectedParcelId]
  );

  // Derived Statistics or Database Statistics
  const totalParcelsCount = dbStats ? parseInt(dbStats.parcels_count) : parcels.length;
  const totalBuildingsCount = dbStats ? parseInt(dbStats.buildings_count) : parcels.reduce((sum, p) => sum + p.buildings.length, 0);
  const totalFloorsCount = dbStats ? parseInt(dbStats.floors_count) : parcels.reduce(
    (sum, p) => sum + p.buildings.reduce((bSum, b) => bSum + b.totalFloors, 0),
    0
  );
  const totalPropertiesCount = dbStats ? parseInt(dbStats.properties_count) : parcels.reduce(
    (sum, p) =>
      sum +
      p.buildings.reduce(
        (bSum, b) => bSum + b.floors.reduce((fSum, f) => fSum + f.properties.length, 0),
        0
      ),
    0
  );
  const totalUndergroundCount = dbStats ? parseInt(dbStats.underground_count) : parcels.reduce((sum, p) => sum + p.undergroundAssets.length, 0);

  // Search match selection handler
  const handleSelectSearchResult = useCallback(
    (match: SearchMatch) => {
      if (match.parcelId) setSelectedParcelId(match.parcelId);
      if (match.buildingId) setSelectedBuildingId(match.buildingId);

      const targetParcel = parcels.find((p) => p.id === match.parcelId) || currentParcel;
      const targetBuilding =
        targetParcel?.buildings.find((b) => b.id === match.buildingId) || currentBuilding;

      if (match.propertyId && targetBuilding) {
        for (const fl of targetBuilding.floors) {
          const found = fl.properties.find((p) => p.id === match.propertyId);
          if (found) {
            setSelectedFloorNumber(found.floorNumber);
            setSelectedProperty(found);
            break;
          }
        }
      } else if (match.floorNumber) {
        setSelectedFloorNumber(match.floorNumber);
        if (targetBuilding) {
          const fl = targetBuilding.floors.find((f) => f.floorNumber === match.floorNumber);
          if (fl && fl.properties.length > 0) setSelectedProperty(fl.properties[0]);
        }
      }

      setCurrentView('3d_scene');
    },
    [parcels, currentParcel, currentBuilding]
  );

  if (loading || !currentParcel || !currentBuilding) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden font-sans text-white">
      {/* Top Header Navigation */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onSelectSearchResult={handleSelectSearchResult}
        dataMode={dataMode}
      />

      {/* Top Enterprise Statistics Bar */}
      <DashboardStats
        parcelsCount={totalParcelsCount}
        buildingsCount={totalBuildingsCount}
        floorsCount={totalFloorsCount}
        propertiesCount={totalPropertiesCount}
        undergroundCount={totalUndergroundCount}
        validationWarningsCount={validationSummary?.warnings || 0}
        aiJobsCount={aiJobs.length}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* VIEW MODE 0: Dashboard */}
        {currentView === 'dashboard' && (
          <Suspense fallback={<LoadingScreen />}>
            <IntegratedDashboard
              dbStats={dbStats}
              validationSummary={validationSummary}
              issues={validationIssues}
              aiJobs={aiJobs}
              dataSources={dataSources}
              healthStatus={healthStatus}
              onNavigate={setCurrentView}
              selectedParcelId={selectedParcelId}
              selectedBuildingId={selectedBuildingId}
              selectedFloorNumber={selectedFloorNumber}
              selectedProperty={selectedProperty}
              onResetContext={handleResetContext}
            />
          </Suspense>
        )}

        {/* VIEW MODE 1: 2D GIS Mapbox */}
        {currentView === '2d_gis' && (
          <Cadastral2DMap
            parcels={filteredParcels}
            selectedParcelId={selectedParcelId}
            selectedBuildingId={selectedBuildingId}
            onSelectParcel={handleSelectParcel}
            onSelectBuilding={handleSelectBuilding}
            onSwitchTo3D={() => setCurrentView('3d_satellite')}
          />
        )}

        {/* VIEW MODE 1.5: 2D Cadastral Custom Canvas */}
        {currentView === '2d_cadastral' && (
          <Cadastral2DCanvas
            parcels={filteredParcels}
            features={localityFeatures}
            selectedParcelId={selectedParcelId}
            selectedBuildingId={selectedBuildingId}
            onSelectParcel={handleSelectParcel}
            onSelectBuilding={handleSelectBuilding}
            onSwitchTo3D={() => setCurrentView('3d_locality')}
          />
        )}

        {/* VIEW MODE 2: 3D Satellite */}
        {currentView === '3d_satellite' && (
          <Suspense fallback={<LoadingScreen />}>
            <Mapbox3DLocalityView
              parcels={filteredParcels}
              selectedParcelId={selectedParcelId}
              selectedBuildingId={selectedBuildingId}
              onSelectParcel={handleSelectParcel}
              onSelectBuilding={handleSelectBuilding}
              onOpenDetailedView={() => setCurrentView('3d_scene')}
            />
          </Suspense>
        )}

        {/* VIEW MODE 3: 3D Locality Model */}
        {currentView === '3d_locality' && (
          <Suspense fallback={<LoadingScreen />}>
            <Three3DLocalityView
              parcels={filteredParcels}
              features={localityFeatures}
              selectedBuildingId={selectedBuildingId}
              onSelectBuilding={handleSelectBuilding}
              onOpenDetailedView={() => setCurrentView('3d_scene')}
            />
          </Suspense>
        )}

        {/* VIEW MODE 3 & UNDERGROUND: 3D Volumetric View */}
        {(currentView === '3d_scene' || currentView === 'underground') && (
          <Suspense fallback={<LoadingScreen />}>
            <LegacyDetailedBuilding />
          </Suspense>
        )}

        {/* VIEW MODE 3: AI/ML Processing Lab */}
        {currentView === 'ai_processing' && (
          <AIMLProcessingLab
            jobs={aiJobs}
            onTriggerSegmentation={() => {
              setCurrentView('3d_scene');
            }}
          />
        )}

        {/* VIEW MODE 4: Spatial Topology Validation */}
        {currentView === 'spatial_validation' && (
          <SpatialValidationPanel
            issues={validationIssues}
            summary={validationSummary}
            onReRunValidation={async () => {
              try {
                const res = await runValidationAPI();
                setValidationIssues(res.issues);
                setValidationSummary(res.summary);
              } catch (e) {
                console.error(e);
                alert('Validation service unavailable');
              }
            }}
            onUpdateReview={async (id, status, note) => {
              // we don't have to call updateValidationIssueReview immediately, but we can do it and optimistically update state
              import('./services/cadastralService').then(({ updateValidationIssueReview }) => {
                updateValidationIssueReview(id, status, note);
              });
              setValidationIssues(prev =>
                prev.map(i => i.id === id ? { ...i, reviewStatus: status as any, reviewNote: note } : i)
              );
            }}
            onViewEntity={(entityType, entityId) => {
              if (entityType === 'PARCEL') {
                handleSelectParcel(entityId);
                setCurrentView('2d_cadastral');
              } else if (entityType === 'BUILDING') {
                handleSelectBuilding(entityId);
                setCurrentView('3d_scene');
              } else if (entityType === 'PROPERTY') {
                // To do this perfectly we'd search for the property and set it
                const match = searchCadastre(entityId).then((matches: SearchMatch[]) => {
                  if (matches.length > 0) handleSelectSearchResult(matches[0]);
                });
              }
            }}
          />
        )}

        {/* VIEW MODE 5: Data Sources & DEM/DSM */}
        {currentView === 'data_sources' && <DataSourcesPanel sources={dataSources} />}

        {/* VIEW MODE 6: Data Import */}
        {currentView === 'data_import' && (
          <DataImportPanel
            onImportComplete={(importedParcels) => {
              setParcels((prev) => [...prev, ...importedParcels]);
              setDataMode('IMPORTED');
              setSelectedParcelId(importedParcels[0].id);
              setCurrentView('2d_gis');
            }}
          />
        )}
      </div>
    </div>
  );
}