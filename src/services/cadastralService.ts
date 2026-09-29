import { Parcel, Building, Floor, PropertyVolume, AIJobResult, DataSourceInfo } from '../types/cadastral';
import { MOCK_PARCELS as BASE_MOCK_PARCELS, MOCK_AI_JOBS, MOCK_DATA_SOURCES } from '../data/mockData';
import { ContextFeature } from '../data/gisMockData';
import { generateLargeLocality } from '../data/localityGenerator';

let cachedLocality: { parcels: Parcel[], features: ContextFeature[] } | null = null;

function getLocality() {
  if (!cachedLocality) {
    cachedLocality = generateLargeLocality();
  }
  return cachedLocality;
}

export async function fetchParcels(): Promise<Parcel[]> {
  await new Promise((resolve) => setTimeout(resolve, 80));
  const loc = getLocality();
  return [...BASE_MOCK_PARCELS, ...loc.parcels];
}

export async function fetchLocalityFeatures() {
  const loc = getLocality();
  return loc.features;
}

export async function getParcelById(parcelId: string): Promise<Parcel | null> {
  const parcels = await fetchParcels();
  return parcels.find((p) => p.id === parcelId || p.surveyNumber === parcelId) || null;
}

export async function getBuildingById(buildingId: string): Promise<Building | null> {
  const parcels = await fetchParcels();
  for (const parcel of parcels) {
    const found = parcel.buildings.find((b) => b.id === buildingId);
    if (found) return found;
  }
  return null;
}

export async function getPropertyById(propertyId: string): Promise<PropertyVolume | null> {
  const parcels = await fetchParcels();
  for (const parcel of parcels) {
    for (const bldg of parcel.buildings) {
      for (const floor of bldg.floors) {
        const found = floor.properties.find(
          (p) => p.id === propertyId || p.prototype3DId === propertyId || p.flatNumber === propertyId
        );
        if (found) return found;
      }
    }
  }
  return null;
}


export interface SearchMatch {
  type: 'parcel' | 'building' | 'property';
  id: string;
  title: string;
  subtitle: string;
  parcelId: string;
  buildingId?: string;
  floorNumber?: number;
  propertyId?: string;
  prototypeId?: string;
}

export async function searchCadastre(query: string): Promise<SearchMatch[]> {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();
  const matches: SearchMatch[] = [];
  try {
    const response = await fetch(`http://localhost:5000/api/ulpins/search?q=${encodeURIComponent(q)}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return data.map((prop: any) => ({
          type: 'property',
          id: prop.id.toString(),
          title: `${prop.flat_number} (${prop.prototype_3d_property_id})`,
          subtitle: `Owner: ${prop.owner_name} · ${prop.area} sq ft`,
          parcelId: '1',
          buildingId: '1',
          floorNumber: parseInt(prop.flat_number[0]),
          propertyId: prop.id.toString(),
          prototypeId: prop.prototype_3d_property_id,
        }));
      }
    }
  } catch (err) {
    console.warn('Backend search failed, falling back to mock data', err);
  }

  const parcels = await fetchParcels();

  for (const parcel of parcels) {
    if (
      parcel.id.toLowerCase().includes(q) ||
      parcel.surveyNumber.toLowerCase().includes(q) ||
      (parcel.legacyUlpin && parcel.legacyUlpin.includes(q))
    ) {
      matches.push({
        type: 'parcel',
        id: parcel.id,
        title: `Parcel ${parcel.surveyNumber}`,
        subtitle: `${parcel.districtName}, ${parcel.stateName} · ${parcel.areaSqM} m²`,
        parcelId: parcel.id,
      });
    }

    for (const bldg of parcel.buildings) {
      if (bldg.id.toLowerCase().includes(q) || bldg.name.toLowerCase().includes(q)) {
        matches.push({
          type: 'building',
          id: bldg.id,
          title: bldg.name,
          subtitle: `Building ${bldg.id} · ${bldg.totalFloors} Floors`,
          parcelId: parcel.id,
          buildingId: bldg.id,
        });
      }

      for (const floor of bldg.floors) {
        for (const prop of floor.properties) {
          if (
            prop.id.toLowerCase().includes(q) ||
            prop.flatNumber.toLowerCase().includes(q) ||
            prop.unitCode.toLowerCase().includes(q) ||
            prop.prototype3DId.toLowerCase().includes(q) ||
            prop.ownerName.toLowerCase().includes(q)
          ) {
            matches.push({
              type: 'property',
              id: prop.id,
              title: `${prop.flatNumber} (${prop.prototype3DId})`,
              subtitle: `Owner: ${prop.ownerName} · Floor ${prop.floorNumber} · ${prop.areaSqFt} sq ft`,
              parcelId: parcel.id,
              buildingId: bldg.id,
              floorNumber: prop.floorNumber,
              propertyId: prop.id,
              prototypeId: prop.prototype3DId,
            });
          }
        }
      }
    }
  }

  return matches;
}

import { ValidationResultModel, ValidationIssue, ValidationSummary } from '../types/cadastral';

export async function runValidationAPI(): Promise<ValidationResultModel> {
  const res = await fetch('/api/validation/run', { method: 'POST' });
  if (!res.ok) throw new Error('Validation service unavailable');
  return res.json();
}

export async function fetchValidationSummary(): Promise<ValidationSummary> {
  const res = await fetch('/api/validation/summary');
  if (!res.ok) throw new Error('Validation service unavailable');
  return res.json();
}

export async function fetchValidationIssues(): Promise<ValidationIssue[]> {
  const res = await fetch('/api/validation/issues');
  if (!res.ok) throw new Error('Validation service unavailable');
  return res.json();
}

export async function updateValidationIssueReview(id: string, reviewStatus: string, reviewNote?: string): Promise<boolean> {
  const res = await fetch(`/api/validation/issues/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewStatus, reviewNote })
  });
  return res.ok;
}



export async function fetchAIJobs(): Promise<AIJobResult[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return MOCK_AI_JOBS;
}

export async function fetchDataSources(): Promise<DataSourceInfo[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return MOCK_DATA_SOURCES;
}
