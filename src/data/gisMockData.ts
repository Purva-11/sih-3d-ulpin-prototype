import { Parcel, Building, Floor } from '../types/cadastral';
import { generatePrototype3DId } from './mockData';

// Center coordinates for Godavari Heights
const CENTER_LAT = 21.1458;
const CENTER_LNG = 79.0882;

export const PARCELS_GEOJSON = {
  type: 'FeatureCollection',
  features: [] as any[],
};

export const BUILDINGS_GEOJSON = {
  type: 'FeatureCollection',
  features: [] as any[],
};

export const ROADS_GEOJSON = {
  type: 'FeatureCollection',
  features: [] as any[],
};

export const UNDERGROUND_GEOJSON = {
  type: 'FeatureCollection',
  features: [] as any[],
};

export interface ContextFeature {
  id: string;
  type: 'ROAD' | 'PARK' | 'COMMUNITY' | 'COMMERCIAL';
  name: string;
  latitude: number;
  longitude: number;
  widthM: number; // width in X
  depthM: number; // depth in Z
  heightM?: number; // for 3D height
  color?: string;
}

export const LOCALITY_FEATURES: ContextFeature[] = [
  { id: 'F-PARK-01', type: 'PARK', name: 'Central Park — DEMO', latitude: CENTER_LAT - 0.0006, longitude: CENTER_LNG, widthM: 60, depthM: 30, color: '#22c55e' },
  { id: 'F-COMM-01', type: 'COMMUNITY', name: 'Community Centre — DEMO', latitude: CENTER_LAT, longitude: CENTER_LNG - 0.001, widthM: 40, depthM: 20, heightM: 8, color: '#3b82f6' },
  { id: 'F-ROAD-01', type: 'ROAD', name: 'Main Arterial Road', latitude: CENTER_LAT + 0.0002, longitude: CENTER_LNG, widthM: 300, depthM: 10, color: '#475569' },
  { id: 'F-ROAD-02', type: 'ROAD', name: 'Secondary Road', latitude: CENTER_LAT, longitude: CENTER_LNG + 0.0002, widthM: 10, depthM: 300, color: '#475569' },
];

export const EXTENDED_MOCK_PARCELS: Parcel[] = [];

// Helper to generate a polygon roughly around a point
function generatePolygon(lat: number, lng: number, size: number) {
  const latOffset = size / 111111; // roughly meters to degrees
  const lngOffset = size / (111111 * Math.cos(lat * Math.PI / 180));
  return [
    [
      [lng - lngOffset, lat - latOffset],
      [lng + lngOffset, lat - latOffset],
      [lng + lngOffset, lat + latOffset],
      [lng - lngOffset, lat + latOffset],
      [lng - lngOffset, lat - latOffset],
    ]
  ];
}

// Generate 20 parcels and buildings in a grid around the center, deterministically
const GRID_SIZE = 5;
const SPACING_M = 40; // 40 meters spacing

