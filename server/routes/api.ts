import express from 'express';
import { pool } from '../db/connection.js';

import { 
  runFullSpatialValidation, 
  validateParcelGeometry, 
  validateParcelTopology,
  validateBuildingParcelRelationships,
  validateBuildingOverlaps,
  validatePropertyBuildingRelationships,
  validateFloorHierarchy,
  validateVolumetricProperties,
  validateVerticalOverlaps
} from '../services/spatialValidationService.js';

export const apiRouter = express.Router();

apiRouter.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: String(err) });
  }
});

apiRouter.get('/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM parcels) as parcels_count,
        (SELECT COUNT(*) FROM buildings) as buildings_count,
        (SELECT COUNT(*) FROM floors) as floors_count,
        (SELECT COUNT(*) FROM properties) as properties_count,
        (SELECT COUNT(*) FROM underground_assets) as underground_count
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.get('/buildings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM buildings');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.get('/locality-3d', async (req, res) => {
  try {
    const { rows: parcels } = await pool.query(`
      SELECT id, parcel_number, area_sqm, ST_AsGeoJSON(geom) as geom
      FROM parcels
    `);
    
    const { rows: buildings } = await pool.query(`
      SELECT id, parcel_id, building_name, height_m, floors_count, ST_AsGeoJSON(geom) as geom
      FROM buildings
    `);

    const { rows: underground } = await pool.query(`
      SELECT id, asset_type, depth_m, ST_AsGeoJSON(geom) as geom
      FROM underground_assets
    `);

    // Parse the GeoJSON strings
    const parsedParcels = parcels.map(p => ({
      ...p,
      geom: p.geom ? JSON.parse(p.geom) : null
    }));

    const parsedBuildings = buildings.map(b => ({
      ...b,
      geom: b.geom ? JSON.parse(b.geom) : null
    }));

    const parsedUnderground = underground.map(u => ({
      ...u,
      geom: u.geom ? JSON.parse(u.geom) : null
    }));

    res.json({ parcels: parsedParcels, buildings: parsedBuildings, underground_assets: parsedUnderground });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.get('/buildings/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { rows: buildingRows } = await pool.query('SELECT * FROM buildings WHERE id = $1', [id]);
    if (buildingRows.length === 0) return res.status(404).json({ error: 'Building not found' });
    
    const building = buildingRows[0];
    const { rows: parcelRows } = await pool.query('SELECT * FROM parcels WHERE id = $1', [building.parcel_id]);
    const { rows: floorRows } = await pool.query('SELECT * FROM floors WHERE building_id = $1', [id]);
    
    res.json({ ...building, parcel: parcelRows[0] || null, floors: floorRows });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.get('/building-floors', async (req, res) => {
  try {
    // Existing frontend format emulation
    const { rows: buildings } = await pool.query('SELECT * FROM buildings');
    if (buildings.length === 0) return res.json({ floors: [] });

    const building = buildings[0]; // Demol
    const { rows: floors } = await pool.query('SELECT * FROM floors WHERE building_id = $1', [building.id]);
    
    const formattedFloors = [];
    for (const floor of floors) {
      const { rows: properties } = await pool.query('SELECT * FROM properties WHERE floor_id = $1', [floor.id]);
      formattedFloors.push({
        id: `f${floor.floor_number}`,
        floor_number: floor.floor_number,
        elevation: floor.elevation_min_m,
        height: floor.elevation_max_m - floor.elevation_min_m,
        flats: properties.map(p => ({
          id: p.id.toString(),
          flat_number: p.flat_number ? parseInt(p.flat_number) : 0,
          area_sqft: p.area_sqm,
          owner: p.owner_name || 'Unknown',
          tax_status: p.tax_status || 'Paid',
          encumbrance: p.encumbrance_status || 'Clear'
        }))
      });
    }
    
    res.json({
      building_name: building.building_name,
      floors: formattedFloors
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.post('/properties', async (req, res) => {
  try {
    const { floor_id, flat_number, area_sqm, prototype_3d_property_id } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO properties (id, floor_id, flat_number, area_sqm, prototype_property_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [`prop-${Date.now()}`, floor_id, flat_number, area_sqm, prototype_3d_property_id]);
    res.json({ success: true, id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.get('/properties/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Property not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.post('/volumetric-properties/generate', async (req, res) => {
  try {
    const { localityCode, parcelId, buildingId, floorId, propertyId, floorNumber, zMinM, zMaxM, footprintAreaM2 } = req.body;
    
    // Validation
    if (!propertyId || !floorId || !buildingId || !parcelId) {
      return res.status(400).json({ error: 'Missing required identifiers' });
    }
    if (zMaxM <= zMinM) {
      return res.status(400).json({ error: 'zMaxM must be greater than zMinM' });
    }
    if (footprintAreaM2 < 0) {
      return res.status(400).json({ error: 'Footprint area cannot be negative' });
    }
    if (floorNumber < 0) {
      return res.status(400).json({ error: 'Invalid floor number' });
    }

    const verticalHeightM = zMaxM - zMinM;
    const volumeM3 = footprintAreaM2 * verticalHeightM;

    // Deterministic Prototype ID Generation
    // e.g. B3D-NGP-P402A-B01-F04-U02
    const st = localityCode ? String(localityCode).toUpperCase() : 'MH-NGP';
    const p = String(parcelId).toUpperCase();
    const b = String(buildingId).toUpperCase();
    const f = String(floorNumber).padStart(2, '0');
    const u = String(propertyId).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-3).padStart(2, '0');
    
    const prototype_id = `B3D-${st}-${p}-${b}-F${f}-U${u}`;
    
    // In a real system, we'd check if this exists in the volumetric_properties table
    // For prototype, we will check properties table or mock it
    const { rows } = await pool.query('SELECT * FROM properties WHERE prototype_property_id = $1', [prototype_id]);
    
    let isExisting = false;
    if (rows.length > 0) {
       isExisting = true;
    } else {
       // Insert mock or real record if we had the table
       // Using properties table for now to preserve compatibility if needed, but conceptually we'd insert into volumetric_properties
    }

    res.json({
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
      message: isExisting ? 'Existing Prototype 3D Property ID Retrieved' : 'Prototype 3D Property ID Generated'
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.get('/volumetric-properties/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM properties WHERE prototype_property_id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Property not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.get('/volumetric-properties/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    const { rows } = await pool.query('SELECT * FROM properties WHERE prototype_property_id LIKE $1', [`%${q}%`]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.post('/validation/check', (req, res) => {
  try {
    const { property_id, floor_number, z_min, z_max, volume } = req.body;
    let isValid = true;
    const errors: string[] = [];

    if (z_min >= z_max) { isValid = false; errors.push('z_min must be less than z_max'); }
    if (volume < 0) { isValid = false; errors.push('volume cannot be negative'); }
    if (floor_number < 0 || floor_number > 200) { isValid = false; errors.push('invalid floor numbering'); }
    
    res.json({ success: true, is_valid: isValid, errors });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.get('/osm/buildings', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string || '21.1458');
    const lon = parseFloat(req.query.lon as string || '79.0882');
    const delta = 0.0015;
    
    const latMin = lat - delta;
    const latMax = lat + delta;
    const lngMin = lon - delta;
    const lngMax = lon + delta;
    
    const overpassQuery = `[out:json];(way["building"](${latMin},${lngMin},${latMax},${lngMax}););out geom;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    
    const response = await fetch(overpassUrl);
    if (!response.ok) throw new Error('OSM fetch failed');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
// Phase 8 Validation Endpoints

apiRouter.get('/validation/summary', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM validation_issues');
    const summary = {
      totalChecks: 100, // Conceptually
      passed: 100 - rows.length,
      warnings: rows.filter(r => r.severity === 'WARNING').length,
      errors: rows.filter(r => r.severity === 'ERROR').length,
      critical: rows.filter(r => r.severity === 'CRITICAL').length,
      requiresReview: rows.filter(r => r.requires_review && r.review_status !== 'RESOLVED').length
    };
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.get('/validation/issues', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM validation_issues ORDER BY created_at DESC');
    // Map to camelCase if necessary, or let frontend handle it. Let's send camelCase.
    const issues = rows.map(r => ({
      id: r.id,
      ruleId: r.rule_id,
      category: r.category,
      severity: r.severity,
      status: r.status,
      entityType: r.entity_type,
      entityId: r.entity_id,
      relatedEntityIds: r.related_entity_ids,
      message: r.message,
      details: r.details,
      source: r.source,
      requiresReview: r.requires_review,
      reviewStatus: r.review_status,
      reviewNote: r.review_note,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.post('/validation/run', async (req, res) => {
  try {
    // Run validation service
    const result = await runFullSpatialValidation();
    
    // Clear existing issues (for full run, or just update. For this prototype, clearing is simpler)
    await pool.query('DELETE FROM validation_issues');

    // Insert new issues
    if (result.issues.length > 0) {
      const values = result.issues.map(i => 
        `('${i.id}', '${i.ruleId}', '${i.category}', '${i.severity}', '${i.status}', '${i.entityType}', '${i.entityId}', '${JSON.stringify(i.relatedEntityIds || [])}', '${i.message.replace(/'/g, "''")}', '${JSON.stringify(i.details || {}).replace(/'/g, "''")}', '${i.source}', ${i.requiresReview}, '${i.reviewStatus}', '${i.createdAt}')`
      ).join(', ');

      await pool.query(`
        INSERT INTO validation_issues (id, rule_id, category, severity, status, entity_type, entity_id, related_entity_ids, message, details, source, requires_review, review_status, created_at)
        VALUES ${values}
      `);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

apiRouter.patch('/validation/issues/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewStatus, reviewNote } = req.body;
    
    await pool.query(`
      UPDATE validation_issues 
      SET review_status = $1, review_note = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [reviewStatus, reviewNote, id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
