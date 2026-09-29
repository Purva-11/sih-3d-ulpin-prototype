CREATE TABLE IF NOT EXISTS datasets (
    id VARCHAR(50) PRIMARY KEY,
    dataset_name VARCHAR(255) NOT NULL,
    source_name VARCHAR(255),
    source_type VARCHAR(50), -- AUTHORITATIVE, IMPORTED, REFERENCE, SYNTHETIC
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

ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS source_dataset_id VARCHAR(50) REFERENCES datasets(id),
ADD COLUMN IF NOT EXISTS source_parcel_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_authoritative BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT true;

ALTER TABLE buildings
ADD COLUMN IF NOT EXISTS source_dataset_id VARCHAR(50) REFERENCES datasets(id),
ADD COLUMN IF NOT EXISTS source_building_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_authoritative BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT true;
