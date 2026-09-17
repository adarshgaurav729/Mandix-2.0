/**
 * MandiX - Agricultural Drone Services Booking Hub
 * Facilitates booking with certified DGCA agricultural drone operators for precision spraying & mapping.
 */

export const DRONE_SERVICES = [
  {
    id: 'drone_spray_nano',
    name: 'Nano Urea & Nano DAP Precision Spraying (नैनो यूरिया छिड़काव)',
    category: 'Fertilizer Spraying',
    ratePerAcre: 350,
    timePerAcre: '7 - 10 Minutes',
    description: 'Ultra-low volume micron droplet spraying. Ensures 90%+ nutrient absorption on leaf surfaces without soil leaching.',
    recommendedCrops: ['Wheat (गेहूं)', 'Paddy (धान)', 'Maize (मक्का)', 'Cotton (कपास)'],
    badge: 'Most Popular (सर्वाधिक लोकप्रिय)',
    icon: 'fa-droplet'
  },
  {
    id: 'drone_spray_pest',
    name: 'Targeted Insecticide & Fungicide Application (कीटनाशक छिड़काव)',
    category: 'Pest Management',
    ratePerAcre: 380,
    timePerAcre: '8 - 12 Minutes',
    description: 'Safe automated canopy penetration preventing farmer exposure to toxic chemicals. Covers tall crops like sugarcane effortlessly.',
    recommendedCrops: ['Sugarcane (गन्ना)', 'Paddy (धान)', 'Vegetables (सब्जियां)'],
    badge: 'Farmer Safe (सुरक्षित)',
    icon: 'fa-shield-halved'
  },
  {
    id: 'drone_health_ndvi',
    name: 'NDVI Multispectral Crop Health Assessment (फसल स्वास्थ्य स्कैन)',
    category: 'Crop Monitoring',
    ratePerAcre: 250,
    timePerAcre: '5 Minutes / Acre',
    description: 'High-resolution multispectral imaging detecting nitrogen deficiency, water stress, and early pest infestations before visual symptoms appear.',
    recommendedCrops: ['All Commercial Crops & Orchards'],
    badge: 'Scientific AI (सटीक जांच)',
    icon: 'fa-chart-line'
  },
  {
    id: 'drone_mapping_boundary',
    name: 'Field Boundary Mapping & Elevation Survey (खेत पैमाइश व डिजिटल मैप)',
    category: 'Field Mapping',
    ratePerAcre: 200,
    timePerAcre: '6 Minutes / Acre',
    description: 'Centimeter-accuracy orthomosaic 2D/3D field mapping for land record verification, drainage slope planning, and precision leveling.',
    recommendedCrops: ['All Landholdings'],
    badge: 'Digital Farm (डिजिटल रिकॉर्ड)',
    icon: 'fa-map-location-dot'
  }
];

export const CERTIFIED_PILOTS = [
  {
    pilotId: 'DGCA-PILOT-881',
    name: 'Aakash Kumar',
    droneModel: 'IoTechWorld Agribot (10 Litre Payload)',
    licenseNo: 'DGCA-RPC-2024-9104',
    rating: 4.9,
    missionsCompleted: 142,
    hubLocation: 'Chakia Agri Aviation Hub'
  },
  {
    pilotId: 'DGCA-PILOT-419',
    name: 'Pooja Kumari',
    droneModel: 'Garuda Kisan Drone (16 Litre Dual Nozzle)',
    licenseNo: 'DGCA-RPC-2025-3312',
    rating: 4.8,
    missionsCompleted: 98,
    hubLocation: 'Motihari Krishi Drone Cluster'
  }
];
