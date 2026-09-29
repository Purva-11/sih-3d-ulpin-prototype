import { Parcel, AIJobResult, DataSourceInfo } from '../types/cadastral';

// Helper to construct deterministic prototype IDs
export function generatePrototype3DId(
  stateCode: string,
  districtCode: string,
  parcelNo: string,
  buildingId: string,
  floorNo: number,
  flatNo: string
): string {
  const st = stateCode.toUpperCase().slice(0, 2);
  const dist = districtCode.toUpperCase().slice(0, 3);
  const cleanParcel = parcelNo.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const cleanBldg = buildingId.replace(/[^a-zA-Z0-9]/g, '').slice(-3).toUpperCase() || 'B01';
  const flTag = `F${String(floorNo).padStart(2, '0')}`;
  const unitTag = `U${flatNo.replace(/\D/g, '').padStart(3, '0') || '402'}`;
  return `B3D-${st}-${dist}-${cleanParcel}-${cleanBldg}-${flTag}-${unitTag}`;
}

export const MOCK_PARCELS: Parcel[] = [
  {
    id: 'PARCEL-402/A',
    surveyNumber: '402/A',
    stateCode: 'MH',
    districtCode: 'NGP',
    stateName: 'Maharashtra',
    districtName: 'Nagpur',
    legacyUlpin: '142857361049',
    areaSqM: 1250.5,
    areaAcres: 0.31,
    latitude: 21.1458,
    longitude: 79.0882,
    boundaryStatus: 'VALIDATED',
    dataSource: 'High-Res Drone Orthophoto + State Cadastral Map (SYNTHETIC / DEMO)',
    undergroundAssets: [
      {
        id: 'PIPE-W-102',
        name: 'Municipal Water Main',
        type: 'Water Pipeline',
        depthM: 3.5,
        elevationZ: -3.5,
        parentParcelId: 'PARCEL-402/A',
        status: 'ACTIVE',
        pathCoords: [[-2.5, -2], [2.5, -2]],
        diameterM: 0.6,
      },
      {
        id: 'SEW-401',
        name: 'District Sewer Line',
        type: 'Sewer Line',
        depthM: 5.0,
        elevationZ: -5.0,
        parentParcelId: 'PARCEL-402/A',
        status: 'ACTIVE',
        pathCoords: [[-2, 2.5], [2, 2.5]],
        diameterM: 0.8,
      },
      {
        id: 'FIBER-C-09',
        name: 'High-Speed Fiber Cable Trunk',
        type: 'Fiber Optic Cable',
        depthM: 1.8,
        elevationZ: -1.8,
        parentParcelId: 'PARCEL-402/A',
        status: 'ACTIVE',
        pathCoords: [[-3, 0], [3, 0]],
        diameterM: 0.2,
      },
      {
        id: 'BASEMENT-B1',
        name: 'Subterranean Parking Vault B1',
        type: 'Basement Parking',
        depthM: 4.5,
        elevationZ: -4.5,
        parentParcelId: 'PARCEL-402/A',
        status: 'ACTIVE',
        pathCoords: [[-1.8, -1.2], [1.8, -1.2], [1.8, 1.2], [-1.8, 1.2]],
        diameterM: 3.5,
      },
    ],
    buildings: [
      {
        id: 'BLD-NGP-402A-01',
        name: 'Godavari Heights — Block A',
        parentParcelId: 'PARCEL-402/A',
        totalFloors: 5,
        flatsPerFloor: 2,
        floorHeightM: 3.2,
        totalHeightM: 16.0,
        latitude: 21.1458,
        longitude: 79.0882,
        baseAltitudeM: 310.0,
        footprintPolygon: [
          [-2, -1.5],
          [2, -1.5],
          [2, 1.5],
          [-2, 1.5],
        ],
        floors: Array.from({ length: 5 }, (_, floorIdx) => {
          const fNum = floorIdx + 1;
          const bElev = parseFloat(((fNum - 1) * 3.2).toFixed(2));
          const tElev = parseFloat((fNum * 3.2).toFixed(2));

          const flatA_No = `${fNum}01`;
          const flatB_No = `${fNum}02`;

          return {
            floorNumber: fNum,
            elevationMeters: bElev,
            heightMeters: 3.2,
            properties: [
              {
                id: `PROP-NGP-402A-${flatA_No}`,
                flatNumber: `Flat ${flatA_No}`,
                unitCode: `U${flatA_No}`,
                floorNumber: fNum,
                areaSqFt: 880,
                areaSqM: 81.75,
                heightM: 3.2,
                bottomElevationM: bElev,
                topElevationM: tElev,
                volumeM3: 261.6,
                xRangeM: [-1.95, -0.05],
                yRangeM: [-1.45, 1.45],
                ownerName: floorIdx === 3 ? 'Rahul Sharma' : fNum % 2 === 0 ? 'Rajesh Kumar' : 'Priya Deshmukh',
                propertyType: 'Residential',
                taxStatus: 'PAID',
                encumbranceStatus: 'CLEAR',
                registrationDate: '2023-04-12',
                prototype3DId: generatePrototype3DId('MH', 'NGP', '402/A', 'B01', fNum, flatA_No),
              },
              {
                id: `PROP-NGP-402A-${flatB_No}`,
                flatNumber: `Flat ${flatB_No}`,
                unitCode: `U${flatB_No}`,
                floorNumber: fNum,
                areaSqFt: 870,
                areaSqM: 80.82,
                heightM: 3.2,
                bottomElevationM: bElev,
                topElevationM: tElev,
                volumeM3: 258.6,
                xRangeM: [0.05, 1.95],
                yRangeM: [-1.45, 1.45],
                ownerName: floorIdx === 3 ? 'Anjali Krishnamurthy' : fNum % 2 === 0 ? 'Vikram Rathore' : 'Sunita Patil',
                propertyType: 'Residential',
                taxStatus: fNum === 4 ? 'PENDING' : 'PAID',
                encumbranceStatus: 'CLEAR',
                registrationDate: '2023-08-20',
                prototype3DId: generatePrototype3DId('MH', 'NGP', '402/A', 'B01', fNum, flatB_No),
                isDemoWarning: fNum === 4, // Demo overlap warning on Flat 402
              },
            ],
          };
        }),
      },
    ],
  },
  {
    id: 'PARCEL-402/B',
    surveyNumber: '402/B',
    stateCode: 'MH',
    districtCode: 'NGP',
    stateName: 'Maharashtra',
    districtName: 'Nagpur',
    legacyUlpin: '142857361050',
    areaSqM: 980.0,
    areaAcres: 0.24,
    latitude: 21.1465,
    longitude: 79.0890,
    boundaryStatus: 'VALIDATED',
    dataSource: 'Cadastral Survey Map (LGD Code 27) (SYNTHETIC / DEMO)',
    undergroundAssets: [],
    buildings: [
      {
        id: 'BLD-NGP-402B-01',
        name: 'Kaveri Commercial Complex',
        parentParcelId: 'PARCEL-402/B',
        totalFloors: 3,
        flatsPerFloor: 2,
        floorHeightM: 3.5,
        totalHeightM: 10.5,
        latitude: 21.1465,
        longitude: 79.0890,
        baseAltitudeM: 310.0,
        footprintPolygon: [
          [-1.5, -1.2],
          [1.5, -1.2],
          [1.5, 1.2],
          [-1.5, 1.2],
        ],
        floors: Array.from({ length: 3 }, (_, floorIdx) => {
          const fNum = floorIdx + 1;
          const bElev = parseFloat(((fNum - 1) * 3.5).toFixed(2));
          const tElev = parseFloat((fNum * 3.5).toFixed(2));
          const flatA_No = `${fNum}01`;
          const flatB_No = `${fNum}02`;

          return {
            floorNumber: fNum,
            elevationMeters: bElev,
            heightMeters: 3.5,
            properties: [
              {
                id: `PROP-NGP-402B-${flatA_No}`,
                flatNumber: `Office ${flatA_No}`,
                unitCode: `U${flatA_No}`,
                floorNumber: fNum,
                areaSqFt: 650,
                areaSqM: 60.38,
                heightM: 3.5,
                bottomElevationM: bElev,
                topElevationM: tElev,
                volumeM3: 211.3,
                xRangeM: [-1.45, -0.05],
                yRangeM: [-1.15, 1.15],
                ownerName: 'Apex Tech Solutions Pvt Ltd',
                propertyType: 'Commercial',
                taxStatus: 'PAID',
                encumbranceStatus: 'CLEAR',
                registrationDate: '2022-11-15',
                prototype3DId: generatePrototype3DId('MH', 'NGP', '402/B', 'B02', fNum, flatA_No),
              },
              {
                id: `PROP-NGP-402B-${flatB_No}`,
                flatNumber: `Office ${flatB_No}`,
                unitCode: `U${flatB_No}`,
                floorNumber: fNum,
                areaSqFt: 640,
                areaSqM: 59.45,
                heightM: 3.5,
                bottomElevationM: bElev,
                topElevationM: tElev,
                volumeM3: 208.0,
                xRangeM: [0.05, 1.45],
                yRangeM: [-1.15, 1.15],
                ownerName: 'Vanguard Legal Services',
                propertyType: 'Commercial',
                taxStatus: 'PAID',
                encumbranceStatus: 'CLEAR',
                registrationDate: '2022-12-01',
                prototype3DId: generatePrototype3DId('MH', 'NGP', '402/B', 'B02', fNum, flatB_No),
              },
            ],
          };
        }),
      },
    ],
  },
];



