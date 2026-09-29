import { pool } from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Use tsx to load these directly, though we must use relative path with extension
import { PARCELS_GEOJSON, BUILDINGS_GEOJSON, UNDERGROUND_GEOJSON, EXTENDED_MOCK_PARCELS } from '../../src/data/gisMockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  console.log('Starting PostGIS Seeding...');
  
  try {
    // 1. Run Schema
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('Schema created successfully.');

    // 2. Insert Locality (buffered to create a Polygon, as per schema)
    await pool.query(
      `INSERT INTO localities (id, name, district, state, geom)
       VALUES ($1, $2, $3, $4, ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint($5, $6), 4326), 3857), 1000))`,
      ['LOC-NGP-01', 'Nagpur Demo Locality', 'Nagpur', 'Maharashtra', 79.0882, 21.1458]
    );

    // 3. Insert Parcels
    for (const feature of PARCELS_GEOJSON.features) {
      const p = feature.properties;
      const coords = feature.geometry.coordinates[0];
      const polygonString = `POLYGON((` + coords.map((c: any[]) => `${c[0]} ${c[1]}`).join(', ') + `))`;
      
      await pool.query(
        `INSERT INTO parcels (id, parcel_number, locality_id, area_sqm, geom)
         VALUES ($1, $2, $3, $4, ST_Transform(ST_GeomFromText($5, 4326), 3857))`,
        [p.id, p.parcelNumber, 'LOC-NGP-01', p.area, polygonString]
      );
    }
    console.log(`Inserted ${PARCELS_GEOJSON.features.length} parcels.`);

    // 4. Insert Buildings
    for (const feature of BUILDINGS_GEOJSON.features) {
      const p = feature.properties;
      const coords = feature.geometry.coordinates[0];
      const polygonString = `POLYGON((` + coords.map((c: any[]) => `${c[0]} ${c[1]}`).join(', ') + `))`;
      
      await pool.query(
        `INSERT INTO buildings (id, parcel_id, building_name, height_m, floors_count, geom)
         VALUES ($1, $2, $3, $4, $5, ST_Transform(ST_GeomFromText($6, 4326), 3857))`,
        [p.id, p.parcelId, p.buildingName, p.height, p.floors, polygonString]
      );
    }
    console.log(`Inserted ${BUILDINGS_GEOJSON.features.length} buildings.`);

    // 5. Insert Underground
    for (const feature of UNDERGROUND_GEOJSON.features) {
       const p = feature.properties;
       const coords = feature.geometry.coordinates;
       const lineString = `LINESTRING(` + coords.map((c: any[]) => `${c[0]} ${c[1]}`).join(', ') + `)`;

       await pool.query(
        `INSERT INTO underground_assets (id, asset_type, depth_m, geom)
         VALUES ($1, $2, $3, ST_Transform(ST_GeomFromText($4, 4326), 3857))`,
        [p.id, p.assetType, p.depth, lineString]
       );
    }
    console.log(`Inserted ${UNDERGROUND_GEOJSON.features.length} underground assets.`);

    // 6. Insert Floors & Properties from Extended Mock Parcels
    for (const parcel of EXTENDED_MOCK_PARCELS) {
      for (const building of parcel.buildings) {
         if (building.floors) {
            for (const floor of building.floors) {
               const floorRes = await pool.query(
                 `INSERT INTO floors (building_id, floor_number, elevation_min_m, elevation_max_m)
                  VALUES ($1, $2, $3, $4) RETURNING id`,
                 [building.id, floor.floorNumber, floor.elevationMeters, floor.elevationMeters + floor.heightMeters]
               );
               const floorId = floorRes.rows[0].id;

               if (floor.properties) {
                  for (const prop of floor.properties) {
                     await pool.query(
                       `INSERT INTO properties (id, building_id, floor_id, unit_code, flat_number, area_sqm, prototype_property_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                       [prop.id, building.id, floorId, prop.unitCode, prop.flatNumber, prop.areaSqM, prop.prototype3DId]
                     );
                  }
               }
            }
         }
      }
    }
    console.log(`Inserted detailed floors and properties.`);

    console.log('PostGIS Seeding Complete!');
  } catch (err) {
    console.error('Seeding Error:', err);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === __filename) {
  seedDatabase();
}