for (let i = 0; i < GRID_SIZE; i++) {
  for (let j = 0; j < GRID_SIZE; j++) {
    // Skip center (0,0) as it's Godavari Heights (402/A) and (0,1) for Kaveri (402/B)
    if (i === 2 && j === 2) continue;
    if (i === 2 && j === 3) continue;

    const lat = CENTER_LAT + (i - 2) * (SPACING_M / 111111);
    const lng = CENTER_LNG + (j - 2) * (SPACING_M / (111111 * Math.cos(CENTER_LAT * Math.PI / 180)));
    
    const idNum = 1000 + i * GRID_SIZE + j;
    const parcelId = `PARCEL-${idNum}`;
    const buildingId = `BLD-NGP-${idNum}`;

    // Deterministic pseudo-random values based on i and j
    const pseudoRand = (i * 7 + j * 13) % 100;
    const parcelArea = 1000 + pseudoRand * 5;
    const buildingHeight = 10 + (pseudoRand % 20);
    const floors = Math.max(1, Math.floor(buildingHeight / 3.5));

    // Add to GeoJSON
    PARCELS_GEOJSON.features.push({
      type: 'Feature',
      properties: {
        id: parcelId,
        parcelNumber: `SURVEY-${idNum}`,
        area: parcelArea,
        dataSource: 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA',
      },
      geometry: {
        type: 'Polygon',
        coordinates: generatePolygon(lat, lng, 18),
      },
    });

    BUILDINGS_GEOJSON.features.push({
      type: 'Feature',
      properties: {
        id: buildingId,
        parcelId: parcelId,
        buildingName: `Demo Building ${idNum}`,
        height: buildingHeight,
        floors: floors,
        dataSource: 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA',
      },
      geometry: {
        type: 'Polygon',
        coordinates: generatePolygon(lat, lng, 12),
      },
    });

    // Add to Cadastral Data Model
    EXTENDED_MOCK_PARCELS.push({
      id: parcelId,
      surveyNumber: `${idNum}`,
      stateCode: 'MH',
      districtCode: 'NGP',
      stateName: 'Maharashtra',
      districtName: 'Nagpur',
      areaSqM: parseFloat(parcelArea.toFixed(2)),
      areaAcres: parseFloat((parcelArea / 4046.86).toFixed(2)),
      latitude: lat,
      longitude: lng,
      boundaryStatus: 'VALIDATED',
      dataSource: 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA',
      undergroundAssets: [],
      buildings: [
        {
          id: buildingId,
          name: `Demo Building ${idNum}`,
          parentParcelId: parcelId,
          totalFloors: floors,
          flatsPerFloor: 1, // simplified
          floorHeightM: 3.5,
          totalHeightM: buildingHeight,
          latitude: lat,
          longitude: lng,
          baseAltitudeM: 310.0,
          footprintPolygon: [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ],
          floors: Array.from({ length: floors }, (_, floorIdx) => {
            const fNum = floorIdx + 1;
            return {
              floorNumber: fNum,
              elevationMeters: (fNum - 1) * 3.5,
              heightMeters: 3.5,
              properties: [
                {
                  id: `PROP-DEMO-${idNum}-${fNum}01`,
                  flatNumber: `Unit ${fNum}01`,
                  unitCode: `U${fNum}01`,
                  floorNumber: fNum,
                  areaSqFt: 500,
                  areaSqM: 46.5,
                  heightM: 3.5,
                  bottomElevationM: (fNum - 1) * 3.5,
                  topElevationM: fNum * 3.5,
                  volumeM3: 162.75,
                  xRangeM: [-0.9, 0.9],
                  yRangeM: [-0.9, 0.9],
                  ownerName: 'Demo Owner',
                  propertyType: 'Residential',
                  taxStatus: 'PAID',
                  encumbranceStatus: 'CLEAR',
                  registrationDate: '2024-01-01',
                  prototype3DId: generatePrototype3DId('MH', 'NGP', `${idNum}`, 'B01', fNum, `${fNum}01`),
                }
              ]
            }
          })
        }
      ]
    });
  }
}

// Add Godavari Heights to GeoJSON
PARCELS_GEOJSON.features.push({
  type: 'Feature',
  properties: { id: 'PARCEL-402/A', parcelNumber: '402/A', area: 1250.5, dataSource: 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA' },
  geometry: { type: 'Polygon', coordinates: generatePolygon(CENTER_LAT, CENTER_LNG, 20) },
});
BUILDINGS_GEOJSON.features.push({
  type: 'Feature',
  properties: { id: 'BLD-NGP-402A-01', parcelId: 'PARCEL-402/A', buildingName: 'Godavari Heights', height: 16.0, floors: 5, dataSource: 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA' },
  geometry: { type: 'Polygon', coordinates: generatePolygon(CENTER_LAT, CENTER_LNG, 15) },
});
UNDERGROUND_GEOJSON.features.push({
  type: 'Feature',
  properties: { id: 'PIPE-W-102', assetType: 'Water Pipeline', depth: 3.5, dataSource: 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA' },
  geometry: { type: 'LineString', coordinates: [[CENTER_LNG - 0.0005, CENTER_LAT - 0.0002], [CENTER_LNG + 0.0005, CENTER_LAT - 0.0002]] }
});

// Add Kaveri Complex to GeoJSON
const kaveriLat = 21.1465;
const kaveriLng = 79.0890;
PARCELS_GEOJSON.features.push({
  type: 'Feature',
  properties: { id: 'PARCEL-402/B', parcelNumber: '402/B', area: 980.0, dataSource: 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA' },
  geometry: { type: 'Polygon', coordinates: generatePolygon(kaveriLat, kaveriLng, 18) },
});
BUILDINGS_GEOJSON.features.push({
  type: 'Feature',
  properties: { id: 'BLD-NGP-402B-01', parcelId: 'PARCEL-402/B', buildingName: 'Kaveri Commercial Complex', height: 10.5, floors: 3, dataSource: 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA' },
  geometry: { type: 'Polygon', coordinates: generatePolygon(kaveriLat, kaveriLng, 12) },
});

// Roads
ROADS_GEOJSON.features.push({
  type: 'Feature',
  properties: { name: 'Main Arterial Road', type: 'Primary' },
  geometry: { type: 'LineString', coordinates: [[CENTER_LNG - 0.002, CENTER_LAT + 0.0005], [CENTER_LNG + 0.002, CENTER_LAT + 0.0005]] }
});
