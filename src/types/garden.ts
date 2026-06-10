export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type TrimmingState = 'optimal' | 'acceptable' | 'avoid' | 'bleeding_risk';

export interface TrimmingMatrixMonth {
  month: Month;
  state: TrimmingState;
  advice: string;
}

export interface TrimmingInstructions {
  targetShoots: string;
  cutDepth: string;
  tools: string[];
  frostWarning: boolean;
}

export interface Plant {
  id: string;
  commonName: string;
  latinName: string;
  description: string;
  trimmingMatrix: TrimmingMatrixMonth[]; // 12-month data structure
  defaultInstructions: TrimmingInstructions;
  imageUrl?: string;
}

export interface GardenPlant {
  id: string;
  userId: string;
  plantId: string;
  nickname?: string;
  photoUrl?: string;
  lastTrimmed?: string;
  microclimateFlags: string[]; // Keep for compatibility / custom tags
  position: { x: number; y: number };
  status: 'healthy' | 'needs_trimming' | 'critical';
  customInstructions?: string; // AI modified instructions
  type?: string; // Plant type for icon rendering (tree, shrub, flower, vegetable, etc.)
  locked?: boolean; // Per‑plant lock flag
  gardenId?: string; // Associated garden ID

  // Extended botanical and microclimate fields
  graftedType: 'single' | 'duo' | 'trio';
  graftedVarieties: string[];
  pruningForm: 'standard' | 'espalier' | 'dwarf' | 'columnar';
  sunlight: 'full_sun' | 'partial_shade' | 'full_shade';
  soilType: 'clay' | 'sand' | 'loam' | 'peat';
  windExposure: 'exposed' | 'sheltered';
  proximityToWalls: 'none' | 'south_wall' | 'other_wall';
}

export interface UserGarden {
  id: string; // Unique garden ID
  userId: string;
  address: string;
  parcelPolygon?: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
  scaledPolygon?: [number, number][]; // Scaled 2D coordinates for the interactive editor
  guessedSoil?: 'clay' | 'sand' | 'loam' | 'peat';
  guessedSunlight?: 'full_sun' | 'partial_shade' | 'full_shade';
  center: {
    lat: number;
    lng: number;
  };
  lastSync: string; // ISO date
  buildings?: any[]; // Cached building polygons from PDOK
  lawns?: UserLawn[]; // Lawn polygons
}

export interface UserLawn {
  id: string;
  points: [number, number][]; // 4 points in SVG coordinate space
  type?: 'lawn' | 'terrace';
}

export interface UserSession {
  email: string;
  name: string;
  avatarUrl?: string;
  ftueCompleted: boolean;
}

export interface TrimmingLog {
  id: string;
  gardenPlantId: string;
  date: string;
  notes: string;
  photos: string[];
}
