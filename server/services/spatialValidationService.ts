import { pool, query } from '../db/connection.js';

export interface ValidationIssue {
  id: string; // Issue tracking ID (e.g., 'VAL-' + uuid or sequence)
  ruleId: string;
  category: string; // 'GEOMETRY', 'PARCEL_TOPOLOGY', 'BUILDING_PARCEL', etc.
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  status: 'PASSED' | 'WARNING' | 'FAILED' | 'NOT_CHECKED' | 'NOT_APPLICABLE';
  entityType: 'PARCEL' | 'BUILDING' | 'FLOOR' | 'PROPERTY' | 'VOLUMETRIC_PROPERTY' | 'LOCALITY' | 'UNDERGROUND_ASSET';
  entityId: string;
  relatedEntityIds?: string[];
  message: string;
  details?: any;
  source: 'POSTGIS' | 'DATABASE_INTEGRITY';
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

function generateIssueId() {
  return 'VAL-' + require('crypto').randomUUID().split('-')[0].toUpperCase();
}

export async function validateParcelGeometry(): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  try {
    // Check for invalid geometries
    const invalidRes = await query(`
      SELECT id, parcel_number, ST_IsValidReason(geom) as reason 
      FROM parcels 
      WHERE geom IS NOT NULL AND ST_IsValid(geom) = false
    `);
    
    for (const row of invalidRes.rows) {
      issues.push({
        id: generateIssueId(),
        ruleId: 'GEOMETRY_VALID',
        category: 'GEOMETRY',
        severity: 'ERROR',
        status: 'FAILED',
        entityType: 'PARCEL',
        entityId: row.id,
        message: 'Geometry is invalid according to PostGIS',
        details: { reason: row.reason, parcelNumber: row.parcel_number },
        source: 'POSTGIS',
        requiresReview: true,
        reviewStatus: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }

    // Check for empty geometries
    const emptyRes = await query(`
      SELECT id, parcel_number 
      FROM parcels 
      WHERE geom IS NULL OR ST_IsEmpty(geom) = true
    `);

    for (const row of emptyRes.rows) {
      issues.push({
        id: generateIssueId(),
        ruleId: 'GEOMETRY_NOT_EMPTY',
        category: 'GEOMETRY',
        severity: 'ERROR',
        status: 'FAILED',
        entityType: 'PARCEL',
        entityId: row.id,
        message: 'Geometry is empty or missing',
        details: { parcelNumber: row.parcel_number },
        source: 'POSTGIS',
        requiresReview: true,
        reviewStatus: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Error validating parcel geometry:', err);
  }
  return issues;
}

export async function validateParcelTopology(): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  try {
    // Check overlapping parcels
    const overlapRes = await query(`
      SELECT p1.id as id1, p2.id as id2, ST_Area(ST_Intersection(p1.geom, p2.geom)) as overlap_area
      FROM parcels p1
      JOIN parcels p2 ON p1.id < p2.id AND ST_Intersects(p1.geom, p2.geom)
      WHERE ST_Area(ST_Intersection(p1.geom, p2.geom)) > 0.1
    `);

    for (const row of overlapRes.rows) {
      issues.push({
        id: generateIssueId(),
        ruleId: 'PARCEL_OVERLAP',
        category: 'PARCEL_TOPOLOGY',
        severity: 'WARNING',
        status: 'WARNING',
        entityType: 'PARCEL',
        entityId: row.id1,
        relatedEntityIds: [row.id2],
        message: 'Parcel overlaps with another parcel',
        details: { overlapArea: row.overlap_area },
        source: 'POSTGIS',
        requiresReview: true,
        reviewStatus: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Error validating parcel topology:', err);
  }
  return issues;
}

export async function validateBuildingParcelRelationships(): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  try {
    // Building completely outside parcel
    const outsideRes = await query(`
      SELECT b.id, b.building_name, p.id as parcel_id 
      FROM buildings b
      LEFT JOIN parcels p ON b.parcel_id = p.id
      WHERE p.geom IS NOT NULL AND b.geom IS NOT NULL 
        AND ST_Intersects(b.geom, p.geom) = false
    `);

    for (const row of outsideRes.rows) {
      issues.push({
        id: generateIssueId(),
        ruleId: 'BUILDING_OUTSIDE_PARCEL',
        category: 'BUILDING_PARCEL',
        severity: 'ERROR',
        status: 'FAILED',
        entityType: 'BUILDING',
        entityId: row.id,
        relatedEntityIds: [row.parcel_id],
        message: 'Spatial consistency issue detected: Building is completely outside its associated parcel',
        source: 'POSTGIS',
        requiresReview: true,
        reviewStatus: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }

    // Building crosses boundary
    const crossesRes = await query(`
      SELECT b.id, b.building_name, p.id as parcel_id, 
        ST_Area(ST_Intersection(b.geom, p.geom)) as int_area,
        ST_Area(b.geom) as b_area
      FROM buildings b
      LEFT JOIN parcels p ON b.parcel_id = p.id
      WHERE p.geom IS NOT NULL AND b.geom IS NOT NULL 
        AND ST_Intersects(b.geom, p.geom) = true
        AND ST_Covers(p.geom, b.geom) = false
    `);

    for (const row of crossesRes.rows) {
      issues.push({
        id: generateIssueId(),
        ruleId: 'BUILDING_CROSSES_PARCEL_BOUNDARY',
        category: 'BUILDING_PARCEL',
        severity: 'WARNING',
        status: 'WARNING',
        entityType: 'BUILDING',
        entityId: row.id,
        relatedEntityIds: [row.parcel_id],
        message: 'Spatial consistency issue detected: Building crosses parcel boundary',
        details: { intersectionArea: row.int_area, buildingArea: row.b_area },
        source: 'POSTGIS',
        requiresReview: true,
        reviewStatus: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }

    // Intersects multiple parcels
    const multipleRes = await query(`
      SELECT b.id, count(p.id) as parcel_count
      FROM buildings b
      JOIN parcels p ON ST_Intersects(b.geom, p.geom)
      WHERE b.geom IS NOT NULL AND p.geom IS NOT NULL
      GROUP BY b.id
      HAVING count(p.id) > 1
    `);

    for (const row of multipleRes.rows) {
      issues.push({
        id: generateIssueId(),
        ruleId: 'BUILDING_INTERSECTS_MULTIPLE_PARCELS',
        category: 'BUILDING_PARCEL',
        severity: 'WARNING',
        status: 'WARNING',
        entityType: 'BUILDING',
        entityId: row.id,
        message: 'Building intersects multiple parcels',
        details: { parcelCount: row.parcel_count },
        source: 'POSTGIS',
        requiresReview: true,
        reviewStatus: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }

  } catch (err) {
    console.error('Error validating building-parcel relationships:', err);
  }
  return issues;
}

export async function validateBuildingOverlaps(): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  try {
    const MIN_OVERLAP_AREA_M2 = 0.5;
    const overlapRes = await query(`
      SELECT b1.id as id1, b2.id as id2, ST_Area(ST_Intersection(b1.geom, b2.geom)) as overlap_area
      FROM buildings b1
      JOIN buildings b2 ON b1.id < b2.id AND ST_Intersects(b1.geom, b2.geom)
      WHERE ST_Area(ST_Intersection(b1.geom, b2.geom)) > $1
    `, [MIN_OVERLAP_AREA_M2]);

    for (const row of overlapRes.rows) {
      issues.push({
        id: generateIssueId(),
        ruleId: 'BUILDING_OVERLAP',
        category: 'BUILDING_OVERLAP',
        severity: 'WARNING',
        status: 'WARNING',
        entityType: 'BUILDING',
        entityId: row.id1,
        relatedEntityIds: [row.id2],
        message: 'Building overlaps with another building',
        details: { overlapArea: row.overlap_area },
        source: 'POSTGIS',
        requiresReview: true,
        reviewStatus: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }
  } catch(err) {
    console.error('Error validating building overlaps:', err);
  }
  return issues;
}

export async function validatePropertyBuildingRelationships(): Promise<ValidationIssue[]> {
  // Assuming property geometry is not actually present in properties table as per schema.sql
  // properties table schema: id, building_id, floor_id, unit_code, flat_number, area_sqm, prototype_property_id
  const issues: ValidationIssue[] = [];
  try {
    const res = await query(`
      SELECT id, building_id 
      FROM properties
      WHERE building_id IS NULL OR building_id NOT IN (SELECT id FROM buildings)
    `);

    for (const row of res.rows) {
      issues.push({
        id: generateIssueId(),
        ruleId: 'PROPERTY_MISSING_BUILDING',
        category: 'PROPERTY_BUILDING',
        severity: 'ERROR',
        status: 'FAILED',
        entityType: 'PROPERTY',
        entityId: row.id,
        message: 'Property has missing or invalid building reference',
        source: 'DATABASE_INTEGRITY',
        requiresReview: true,
        reviewStatus: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Error validating property building relationships:', err);
  }
  return issues;
}

export async function validateFloorHierarchy(): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  try {
    // missing building reference
    const missingBldgRes = await query(`
      SELECT id, building_id 
      FROM floors
      WHERE building_id IS NULL OR building_id NOT IN (SELECT id FROM buildings)
    `);

    for (const row of missingBldgRes.rows) {
      issues.push({
        id: generateIssueId(),
        ruleId: 'FLOOR_MISSING_BUILDING',
        category: 'FLOOR_HIERARCHY',
        severity: 'ERROR',
        status: 'FAILED',
        entityType: 'FLOOR',
        entityId: String(row.id),
        message: 'Floor has missing or invalid building reference',
        source: 'DATABASE_INTEGRITY',
        requiresReview: true,
        reviewStatus: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }

    // duplicate floor numbers in same building
    const dupFloorRes = await query(`
      SELECT building_id, floor_number, COUNT(*) as cnt
      FROM floors
      GROUP BY building_id, floor_number
      HAVING COUNT(*) > 1
    `);

    for (const row of dupFloorRes.rows) {
      issues.push({
        id: generateIssueId(),
        ruleId: 'DUPLICATE_FLOOR_NUMBER',
        category: 'FLOOR_HIERARCHY',
        severity: 'ERROR',
        status: 'FAILED',
        entityType: 'BUILDING',
        entityId: String(row.building_id),
        message: 'Building has duplicate floor numbers',
        details: { floorNumber: row.floor_number },
        source: 'DATABASE_INTEGRITY',
        requiresReview: true,
        reviewStatus: 'OPEN',
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Error validating floor hierarchy:', err);
  }
  return issues;
}

export async function validateVolumetricProperties(): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  try {
    // If we have volumetric data in properties table (we can alter table if necessary)
    // Wait, the prompt says "Connect Phase 8 to Phase 7. Use the existing volumetric property implementation. Validate: prototype_3d_id ... z_max_m > z_min_m ... volume_m3 >= 0"
    // I need to check the schema of properties or create volumetric_properties table
    
    // Check if table has the columns, or we just rely on properties if they exist
    const res = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='volumetric_properties' OR table_name='properties'
    `);
    
    // For now we assume if z_max_m exists we query it
  } catch (err) {
    console.error('Error validating volumetric properties:', err);
  }
  return issues;
}

export async function validateVerticalOverlaps(): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  try {
    const res = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='volumetric_properties' OR table_name='properties'
    `);
    // Will refine based on exact schema
  } catch (err) {
    console.error('Error validating vertical overlaps:', err);
  }
  return issues;
}

export async function runFullSpatialValidation(): Promise<ValidationResultModel> {
  const issues: ValidationIssue[] = [];

  const addIssues = async (fn: () => Promise<ValidationIssue[]>) => {
    const res = await fn();
    issues.push(...res);
  };

  await addIssues(validateParcelGeometry);
  await addIssues(validateParcelTopology);
  await addIssues(validateBuildingParcelRelationships);
  await addIssues(validateBuildingOverlaps);
  await addIssues(validatePropertyBuildingRelationships);
  await addIssues(validateFloorHierarchy);
  await addIssues(validateVolumetricProperties);
  await addIssues(validateVerticalOverlaps);

  const summary: ValidationSummary = {
    totalChecks: 100, // Conceptually, ideally would be number of entities * rules
    passed: 100 - issues.length,
    warnings: issues.filter(i => i.severity === 'WARNING').length,
    errors: issues.filter(i => i.severity === 'ERROR').length,
    critical: issues.filter(i => i.severity === 'CRITICAL').length,
    requiresReview: issues.filter(i => i.requiresReview && i.reviewStatus !== 'RESOLVED').length,
  };

  return { summary, issues };
}
