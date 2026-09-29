-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Clean existing tables if re-running
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS underground_assets CASCADE;
DROP TABLE IF EXISTS parcels CASCADE;
DROP TABLE IF EXISTS localities CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;

-- DATASETS (Phase 5: Data Provenance)
CREATE TABLE datasets (
    id VARCHAR(50) PRIMARY KEY,
    dataset_name VARCHAR(255) NOT NULL,
    source_name VARCHAR(255),
    source_type VARCHAR(50) DEFAULT 'IMPORTED', -- AUTHORITATIVE, IMPORTED, REFERENCE, SYNTHETIC
    jurisdiction VARCHAR(255),
    capture_date DATE,
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    coordinate_reference_system VARCHAR(50),
    geometry_type VARCHAR(50),
    license VARCHAR(255),
    status VARCHAR(50),
    description TEXT,
    is_authoritative BOOLEAN DEFAULT false,
    is_demo BOOLEAN DEFAULT false
);

-- LOCALITIES
CREATE TABLE localities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100),
    geom geometry(Polygon, 3857), -- Standard Web Mercator for mapping
    data_source VARCHAR(255) DEFAULT 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PARCELS
CREATE TABLE parcels (
    id VARCHAR(50) PRIMARY KEY,
    parcel_number VARCHAR(100) NOT NULL,
    locality_id VARCHAR(50) REFERENCES localities(id),
    area_sqm DECIMAL(10,2),
    geom geometry(Polygon, 3857),
    data_source VARCHAR(255) DEFAULT 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA',
    source_dataset_id VARCHAR(50) REFERENCES datasets(id),
    source_parcel_id VARCHAR(100),
    source_reference VARCHAR(255),
    is_authoritative BOOLEAN DEFAULT false,
    is_synthetic BOOLEAN DEFAULT true,
    verification_status VARCHAR(50) DEFAULT 'VALIDATED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BUILDINGS
CREATE TABLE buildings (
    id VARCHAR(50) PRIMARY KEY,
    parcel_id VARCHAR(50) REFERENCES parcels(id),
    building_name VARCHAR(255),
    height_m DECIMAL(8,2),
    floors_count INTEGER,
    geom geometry(Polygon, 3857),
    data_source VARCHAR(255) DEFAULT 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA',
    source_dataset_id VARCHAR(50) REFERENCES datasets(id),
    source_building_id VARCHAR(100),
    source_reference VARCHAR(255),
    is_authoritative BOOLEAN DEFAULT false,
    is_synthetic BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FLOORS
CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(50) REFERENCES buildings(id),
    floor_number INTEGER NOT NULL,
    elevation_min_m DECIMAL(8,2),
    elevation_max_m DECIMAL(8,2)
);

-- PROPERTIES
CREATE TABLE properties (
    id VARCHAR(50) PRIMARY KEY,
    building_id VARCHAR(50) REFERENCES buildings(id),
    floor_id INTEGER REFERENCES floors(id),
    unit_code VARCHAR(50),
    flat_number VARCHAR(100),
    area_sqm DECIMAL(10,2),
    prototype_property_id VARCHAR(100)
);

-- UNDERGROUND ASSETS
CREATE TABLE underground_assets (
    id VARCHAR(50) PRIMARY KEY,
    asset_type VARCHAR(100),
    parcel_id VARCHAR(50) REFERENCES parcels(id), -- optional link
    geom geometry(LineString, 3857),
    depth_m DECIMAL(8,2),
    data_source VARCHAR(255) DEFAULT 'DEMO / SYNTHETIC — NOT AUTHORITATIVE CADASTRAL DATA'
);

-- Indexes for Spatial Queries
CREATE INDEX idx_parcels_geom ON parcels USING GIST (geom);
CREATE INDEX idx_buildings_geom ON buildings USING GIST (geom);
CREATE INDEX idx_underground_geom ON underground_assets USING GIST (geom);

-- VALIDATION ISSUES
CREATE TABLE IF NOT EXISTS validation_issues (
    id VARCHAR(50) PRIMARY KEY,
    rule_id VARCHAR(100),
    category VARCHAR(100),
    severity VARCHAR(50),
    status VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    related_entity_ids JSONB,
    message TEXT,
    details JSONB,
    source VARCHAR(100),
    requires_review BOOLEAN DEFAULT false,
    review_status VARCHAR(50) DEFAULT 'OPEN',
    review_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
