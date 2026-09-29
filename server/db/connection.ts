import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ulpin_postgis',
});

// Helper for single queries
export const query = (text: string, params?: any[]) => pool.query(text, params);
