import type { Plugin } from 'vite';
import { generateULPIN, type ULPINInput } from './ulpin-engine';
import { getBuildingData } from './building-data';

const STATE_DISTRICT_COORDS: Record<string, Record<string, { lat: number; lng: number }>> = {
  MH: {
    NGP: { lat: 21.1458, lng: 79.0882 },
    MUM: { lat: 19.076, lng: 72.8777 },
    PUN: { lat: 18.5204, lng: 73.8567 },
  },
  DL: {
    CND: { lat: 28.7041, lng: 77.1025 },
    NDL: { lat: 28.6139, lng: 77.209 },
  },
  KA: {
    BLR: { lat: 12.9716, lng: 77.5946 },
    MYS: { lat: 12.2958, lng: 76.6394 },
  },
  TN: {
    CEN: { lat: 13.0827, lng: 80.2707 },
    COI: { lat: 11.0168, lng: 76.9558 },
  },
  RJ: {
    JPR: { lat: 26.9124, lng: 75.7873 },
    JOD: { lat: 26.2389, lng: 73.0243 },
  },
  UP: {
    LKO: { lat: 26.8467, lng: 80.9462 },
    NOI: { lat: 28.5355, lng: 77.391 },
  },
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function readBody(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}

export function apiPlugin(): Plugin {
  return {
    name: 'bhoomi-3d-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const method = req.method || 'GET';

        // POST /api/volumetric-properties/generate
        if (url === '/api/volumetric-properties/generate' && method === 'POST') {
          try {
            const body = await readBody(req);

            const { localityCode, parcelId, buildingId, floorId, propertyId, floorNumber, zMinM, zMaxM, footprintAreaM2 } = body;
            
            // Validation
            if (!propertyId || !floorId || !buildingId || !parcelId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing required identifiers' }));
              return;
            }
            if (zMaxM <= zMinM) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'zMaxM must be greater than zMinM' }));
              return;
            }
            if (footprintAreaM2 < 0) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Footprint area cannot be negative' }));
              return;
            }

            const verticalHeightM = zMaxM - zMinM;
            const volumeM3 = footprintAreaM2 * verticalHeightM;

            const st = localityCode ? String(localityCode).toUpperCase() : 'MH-NGP';
            const p = String(parcelId).toUpperCase();
            const b = String(buildingId).toUpperCase();
            const f = String(floorNumber).padStart(2, '0');
            const u = String(propertyId).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-3).padStart(2, '0');
            
            const prototype_id = `B3D-${st}-${p}-${b}-F${f}-U${u}`;

            const responseData = {
              prototype3DId: prototype_id,
              status: 'PROTOTYPE',
              officialUlpIn: null,
              parcelId,
              buildingId,
              floorId,
              propertyId,
              floorNumber,
              zMinM,
              zMaxM,
              verticalHeightM,
              footprintAreaM2,
              volumeM3,
              idSchemeVersion: 'B3D-V1',
              sourceType: 'SYNTHETIC',
              message: 'Prototype 3D Property ID Generated'
            };

            const response = json(responseData);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(await response.text());
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to generate ID', detail: String(err) }));
          }
          return;
        }

        // GET /api/building-floors
        if (url === '/api/building-floors' && method === 'GET') {
          const data = getBuildingData();
          const response = json(data);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(await response.text());
          return;
        }

        // GET /api/osm-buildings?lat=...&lng=...
        if (url.startsWith('/api/osm-buildings') && method === 'GET') {
          try {
            const parsed = new URL(url, 'http://localhost');
            const lat = parseFloat(parsed.searchParams.get('lat') || '21.1458');
            const lng = parseFloat(parsed.searchParams.get('lng') || '79.0882');
            const delta = 0.0015;

            const latMin = lat - delta;
            const latMax = lat + delta;
            const lngMin = lng - delta;
            const lngMax = lng + delta;

            const overpassQuery = `[out:json];(way["building"](${latMin},${lngMin},${latMax},${lngMax}););out geom;`;
            const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

            const osmResponse = await fetch(overpassUrl, { headers: { 'User-Agent': 'Bhoomi3D/1.0' } });

            if (!osmResponse.ok) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Overpass API error', status: osmResponse.status }));
              return;
            }

            const osmData = await osmResponse.json();
            const buildings: Array<{
              id: number;
              levels: number | null;
              height: number | null;
              tags: Record<string, string>;
              geometry: Array<{ lat: number; lon: number }>;
            }> = [];

            if (osmData.elements) {
              for (const el of osmData.elements) {
                if (el.type === 'way' && el.geometry && el.geometry.length >= 3) {
                  const tags = el.tags || {};
                  buildings.push({
                    id: el.id,
                    levels: tags['building:levels'] ? parseInt(tags['building:levels'], 10) : null,
                    height: tags['height'] ? parseFloat(tags['height']) : null,
                    tags,
                    geometry: el.geometry.map((g: { lat: number; lon: number }) => ({ lat: g.lat, lon: g.lon })),
                  });
                }
              }
            }

            const responseData = {
              success: true,
              query: { lat, lng, latMin, latMax, lngMin, lngMax },
              count: buildings.length,
              buildings,
            };

            const response = json(responseData);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(await response.text());
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Failed to fetch OSM data', detail: String(err) }));
          }
          return;
        }

        // GET /api/volumetric-properties/:id
        if (url.startsWith('/api/volumetric-properties/') && method === 'GET') {
          const id = url.replace('/api/volumetric-properties/', '');
          // mock lookup
          const responseData = {
            prototype3DId: id,
            status: 'PROTOTYPE',
            officialUlpIn: null,
            message: 'Existing Prototype 3D Property ID Retrieved'
          };
          const response = json(responseData);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(await response.text());
          return;
        }

        next();
      });
    },
  };
}
