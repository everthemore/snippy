import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../data/db';
import type { GardenPlant, Plant } from '../types/garden';
import PlantCard from '../components/PlantCard';
import AddPlantModal from '../components/AddPlantModal';
import { useLanguage } from '../services/i18n';

export default function Inventory() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [gardenPlants, setGardenPlants] = useState(() => db.getGardenPlants());
  const [ftuiStep, setFtuiStep] = useState<number | null>(() => {
    const s = localStorage.getItem('snippy_ftui_step');
    return s ? parseInt(s, 10) : null;
  });

  useEffect(() => {
    const handleSync = () => {
      const s = localStorage.getItem('snippy_ftui_step');
      setFtuiStep(s ? parseInt(s, 10) : null);
    };
    window.addEventListener('ftuiStateChange', handleSync);
    return () => window.removeEventListener('ftuiStateChange', handleSync);
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      setGardenPlants(db.getGardenPlants());
    };
    window.addEventListener('gardenSwitch', handleRefresh);
    return () => window.removeEventListener('gardenSwitch', handleRefresh);
  }, []);

  useEffect(() => {
    const searchVal = searchParams.get('search') || '';
    setSearchQuery(searchVal);
  }, [searchParams]);

  const handleAddPlant = (plant: Plant, config: {
    graftedType: 'single' | 'duo' | 'trio';
    graftedVarieties: string[];
    pruningForm: 'standard' | 'espalier' | 'dwarf' | 'columnar';
    sunlight: 'full_sun' | 'partial_shade' | 'full_shade';
    soilType: 'clay' | 'sand' | 'loam' | 'peat';
    windExposure: 'exposed' | 'sheltered';
    proximityToWalls: 'none' | 'south_wall' | 'other_wall';
  }) => {
    // 1. Save the plant definition if it's new (custom)
    db.saveCustomPlant(plant);

    // 2. Create the specific instance in the garden
    const newPlant: GardenPlant = {
      id: `gp-${Date.now()}`,
      userId: 'user-1',
      plantId: plant.id,
      nickname: '', // They can edit this later
      status: 'healthy',
      microclimateFlags: [],
      position: { x: 45 + Math.random() * 10, y: 45 + Math.random() * 10 }, // Random offset position to prevent stacking
      lastTrimmed: undefined,
      
      // Persist extended fields
      graftedType: config.graftedType,
      graftedVarieties: config.graftedVarieties,
      pruningForm: config.pruningForm,
      sunlight: config.sunlight,
      soilType: config.soilType,
      windExposure: config.windExposure,
      proximityToWalls: config.proximityToWalls,
      type: plant.imageUrl?.includes('tree') ? 'tree' : 'flower' // simple guess
    };
    
    db.addPlant(newPlant);
    setGardenPlants(db.getGardenPlants()); // Refresh local state
    setIsModalOpen(false); // Close modal
  };

  const handleDeletePlant = (gardenPlantId: string) => {
    db.removePlant(gardenPlantId);
    setGardenPlants(db.getGardenPlants()); // Refresh local state

    const currentStep = localStorage.getItem('snippy_ftui_step');
    if (currentStep === '92') {
      localStorage.removeItem('snippy_ftui_added_plant_id');
      localStorage.setItem('snippy_ftui_step', '10');
      window.dispatchEvent(new Event('ftuiStateChange'));
    }
  };

  const filteredPlants = gardenPlants.filter(gp => {
    const details = db.getPlantDetails(gp.plantId);
    return details?.commonName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           details?.latinName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           gp.nickname?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{t('inventoryHeader')}</h1>
          <p className="text-slate-500 mt-2">{t('inventorySubtitle')}</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-6 h-6" />
          {t('addNewPlant')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder={t('searchGardenPlaceholder')} 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (val) {
                setSearchParams({ search: val });
              } else {
                setSearchParams({});
              }
            }}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors shadow-sm">
          <Filter className="w-5 h-5" />
          {t('filters')}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {(() => {
          const ftuiAddedPlantId = localStorage.getItem('snippy_ftui_added_plant_id');
          const hasAddedPlant = ftuiAddedPlantId ? filteredPlants.some(p => p.id === ftuiAddedPlantId) : false;

          return filteredPlants.map((gp, index) => {
            const details = db.getPlantDetails(gp.plantId);
            if (!details) return null;

            const isFtuiTarget = hasAddedPlant ? gp.id === ftuiAddedPlantId : index === 0;

            return (
              <div 
                key={gp.id} 
                className={isFtuiTarget && [9, 92].includes(ftuiStep || 0)
                  ? 'relative z-[9999] ring-4 ring-emerald-500 rounded-[32px] bg-white shadow-2xl scale-[1.01] transition-transform' 
                  : ''
                }
              >
                <PlantCard 
                  gardenPlant={gp} 
                  plantDetails={details} 
                  onDelete={handleDeletePlant} 
                  isFtuiTarget={isFtuiTarget}
                />
              </div>
            );
          });
        })()}
      </div>

      {/* Add Plant Modal */}
      <AddPlantModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddPlant}
      />
    </div>
  );
}
