import { Client } from 'pg';
const client = new Client('postgres://postgres:postgres@localhost:5432/ulpin_postgis');
client.connect().then(async () => {
  const indexes = await client.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('parcels', 'buildings', 'underground_assets');`);
  console.log('INDEXES:', indexes.rows);
  const tables = ['parcels', 'buildings', 'floors', 'properties', 'validation_issues'];
  for (const t of tables) {
    const count = await client.query(`SELECT count(*) FROM ${t}`);
    console.log(`COUNT ${t}:`, count.rows[0].count);
  }
  
  const pGeom = await client.query(`SELECT ST_GeometryType(geom) as type, ST_SRID(geom) as srid, count(*) as count FROM parcels GROUP BY type, srid`);
  console.log('PARCEL GEOM:', pGeom.rows);
  const bGeom = await client.query(`SELECT ST_GeometryType(geom) as type, ST_SRID(geom) as srid, count(*) as count FROM buildings GROUP BY type, srid`);
  console.log('BUILDING GEOM:', bGeom.rows);

  const pInvalid = await client.query(`SELECT count(*) FROM parcels WHERE NOT ST_IsValid(geom)`);
  console.log('PARCEL INVALID:', pInvalid.rows[0].count);
  const bInvalid = await client.query(`SELECT count(*) FROM buildings WHERE NOT ST_IsValid(geom)`);
  console.log('BUILDING INVALID:', bInvalid.rows[0].count);

  await client.end();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
