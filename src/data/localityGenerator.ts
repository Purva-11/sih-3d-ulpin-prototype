import { Parcel, Building, Floor, PropertyVolume } from '../types/cadastral';
import { ContextFeature } from './gisMockData';

// Scale Configuration
export const LOCALITY_SCALE = 1000; // Configurable: 500, 1000, 1500, 2000, 2500

const ORIGIN_LAT = 21.1458;
const ORIGIN_LNG = 79.0882;
const DEG_TO_METERS = 111111;

// Deterministic PRNG (xorshift)
let state = 123456789;
function pseudoRandom() {
  state ^= state << 13;
  state ^= state >> 17;
  state ^= state << 5;
  return (state >>> 0) / 4294967296;
}

function resetRng(seed = 123456789) {
  state = seed;
}

function randomRange(min: number, max: number) {
  return min + pseudoRandom() * (max - min);
}

function randomInt(min: number, max: number) {
  return Math.floor(randomRange(min, max + 1));
}

function generateFootprint(type: string, parcelWidth: number, parcelDepth: number): number[][] {
  // Center is 0,0 local to the parcel
  const margin = 2; // 2m setback
  const w = Math.max(parcelWidth - margin * 2, 4);
  const d = Math.max(parcelDepth - margin * 2, 4);
  
  if (type === 'RESIDENTIAL') {
    // Simple rectangular
    return [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]];
  } else if (type === 'APARTMENT') {
    // L-shape or block
    return [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]];
  } else if (type === 'COMMERCIAL') {
    // Fills most of the lot
    const mw = w + 1;
    const md = d + 1;
    return [[-mw/2, -md/2], [mw/2, -md/2], [mw/2, md/2], [-mw/2, md/2]];
  } else {
    // Default
    return [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2]];
  }
}

export interface LocalityData {
  parcels: Parcel[];
  features: ContextFeature[];
}

