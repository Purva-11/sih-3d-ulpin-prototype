import { db } from './database.js';

export function seedDb() {
  const parcelCount = db.prepare('SELECT COUNT(*) as count FROM parcels').get() as { count: number };
  if (parcelCount.count > 0) return; // Already seeded

  console.log('Seeding demo database...');

  const insertParcel = db.prepare(`
    INSERT INTO parcels (parcel_number, area, latitude, longitude, state, district, existing_2d_identifier, geometry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const parcelResult = insertParcel.run('402/A', 1500, 21.1458, 79.0882, 'MH', 'NGP', 'MH-NGP-402A', '{}');
  const parcelId = parcelResult.lastInsertRowid;

  const insertBuilding = db.prepare(`
    INSERT INTO buildings (parcel_id, building_name, floors, units, height, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const buildingResult = insertBuilding.run(parcelId, 'Godavari Heights', 5, 10, 16, 21.1458, 79.0882);
  const buildingId = buildingResult.lastInsertRowid;

  const insertFloor = db.prepare(`
    INSERT INTO floors (building_id, floor_number, elevation, height)
    VALUES (?, ?, ?, ?)
  `);

  const insertProperty = db.prepare(`
    INSERT INTO properties (floor_id, flat_number, area, owner_name, tax_status, encumbrance_status, prototype_3d_property_id, z_min, z_max, volume)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const owners = [
    'Ramesh Patel', 'Sunita Sharma', 'Amit Kumar', 'Priya Singh', 
    'Vikram Malhotra', 'Neha Gupta', 'Rajesh Iyer', 'Anjali Desai', 
    'Suresh Nair', 'Kavita Reddy'
  ];

  let ownerIndex = 0;
  for (let f = 1; f <= 5; f++) {
    const floorResult = insertFloor.run(buildingId, f, (f - 1) * 3.2, 3.2);
    const floorId = floorResult.lastInsertRowid;

    for (let flat = 1; flat <= 2; flat++) {
      const flatNumber = `${f}0${flat}`;
      const owner = owners[ownerIndex++];
      const ulpin = `MH-NGP-402A-F0${f}-U${flatNumber}`;
      const z_min = (f - 1) * 3.2;
      const z_max = f * 3.2;
      const volume = 850 * 3.2; // demo calculation

      insertProperty.run(floorId, flatNumber, 850, owner, 'PAID', 'CLEAR', ulpin, z_min, z_max, volume);
    }
  }

  console.log('Seed completed successfully.');
}