export const MOCK_AI_JOBS: AIJobResult[] = [
  {
    id: 'AI-JOB-01',
    title: 'Automated Building Extraction',
    capability: 'Building Extraction',
    inputSource: 'Drone LiDAR + High-Res RGB Orthophoto (0.05m GSD)',
    outputArtifact: 'Building Footprint Polygon + 3D Height Envelope (16.0m)',
    status: 'COMPLETED — DEMO',
    confidenceMetric: 'DEMO SIMULATION — Model Not Connected',
    summary: 'Automated deep neural network segmenter extracted outer building footprint and estimated roof height.',
    jobType: 'Segmentation',
    createdAt: '2026-09-25T08:30:00Z',
    completedAt: '2026-09-25T08:35:12Z',
    modelName: 'Demo Building Extractor',
    modelVersion: 'v1.0-sim',
    modelSource: 'Local Demo',
    inferenceTimestamp: '2026-09-25T08:32:00Z',
    license: 'MIT',
    provenanceStatus: 'SIMULATED'
  },
  {
    id: 'AI-JOB-02',
    title: '3D Point Cloud Floor Segmentation',
    capability: 'Floor Segmentation',
    inputSource: 'Terrestrial LiDAR Point Cloud (8.4 Million Points)',
    outputArtifact: '5 Discrete Floor Slices (Z=0.0m, 3.2m, 6.4m, 9.6m, 12.8m)',
    status: 'COMPLETED — DEMO',
    confidenceMetric: 'DEMO SIMULATION — Model Not Connected',
    summary: 'RANSAC planar extraction algorithm isolated horizontal slab ceiling and floor boundaries.',
    jobType: 'Vertical Delineation',
    createdAt: '2026-09-25T09:15:00Z',
    completedAt: '2026-09-25T09:18:45Z',
    modelName: 'Demo RANSAC Extractor',
    modelVersion: 'v0.9-beta',
    modelSource: 'Local Demo',
    inferenceTimestamp: '2026-09-25T09:17:00Z',
    license: 'Apache 2.0',
    provenanceStatus: 'SIMULATED'
  },
  {
    id: 'AI-JOB-03',
    title: 'Parcel-Building Association',
    capability: 'Parcel Association',
    inputSource: 'PostGIS Staging DB',
    outputArtifact: 'Building footprints linked to Cadastral Parcels',
    status: 'COMPLETED — DEMO',
    confidenceMetric: 'Rule-Based Spatial Matching',
    summary: 'Spatial join detected intersection between building footprint and Parcel 402/A.',
    jobType: 'Spatial Join',
    createdAt: '2026-09-25T09:40:00Z',
    completedAt: '2026-09-25T09:40:05Z',
    modelName: 'PostGIS ST_Intersects',
    modelVersion: 'PostGIS 3.3',
    modelSource: 'System',
    inferenceTimestamp: '2026-09-25T09:40:02Z',
    license: 'GPL',
    provenanceStatus: 'DEMO'
  },
  {
    id: 'AI-JOB-04',
    title: 'Intelligent Topology Validation',
    capability: 'Topology Validation',
    inputSource: '3D Cadastral Volumetric Model',
    outputArtifact: 'Spatial Consistency Topology Report',
    status: 'COMPLETED — DEMO',
    confidenceMetric: 'DEMO SIMULATION — 1 Flagged Warning',
    summary: 'Automated 3D spatial topology checker detected 1 minor wall volume overlap on Floor 4.',
    jobType: 'Validation Rule Engine',
    createdAt: '2026-09-25T10:00:00Z',
    completedAt: '2026-09-25T10:01:10Z',
    modelName: 'SpatialTopologyChecker',
    modelVersion: 'v2.1',
    modelSource: 'Local Service',
    inferenceTimestamp: '2026-09-25T10:00:50Z',
    license: 'Proprietary',
    provenanceStatus: 'SIMULATED'
  },
];