export function generateLargeLocality(targetScale: number = LOCALITY_SCALE): LocalityData {
  resetRng();
  
  const parcels: Parcel[] = [];
  const features: ContextFeature[] = [];
  
  // Urban grid parameters
  const BLOCK_WIDTH_M = 100;
  const BLOCK_DEPTH_M = 80;
  const ROAD_WIDTH_MAJOR = 20;
  const ROAD_WIDTH_MINOR = 10;
  
  const PARCELS_PER_BLOCK_X = 5;
  const PARCELS_PER_BLOCK_Z = 4;
  
  const PARCEL_WIDTH_M = BLOCK_WIDTH_M / PARCELS_PER_BLOCK_X; // 20m
  const PARCEL_DEPTH_M = BLOCK_DEPTH_M / PARCELS_PER_BLOCK_Z; // 20m
  
  // Calculate how many blocks we need
  const parcelsPerBlock = PARCELS_PER_BLOCK_X * PARCELS_PER_BLOCK_Z;
  const targetBlocks = Math.ceil(targetScale / parcelsPerBlock);
  const gridDim = Math.ceil(Math.sqrt(targetBlocks));
  
  let parcelCounter = 1;
  let buildingCounter = 1;
  let roadCounter = 1;
  let parkCounter = 1;
  let commCounter = 1;

  for (let bx = 0; bx < gridDim; bx++) {
    for (let bz = 0; bz < gridDim; bz++) {
      if (parcels.length >= targetScale) break;

      const blockCenterX = (bx - gridDim/2) * (BLOCK_WIDTH_M + ROAD_WIDTH_MINOR);
      const blockCenterZ = (bz - gridDim/2) * (BLOCK_DEPTH_M + ROAD_WIDTH_MINOR);
      
      const blockLat = ORIGIN_LAT + (blockCenterZ / DEG_TO_METERS);
      const blockLng = ORIGIN_LNG + (blockCenterX / Math.cos(ORIGIN_LAT * Math.PI / 180) / DEG_TO_METERS);

      // Determine Block Type
      const blockTypeVal = pseudoRandom();
      let blockType = 'RESIDENTIAL';
      if (blockTypeVal > 0.9) blockType = 'PARK';
      else if (blockTypeVal > 0.8) blockType = 'COMMERCIAL';
      else if (blockTypeVal > 0.7) blockType = 'APARTMENT';
      else if (blockTypeVal > 0.65) blockType = 'COMMUNITY';
      
      if (blockType === 'PARK') {
        features.push({
          id: `F-PARK-${parkCounter++}`,
          type: 'PARK',
          name: 'Neighbourhood Park',
          latitude: blockLat,
          longitude: blockLng,
          widthM: BLOCK_WIDTH_M,
          depthM: BLOCK_DEPTH_M,
          color: '#22c55e'
        });
        continue; // Skip parcel generation for this block
      }
      
      if (blockType === 'COMMUNITY') {
        features.push({
          id: `F-COMM-${commCounter++}`,
          type: 'COMMUNITY',
          name: 'Community Center',
          latitude: blockLat,
          longitude: blockLng,
          widthM: BLOCK_WIDTH_M,
          depthM: BLOCK_DEPTH_M,
          heightM: 8,
          color: '#3b82f6'
        });
        continue;
      }

      // Generate Parcels for this block
      for (let px = 0; px < PARCELS_PER_BLOCK_X; px++) {
        for (let pz = 0; pz < PARCELS_PER_BLOCK_Z; pz++) {
          if (parcels.length >= targetScale) break;

          const localX = (px - PARCELS_PER_BLOCK_X/2 + 0.5) * PARCEL_WIDTH_M;
          const localZ = (pz - PARCELS_PER_BLOCK_Z/2 + 0.5) * PARCEL_DEPTH_M;
          
          const pLat = blockLat + (localZ / DEG_TO_METERS);
          const pLng = blockLng + (localX / Math.cos(ORIGIN_LAT * Math.PI / 180) / DEG_TO_METERS);
          
          const parcelId = `DEMO-P-${String(parcelCounter).padStart(6, '0')}`;
          
          const buildings: Building[] = [];
          
          // Generate 1-2 buildings based on block type
          let numBuildings = 1;
          if (blockType === 'RESIDENTIAL' && pseudoRandom() > 0.8) numBuildings = 2; // main house + shed
          
          for (let b = 0; b < numBuildings; b++) {
            const bId = `DEMO-B-${String(buildingCounter++).padStart(6, '0')}`;
            let floors = randomInt(1, 3);
            if (blockType === 'APARTMENT') floors = randomInt(4, 10);
            if (blockType === 'COMMERCIAL') floors = randomInt(1, 4);
            
            const bLat = pLat + ((pseudoRandom()-0.5) * 5 / DEG_TO_METERS);
            const bLng = pLng + ((pseudoRandom()-0.5) * 5 / DEG_TO_METERS);
            
            buildings.push({
              id: bId,
              name: `${blockType} Bldg ${bId.split('-')[2]}`,
              parentParcelId: parcelId,
              totalFloors: floors,
              flatsPerFloor: blockType === 'APARTMENT' ? 4 : 1,
              floorHeightM: 3.2,
              totalHeightM: floors * 3.2,
              latitude: bLat,
              longitude: bLng,
              baseAltitudeM: 310.0,
              footprintPolygon: generateFootprint(blockType, PARCEL_WIDTH_M, PARCEL_DEPTH_M),
              floors: Array.from({length: floors}).map((_, fIdx) => ({
                floorNumber: fIdx + 1,
                elevationMeters: fIdx * 3.2,
                heightMeters: 3.2,
                properties: Array.from({length: blockType === 'APARTMENT' ? 4 : 1}).map((_, flatIdx) => ({
                  id: `PROP-${bId}-F${fIdx+1}-${flatIdx+1}`,
                  flatNumber: `Flat ${fIdx+1}0${flatIdx+1}`,
                  unitCode: `U${fIdx+1}0${flatIdx+1}`,
                  floorNumber: fIdx + 1,
                  areaSqFt: 800,
                  areaSqM: 75,
                  heightM: 3.0,
                  bottomElevationM: fIdx * 3.2,
                  topElevationM: (fIdx + 1) * 3.2,
                  volumeM3: 75 * 3.0,
                  xRangeM: [-0.5, 0.5],
                  yRangeM: [-0.5, 0.5],
                  ownerName: 'Demo Owner',
                  propertyType: blockType === 'COMMERCIAL' ? 'Commercial' : 'Residential',
                  taxStatus: pseudoRandom() > 0.1 ? 'PAID' : 'PENDING',
                  encumbranceStatus: 'CLEAR',
                  registrationDate: '2025-01-01',
                  prototype3DId: `B3D-MH-NGP-${parcelId.split('-')[2]}-${bId.split('-')[2]}-F${String(fIdx+1).padStart(2,'0')}-U0${flatIdx+1}`,
                  isDemoWarning: true
                }))
              })),
              isSynthetic: true,
            });
          }
          
          parcels.push({
            id: parcelId,
            surveyNumber: `SNo.${parcelCounter}`,
            stateCode: 'MH',
            districtCode: 'NGP',
            stateName: 'Maharashtra',
            districtName: 'Nagpur',
            areaSqM: PARCEL_WIDTH_M * PARCEL_DEPTH_M,
            areaAcres: (PARCEL_WIDTH_M * PARCEL_DEPTH_M) / 4046.86,
            latitude: pLat,
            longitude: pLng,
            boundaryStatus: 'VALIDATED',
            dataSource: 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA',
            buildings: buildings,
            undergroundAssets: [],
            isSynthetic: true
          });
          
          parcelCounter++;
        }
      }
    }
  }

  // Generate Roads
  for (let bx = 0; bx <= gridDim; bx++) {
    const roadX = (bx - gridDim/2 - 0.5) * (BLOCK_WIDTH_M + ROAD_WIDTH_MINOR);
    const roadLng = ORIGIN_LNG + (roadX / Math.cos(ORIGIN_LAT * Math.PI / 180) / DEG_TO_METERS);
    features.push({
      id: `F-ROAD-V-${roadCounter++}`,
      type: 'ROAD',
      name: 'Local Street',
      latitude: ORIGIN_LAT,
      longitude: roadLng,
      widthM: ROAD_WIDTH_MINOR,
      depthM: gridDim * (BLOCK_DEPTH_M + ROAD_WIDTH_MINOR),
      color: '#475569'
    });
  }
  for (let bz = 0; bz <= gridDim; bz++) {
    const roadZ = (bz - gridDim/2 - 0.5) * (BLOCK_DEPTH_M + ROAD_WIDTH_MINOR);
    const roadLat = ORIGIN_LAT + (roadZ / DEG_TO_METERS);
    features.push({
      id: `F-ROAD-H-${roadCounter++}`,
      type: 'ROAD',
      name: 'Local Street',
      latitude: roadLat,
      longitude: ORIGIN_LNG,
      widthM: gridDim * (BLOCK_WIDTH_M + ROAD_WIDTH_MINOR),
      depthM: ROAD_WIDTH_MINOR,
      color: '#475569'
    });
  }

  return { parcels, features };
}
