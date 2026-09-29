import axios from 'axios';

export interface VolumetricPropertyRequest {
  localityCode?: string;
  parcelId: string;
  buildingId: string;
  floorId: string;
  propertyId: string;
  floorNumber: number;
  zMinM: number;
  zMaxM: number;
  footprintAreaM2: number;
}

export interface VolumetricPropertyResponse {
  prototype3DId: string;
  status: string;
  officialUlpIn: string | null;
  parcelId: string;
  buildingId: string;
  floorId: string;
  propertyId: string;
  floorNumber: number;
  zMinM: number;
  zMaxM: number;
  verticalHeightM: number;
  footprintAreaM2: number;
  volumeM3: number;
  idSchemeVersion: string;
  sourceType: string;
  message?: string;
}

export interface OSMBuilding {
  id: number;
  levels: number | null;
  height: number | null;
  tags: Record<string, string>;
  geometry: Array<{ lat: number; lon: number }>;
}

export interface OSMBuildingResponse {
  success: boolean;
  count: number;
  buildings: OSMBuilding[];
}

export interface BuildingFlat {
  unit: string;
  flat_number: number;
  area_sqft: number;
  owner: string;
  tax_status: 'PAID' | 'PENDING';
  encumbrance: 'CLEAR' | 'ENCUMBERED';
  registered: boolean;
}

export interface BuildingFloor {
  floor_number: number;
  elevation_meters: number;
  flats: BuildingFlat[];
}

export interface BuildingData {
  building_id: string;
  building_name: string;
  total_floors: number;
  flats_per_floor: number;
  spatial_bounds: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
    base_altitude_m: number;
    floor_height_m: number;
  };
  floors: BuildingFloor[];
}

const API_VOLUMETRIC_GEN_URL = 'http://localhost:5000/api/volumetric-properties/generate';
const API_VOLUMETRIC_LOOKUP_URL = 'http://localhost:5000/api/volumetric-properties';
const API_BUILDING_URL = 'http://localhost:5000/api/building-floors';
const API_OSM_URL = 'http://localhost:5000/api/osm/buildings';


function buildMockResponse(req: VolumetricPropertyRequest): VolumetricPropertyResponse {
  const st = req.localityCode || 'MH-NGP';
  const p = req.parcelId.toUpperCase();
  const b = req.buildingId.toUpperCase();
  const f = String(req.floorNumber).padStart(2, '0');
  const u = req.propertyId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-3).padStart(2, '0');
  const prototype3DId = `B3D-${st}-${p}-${b}-F${f}-U${u}`;
  
  return {
    prototype3DId,
    status: 'PROTOTYPE',
    officialUlpIn: null,
    parcelId: req.parcelId,
    buildingId: req.buildingId,
    floorId: req.floorId,
    propertyId: req.propertyId,
    floorNumber: req.floorNumber,
    zMinM: req.zMinM,
    zMaxM: req.zMaxM,
    verticalHeightM: req.zMaxM - req.zMinM,
    footprintAreaM2: req.footprintAreaM2,
    volumeM3: (req.zMaxM - req.zMinM) * req.footprintAreaM2,
    idSchemeVersion: 'B3D-V1',
    sourceType: 'SYNTHETIC',
    message: 'Prototype 3D Property ID Generated (Mock)'
  };
}

export async function generateVolumetricProperty(req: VolumetricPropertyRequest): Promise<VolumetricPropertyResponse> {
  try {
    const response = await axios.post(API_VOLUMETRIC_GEN_URL, req, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.data && response.data.prototype3DId) {
      return response.data;
    }
    return buildMockResponse(req);
  } catch {
    return buildMockResponse(req);
  }
}

export async function lookupVolumetricProperty(id: string): Promise<VolumetricPropertyResponse | null> {
  try {
    const response = await axios.get(`${API_VOLUMETRIC_LOOKUP_URL}/${id}`, { timeout: 3000 });
    if (response.data && response.data.prototype3DId) return response.data;
    return null;
  } catch {
    return null;
  }
}

export async function fetchBuildingData(): Promise<BuildingData | null> {
  try {
    const response = await axios.get(API_BUILDING_URL, { timeout: 3000 });
    if (response.data) return response.data as BuildingData;
    return null;
  } catch {
    return null;
  }
}

export async function fetchOSMBuildings(lat: number, lng: number): Promise<OSMBuildingResponse> {
  try {
    const response = await axios.get(API_OSM_URL, {
      params: { lat, lng },
      timeout: 10000,
    });
    return response.data as OSMBuildingResponse;
  } catch {
    return { success: false, count: 0, buildings: [] };
  }
}