export const MOCK_DATA_SOURCES: DataSourceInfo[] = [
  {
    id: 'DS-01',
    name: 'Drone Aerial Orthophoto & Survey',
    category: 'Drone Imagery',
    purpose: 'Centimeter-accurate surface mapping and building roof outlines.',
    dataType: 'GeoTIFF / RGB Orthomosaic (5cm resolution)',
    processingState: 'SYNTHETIC / DEMO',
    lastUpdated: '2026-09-20',
  },
  {
    id: 'DS-02',
    name: 'Mobile & Airborne LiDAR Point Cloud',
    category: 'LiDAR Point Cloud',
    purpose: '3D structural geometry, roof heights, and façade scan data.',
    dataType: 'LAS / LAZ 3D Point Cloud',
    processingState: 'SYNTHETIC / DEMO',
    lastUpdated: '2026-09-22',
  },
  {
    id: 'DS-03',
    name: 'State Cadastral Land Registry Layer',
    category: 'GIS Cadastral',
    purpose: '2D legal parcel boundaries, survey numbers, and land ownership records.',
    dataType: 'OGC GeoJSON / PostGIS Vector Layers',
    processingState: 'SYNTHETIC / DEMO',
    lastUpdated: '2026-09-18',
  },
  {
    id: 'DS-04',
    name: 'Architectural 2D CAD Floor Plans',
    category: '2D CAD Floorplan',
    purpose: 'Internal room layouts, flat boundaries, and floor height specifications.',
    dataType: 'DXF / DWG Vector Layouts',
    processingState: 'SYNTHETIC / DEMO',
    lastUpdated: '2026-09-15',
  },
  {
    id: 'DS-05',
    name: 'National CORS Network (RTK Positioning)',
    category: 'GNSS/CORS',
    purpose: 'High-precision geodetic referencing for ground control points.',
    dataType: 'NTRIP / RTCM 3.2 Real-time Correction',
    processingState: 'NOT CONNECTED — DEMO',
    lastUpdated: 'Conceptual / Demo',
  },
  {
    id: 'DS-06',
    name: 'Digital Elevation & Surface Models (DEM/DSM)',
    category: 'DEM/DSM',
    purpose: 'Bare-earth ground terrain (DEM) vs surface objects/structures (DSM).',
    dataType: 'Raster GeoTIFF Grid (1m resolution)',
    processingState: 'SYNTHETIC / DEMO',
    lastUpdated: '2026-09-21',
  },
  {
    id: 'DS-07',
    name: 'OpenStreetMap Base Vector Layers',
    category: 'OpenStreetMap',
    purpose: 'Contextual background road network and neighborhood building footprints.',
    dataType: 'Overpass API Vector XML/JSON',
    processingState: 'CONNECTED — OPEN DATA',
    lastUpdated: 'Live Query',
  },
];
