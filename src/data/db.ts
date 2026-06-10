import type { GardenPlant, Plant, TrimmingLog, UserGarden, UserSession } from '../types/garden';
import { MOCK_PLANTS } from './mockPlants';

const STORAGE_KEY = 'snippy_data';

interface AppData {
  gardenPlants: GardenPlant[];
  customPlants: Plant[];
  garden: UserGarden | null; // Legacy single garden
  logs: TrimmingLog[];
  session: UserSession | null;
  gardens: UserGarden[];
  activeGardenId: string | null;
}

const INITIAL_DATA: AppData = {
  gardenPlants: [],
  customPlants: [],
  garden: null,
  logs: [],
  session: null,
  gardens: [],
  activeGardenId: null
};

export const db = {
  get(): AppData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      this.save(INITIAL_DATA);
      return INITIAL_DATA;
    }
    const data = JSON.parse(stored);
    
    // Migration: filter out old mock data
    if (data.gardenPlants && data.gardenPlants.some((p: any) => p.id === 'gp-1' || p.id === 'gp-2')) {
      data.gardenPlants = data.gardenPlants.filter((p: any) => p.id !== 'gp-1' && p.id !== 'gp-2');
      this.save(data);
    }

    // Migration: ensure customPlants exists for older saves
    if (!data.customPlants) {
      data.customPlants = [];
      this.save(data);
    }

    // Migration: ensure new fields exist
    let needsSave = false;
    if (data.session === undefined) {
      data.session = null;
      needsSave = true;
    }
    if (data.gardens === undefined) {
      data.gardens = [];
      needsSave = true;
    }
    if (data.activeGardenId === undefined) {
      data.activeGardenId = null;
      needsSave = true;
    }

    // Migration: migrate old single garden to gardens list
    if (data.garden && data.gardens.length === 0) {
      const legacyGarden: UserGarden = {
        ...data.garden,
        id: data.garden.id || 'default-garden'
      };
      data.gardens = [legacyGarden];
      data.activeGardenId = legacyGarden.id;
      // Associate legacy plants with this garden
      data.gardenPlants = (data.gardenPlants || []).map((p: any) => ({
        ...p,
        gardenId: p.gardenId || legacyGarden.id
      }));
      // Delete legacy single garden property so migration doesn't run again
      data.garden = null;
      needsSave = true;
    }

    // If no activeGardenId is set but gardens exist, default to the first one
    if (!data.activeGardenId && data.gardens.length > 0) {
      data.activeGardenId = data.gardens[0].id;
      needsSave = true;
    }

    if (needsSave) {
      this.save(data);
    }

    return data;
  },

  save(data: AppData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  addPlant(plant: GardenPlant) {
    const data = this.get();
    // Auto-associate with active garden if not specified
    if (!plant.gardenId && data.activeGardenId) {
      plant.gardenId = data.activeGardenId;
    }
    data.gardenPlants.push(plant);
    this.save(data);
  },

  saveCustomPlant(plant: Plant) {
    const data = this.get();
    // Only add if it doesn't exist
    if (!data.customPlants.some(p => p.id === plant.id)) {
      data.customPlants.push(plant);
      this.save(data);
    }
  },

  updatePlant(plant: GardenPlant) {
    const data = this.get();
    data.gardenPlants = data.gardenPlants.map(p => p.id === plant.id ? plant : p);
    this.save(data);
  },

  removePlant(gardenPlantId: string) {
    const data = this.get();
    data.gardenPlants = data.gardenPlants.filter(p => p.id !== gardenPlantId);
    this.save(data);
  },

  getPlantDetails(plantId: string): Plant | undefined {
    const data = this.get();
    return data.customPlants.find(p => p.id === plantId) || MOCK_PLANTS.find(p => p.id === plantId);
  },

  // User Session Management
  getSession(): UserSession | null {
    return this.get().session;
  },

  setSession(session: UserSession | null) {
    const data = this.get();
    data.session = session;
    this.save(data);
  },

  clearSession() {
    const data = this.get();
    data.session = null;
    this.save(data);
  },

  // Gardens Management
  getGardens(): UserGarden[] {
    return this.get().gardens || [];
  },

  getActiveGardenId(): string | null {
    return this.get().activeGardenId || null;
  },

  setActiveGardenId(id: string | null) {
    const data = this.get();
    data.activeGardenId = id;
    this.save(data);
    window.dispatchEvent(new Event('gardenSwitch'));
  },

  getActiveGarden(): UserGarden | null {
    const data = this.get();
    const activeId = data.activeGardenId;
    if (!activeId) return null;
    return (data.gardens || []).find(g => g.id === activeId) || null;
  },

  addGarden(garden: UserGarden) {
    const data = this.get();
    if (!data.gardens) data.gardens = [];
    // Prevent duplicate IDs
    data.gardens = data.gardens.filter(g => g.id !== garden.id);
    data.gardens.push(garden);
    if (!data.activeGardenId) {
      data.activeGardenId = garden.id;
    }
    this.save(data);
  },

  removeGarden(gardenId: string) {
    const data = this.get();
    if (!data.gardens) data.gardens = [];
    data.gardens = data.gardens.filter(g => g.id !== gardenId);
    // Remove plants associated with this garden
    data.gardenPlants = data.gardenPlants.filter(p => p.gardenId !== gardenId);
    
    if (data.activeGardenId === gardenId) {
      data.activeGardenId = data.gardens.length > 0 ? data.gardens[0].id : null;
    }
    this.save(data);
    window.dispatchEvent(new Event('gardenSwitch'));
  },

  getGardenPlants(): GardenPlant[] {
    const data = this.get();
    const activeId = data.activeGardenId;
    if (!activeId) return [];
    return data.gardenPlants.filter(p => p.gardenId === activeId);
  }
};
