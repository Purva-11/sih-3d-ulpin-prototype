import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '..', '..', 'prototype.db');

export const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      dataset_name TEXT NOT NULL,
      source_name TEXT,
      source_type TEXT DEFAULT 'IMPORTED',
      jurisdiction TEXT,
      capture_date TEXT,
      import_date TEXT DEFAULT CURRENT_TIMESTAMP,
      coordinate_reference_system TEXT,
      geometry_type TEXT,
      license TEXT,
      status TEXT,
      description TEXT,
      is_authoritative INTEGER DEFAULT 0,
      is_demo INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_number TEXT NOT NULL,
      area REAL,
      latitude REAL,
      longitude REAL,
      state TEXT,
      district TEXT,
      existing_2d_identifier TEXT,
      geometry TEXT,
      source_dataset_id TEXT,
      source_parcel_id TEXT,
      source_reference TEXT,
      is_authoritative INTEGER DEFAULT 0,
      is_synthetic INTEGER DEFAULT 1,
      FOREIGN KEY (source_dataset_id) REFERENCES datasets(id)
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_id INTEGER,
      building_name TEXT,
      floors INTEGER,
      units INTEGER,
      height REAL,
      latitude REAL,
      longitude REAL,
      source_dataset_id TEXT,
      source_building_id TEXT,
      source_reference TEXT,
      is_authoritative INTEGER DEFAULT 0,
      is_synthetic INTEGER DEFAULT 1,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id),
      FOREIGN KEY (source_dataset_id) REFERENCES datasets(id)
    );

    CREATE TABLE IF NOT EXISTS floors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER,
      floor_number INTEGER,
      elevation REAL,
      height REAL,
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      floor_id INTEGER,
      flat_number TEXT,
      area REAL,
      owner_name TEXT,
      tax_status TEXT,
      encumbrance_status TEXT,
      prototype_3d_property_id TEXT UNIQUE,
      z_min REAL,
      z_max REAL,
      volume REAL,
      FOREIGN KEY (floor_id) REFERENCES floors(id)
    );

    CREATE TABLE IF NOT EXISTS underground_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_id INTEGER,
      asset_type TEXT,
      depth REAL,
      description TEXT,
      geometry TEXT,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id)
    );

    CREATE TABLE IF NOT EXISTS validation_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER,
      is_valid INTEGER,
      details TEXT,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );
  `);
}
