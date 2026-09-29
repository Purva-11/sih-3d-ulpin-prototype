import { Client } from 'pg';
const client = new Client('postgres://postgres:postgres@localhost:5432/ulpin_postgis');
client.connect().then(() => {
  return client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`);
}).then(res => {
  console.log(JSON.stringify(res.rows.map(r => r.table_name)));
  return client.end();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
