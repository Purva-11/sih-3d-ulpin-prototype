export interface DatasetMetadata {
  id: string;
  datasetName: string;
  sourceName?: string;
  sourceType: 'AUTHORITATIVE' | 'IMPORTED' | 'REFERENCE' | 'SYNTHETIC';
  jurisdiction?: string;
  captureDate?: string;
  importDate: string;
  coordinateReferenceSystem: string; // e.g. EPSG:4326 or EPSG:3857
  geometryType: string;
  license?: string;
  status: string;
  description?: string;
  isAuthoritative: boolean;
  isDemo: boolean;
}
export interface VolumetricProperty {
  prototype3DId: string;
  propertyId: string;
  parcelId: string;
  buildingId: string;
  floorId: string;
  floorNumber: number;
  zMinM: number;
  zMaxM: number;
  verticalHeightM: number;
  footprintAreaM2: number;
  volumeM3: number;
  officialUlpIn: string | null;
  idSchemeVersion: string;
  sourceType: 'AUTHORITATIVE' | 'IMPORTED' | 'DERIVED' | 'DEMO' | 'SYNTHETIC';
  status: 'PROTOTYPE' | 'ACTIVE';
  message?: string;
}

export interface PropertyVolume {
  id: string;
  flatNumber: string; // e.g. "Flat 402"
  unitCode: string; // e.g. "U402"
  floorNumber: number;
  areaSqFt: number;
  areaSqM: number;
  heightM: number;
  bottomElevationM: number;
  topElevationM: number;
  volumeM3: number;
  xRangeM: [number, number]; // [min, max] relative offset
  yRangeM: [number, number];
  ownerName: string;
  propertyType: 'Residential' | 'Commercial' | 'Mixed-Use' | 'Institutional';
  taxStatus: 'PAID' | 'PENDING' | 'DUE';
  encumbranceStatus: 'CLEAR' | 'ENCUMBERED';
  registrationDate: string;
  prototype3DId: string;
  isDemoWarning?: boolean;
}

export interface Floor {
  floorNumber: number;
  elevationMeters: number;
  heightMeters: number;
  properties: PropertyVolume[];
}

export interface Building {
  id: string;
  name: string;
  parentParcelId: string;
  totalFloors: number;
  flatsPerFloor: number;
  floorHeightM: number;
  totalHeightM: number;
  latitude: number;
  longitude: number;
  baseAltitudeM: number;
  footprintPolygon: number[][]; // [[x, z], ...] local offset
  floors: Floor[];
  sourceDatasetId?: string;
  sourceBuildingId?: string;
  sourceReference?: string;
  isAuthoritative?: boolean;
  isSynthetic?: boolean;
}

export interface UndergroundAsset {
  id: string;
  name: string;
  type: 'Water Pipeline' | 'Sewer Line' | 'Fiber Optic Cable' | 'Basement Parking' | 'Metro Tunnel';
  depthM: number;
  elevationZ: number;
  parentParcelId: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'PLANNED';
  pathCoords: number[][]; // [[x, z], ...]
  diameterM?: number;
}

export interface Parcel {
  id: string; // e.g. "PARCEL-402/A"
  surveyNumber: string; // "402/A"
  stateCode: string;
  districtCode: string;
  stateName: string;
  districtName: string;
  legacyUlpin?: string;
  areaSqM: number;
  areaAcres: number;
  latitude: number;
  longitude: number;
  boundaryStatus: 'VALIDATED' | 'PENDING_SURVEY' | 'DISPUTED';
  dataSource: string;
  sourceDatasetId?: string;
  sourceParcelId?: string;
  sourceReference?: string;
  isAuthoritative?: boolean;
  isSynthetic?: boolean;
  buildings: Building[];
  undergroundAssets: UndergroundAsset[];
}

export interface ValidationIssue {
  id: string;
  ruleId: string;
  category: 'GEOMETRY' | 'PARCEL_TOPOLOGY' | 'BUILDING_PARCEL' | 'BUILDING_OVERLAP' | 'PROPERTY_BUILDING' | 'FLOOR_HIERARCHY' | 'VOLUMETRIC' | 'VERTICAL_TOPOLOGY';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  status: 'PASSED' | 'WARNING' | 'FAILED' | 'NOT_CHECKED' | 'NOT_APPLICABLE';
  entityType: 'PARCEL' | 'BUILDING' | 'FLOOR' | 'PROPERTY' | 'VOLUMETRIC_PROPERTY' | 'LOCALITY' | 'UNDERGROUND_ASSET';
  entityId: string;
  relatedEntityIds?: string[];
  message: string;
  details?: any;
  source: 'POSTGIS' | 'DATABASE_INTEGRITY' | 'AI_OUTPUT' | 'USER_INPUT' | 'DERIVED_DATA' | 'DEMO_DATA';
  requiresReview: boolean;
  reviewStatus: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  reviewNote?: string;
  createdAt: string;
}

export interface ValidationSummary {
  totalChecks: number;
  passed: number;
  warnings: number;
  errors: number;
  critical: number;
  requiresReview: number;
}

export interface ValidationResultModel {
  summary: ValidationSummary;
  issues: ValidationIssue[];
}



export interface AIJobResult {
  id: string;
  title: string;
  capability: 'Building Extraction' | 'Floor Segmentation' | 'Parcel Association' | 'Topology Validation';
  inputSource: string;
  outputArtifact: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVIEW_REQUIRED' | 'DEMO' | 'COMPLETED — DEMO' | 'PROCESSING — DEMO';
  confidenceMetric?: string;
  summary: string;
  
  // Phase 6 extensions
  jobType?: string;
  createdAt?: string;
  completedAt?: string;
  modelName?: string;
  modelVersion?: string;
  modelSource?: string;
  inferenceTimestamp?: string;
  license?: string;
  provenanceStatus?: 'AUTHORITATIVE' | 'REFERENCE' | 'IMPORTED MODEL' | 'MODEL INFERENCE' | 'SIMULATED' | 'DEMO' | 'NOT VALIDATED';
}

export interface DataSourceInfo {
  id: string;
  name: string;
  category: 'Drone Imagery' | 'LiDAR Point Cloud' | 'GIS Cadastral' | '2D CAD Floorplan' | 'GNSS/CORS' | 'DEM/DSM' | 'OpenStreetMap';
  purpose: string;
  dataType: string;
  processingState: 'SYNTHETIC / DEMO' | 'CONNECTED — OPEN DATA' | 'NOT CONNECTED — DEMO' | 'LIVE RTK';
  lastUpdated: string;
}

export type ViewMode = 'dashboard' | '2d_gis' | '2d_cadastral' | '3d_satellite' | '3d_locality' | '3d_scene' | 'ai_processing' | 'spatial_validation' | 'underground' | 'data_sources' | 'data_import';
