import { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Layers, Info, CheckCircle2, Mountain, Sun, Maximize2, Minimize2, Plus } from 'lucide-react';
import AddressSearch from '../components/AddressSearch';
import { pdokService } from '../services/pdok';
import GardenCanvas from '../components/GardenCanvas';
import { db } from '../data/db';
import type { UserGarden, GardenPlant, Plant } from '../types/garden';
import { useLanguage } from '../services/i18n';
import AddPlantModal from '../components/AddPlantModal';

export default function MapPage() {
  const { t, language } = useLanguage();
  const [address, setAddress] = useState<string | null>(null);
  const [garden, setGarden] = useState<UserGarden | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [gardenPlants, setGardenPlants] = useState<GardenPlant[]>([]);
  const [plantNames, setPlantNames] = useState<Record<string, string>>({});
  const [buildings, setBuildings] = useState<any[]>([]);
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);
  const addressCardRef = useRef<HTMLDivElement>(null);
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
    if (!isEditingAddress) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addressCardRef.current && !addressCardRef.current.contains(e.target as Node)) {
        setIsEditingAddress(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditingAddress]);

  useEffect(() => {
    const loadData = () => {
      const activeGarden = db.getActiveGarden();
      setGarden(activeGarden);
      setAddress(activeGarden?.address || null);
      setBuildings(activeGarden?.buildings || []);

      const plants = db.getGardenPlants();
      setGardenPlants(plants);

      const names: Record<string, string> = {};
      plants.forEach(gp => {
        const details = db.getPlantDetails(gp.plantId);
        if (details?.commonName) {
          names[gp.id] = details.commonName;
        }
      });
      setPlantNames(names);
    };

    loadData();
    window.addEventListener('gardenSwitch', loadData);
    return () => window.removeEventListener('gardenSwitch', loadData);
  }, []);

  const handleAddressSelect = async (id: string, name: string) => {
    // Check if address is already in the list to prevent duplicate
    const existingGardens = db.getGardens();
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const normalizedNew = normalize(name);
    const existing = existingGardens.find(g => normalize(g.address) === normalizedNew);
    
    if (existing) {
      db.setActiveGardenId(existing.id);
      setGarden(existing);
      setAddress(existing.address);
      setBuildings(existing.buildings || []);
      const plants = db.getGardenPlants();
      setGardenPlants(plants);
      setIsEditingAddress(false);
      window.dispatchEvent(new Event('gardenSwitch'));
      return;
    }

    setAddress(name);
    setIsSyncing(true);
    setIsEditingAddress(false);
    try {
      const lookup = await pdokService.lookup(id);
      const coords = lookup.centroide_ll.match(/\((.*?)\)/)?.[1].split(' ');
      if (coords) {
        const [lng, lat] = coords.map(Number);
        const parcelInfo = await pdokService.getParcel(lat, lng);
        const buildingsInfo = await pdokService.getBuildingsForParcel(lat, lng, parcelInfo.coordinates);
        setBuildings(buildingsInfo);



        const newGarden: UserGarden = {
          id: `garden-${Date.now()}`,
          userId: 'user-1',
          address: name,
          parcelPolygon: { type: 'Polygon', coordinates: parcelInfo.coordinates },
          scaledPolygon: undefined,
          guessedSoil: parcelInfo.guessedSoil,
          guessedSunlight: parcelInfo.guessedSunlight,
          center: { lat, lng },
          lastSync: new Date().toISOString(),
          buildings: buildingsInfo,
        };

        db.addGarden(newGarden);
        db.setActiveGardenId(newGarden.id);
        setGarden(newGarden);
        setIsEditMode(false);
        window.dispatchEvent(new Event('gardenSwitch'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePlantMove = (plantId: string, x: number, y: number) => {
    const data = db.get();
    data.gardenPlants = data.gardenPlants.map(p =>
      p.id === plantId ? { ...p, position: { x, y } } : p
    );
    db.save(data);
    setGardenPlants(data.gardenPlants);
  };

  const handlePlantLockToggle = (plantId: string) => {
    const data = db.get();
    data.gardenPlants = data.gardenPlants.map(p =>
      p.id === plantId ? { ...p, locked: !p.locked } : p
    );
    db.save(data);
    setGardenPlants(data.gardenPlants);
  };

  const handlePolygonChange = (newScaledPoly: [number, number][]) => {
    const activeGarden = db.getActiveGarden();
    if (activeGarden) {
      activeGarden.scaledPolygon = newScaledPoly;
      db.addGarden(activeGarden);
      setGarden(activeGarden);
    }
  };

  const handleLawnsChange = (newLawns: any[]) => {
    const activeGarden = db.getActiveGarden();
    if (activeGarden) {
      activeGarden.lawns = newLawns;
      db.addGarden(activeGarden);
      setGarden(activeGarden);
    }
  };

  const handleAddLawn = () => {
    const activeGarden = db.getActiveGarden();
    if (activeGarden) {
      const lawns = activeGarden.lawns || [];
      const newLawn = {
        id: `lawn-${Date.now()}`,
        type: 'lawn' as const,
        points: [
          [40, 40] as [number, number],
          [60, 40] as [number, number],
          [60, 60] as [number, number],
          [40, 60] as [number, number]
        ]
      };
      activeGarden.lawns = [...lawns, newLawn];
      db.addGarden(activeGarden);
      setGarden(activeGarden);
      setIsEditMode(true); // Automatically open layout edit mode!
    }
  };

  const handleAddTerrace = () => {
    const activeGarden = db.getActiveGarden();
    if (activeGarden) {
      const lawns = activeGarden.lawns || [];
      const newTerrace = {
        id: `terrace-${Date.now()}`,
        type: 'terrace' as const,
        points: [
          [40, 40] as [number, number],
          [60, 40] as [number, number],
          [60, 60] as [number, number],
          [40, 60] as [number, number]
        ]
      };
      activeGarden.lawns = [...lawns, newTerrace];
      db.addGarden(activeGarden);
      setGarden(activeGarden);
      setIsEditMode(true); // Automatically open layout edit mode!
    }
  };

  const updateFtuiStep = (newStep: number | null) => {
    if (newStep === null) {
      localStorage.removeItem('snippy_ftui_step');
    } else {
      localStorage.setItem('snippy_ftui_step', newStep.toString());
    }
    window.dispatchEvent(new Event('ftuiStateChange'));
  };

  const handleAddPlant = (plant: Plant, config: {
    graftedType: 'single' | 'duo' | 'trio';
    graftedVarieties: string[];
    pruningForm: 'standard' | 'espalier' | 'dwarf' | 'columnar';
    sunlight: 'full_sun' | 'partial_shade' | 'full_shade';
    soilType: 'clay' | 'sand' | 'loam' | 'peat';
    windExposure: 'exposed' | 'sheltered';
    proximityToWalls: 'none' | 'south_wall' | 'other_wall';
  }) => {
    db.saveCustomPlant(plant);

    const newPlant: GardenPlant = {
      id: `gp-${Date.now()}`,
      userId: 'user-1',
      plantId: plant.id,
      nickname: '', 
      status: 'healthy',
      microclimateFlags: [],
      position: { x: 45 + Math.random() * 10, y: 45 + Math.random() * 10 },
      lastTrimmed: undefined,
      
      graftedType: config.graftedType,
      graftedVarieties: config.graftedVarieties,
      pruningForm: config.pruningForm,
      sunlight: config.sunlight,
      soilType: config.soilType,
      windExposure: config.windExposure,
      proximityToWalls: config.proximityToWalls,
      type: plant.imageUrl?.includes('tree') ? 'tree' : 'flower'
    };
    
    db.addPlant(newPlant);
    
    const plants = db.getGardenPlants();
    setGardenPlants(plants);
    
    const names: Record<string, string> = {};
    plants.forEach(gp => {
      const details = db.getPlantDetails(gp.plantId);
      if (details?.commonName) {
        names[gp.id] = details.commonName;
      }
    });
    setPlantNames(names);
    
    setIsAddPlantModalOpen(false);
    
    const currentStep = localStorage.getItem('snippy_ftui_step');
    if (currentStep === '6' || currentStep === '5') {
      updateFtuiStep(7);
    }
    
    window.dispatchEvent(new Event('gardenSwitch'));
  };

  const canvasContent = garden ? (
    <GardenCanvas
      geoPolygon={garden.parcelPolygon?.coordinates || []}
      scaledPolygon={garden.scaledPolygon || null}
      isEditMode={isEditMode}
      onPolygonChange={handlePolygonChange}
      plants={gardenPlants}
      plantNames={plantNames}
      onPlantMove={handlePlantMove}
      onPlantLockToggle={handlePlantLockToggle}
      buildings={buildings}
      houseGeoPosition={garden.center}
      lawns={garden.lawns || []}
      onLawnsChange={handleLawnsChange}
      onEditModeChange={setIsEditMode}
    />
  ) : null;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4">
            <MapIcon className="w-10 h-10 text-emerald-600" />
            {language === 'nl' ? 'Tuinkaart' : 'Garden Map'}
          </h1>
          <p className="text-slate-500 mt-2">
            {language === 'nl'
              ? 'Vertaal de officiële Kadaster-perceelgrenzen naar een interactieve 2D-indeling.'
              : 'Translate your official Kadaster boundaries to an interactive 2D layout.'}
          </p>
        </div>
      </div>

      {/* Main layout: sidebar (col-1) + map (col-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── Sidebar ── */}
        <div className="space-y-6">

          {/* Address */}
          <section className={`bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4 ${
            ftuiStep === 3 ? 'relative z-[9999] ring-4 ring-emerald-500 shadow-2xl' : ''
          }`}>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-500" />
              {language === 'nl' ? '1. Tuin Adres' : '1. Garden Address'}
            </h3>
            {(!address || isEditingAddress) ? (
              <div className="space-y-4">
                <AddressSearch onSelect={handleAddressSelect} />
                {address && (
                  <button
                    onClick={() => setIsEditingAddress(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-bold transition-colors block"
                  >
                    {language === 'nl' ? 'Annuleren' : 'Cancel'}
                  </button>
                )}
              </div>
            ) : (
              address && (
                <div ref={addressCardRef} className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                    <div className="flex items-start gap-3 min-w-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-emerald-900 leading-tight truncate">{address}</p>
                        <p className="text-[10px] text-emerald-700 mt-1 uppercase tracking-wider font-semibold">
                          {language === 'nl' ? 'Kadastrale grenzen ingeladen' : 'Parcel boundaries loaded'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className="p-2 hover:bg-emerald-100 rounded-xl text-emerald-700 transition-colors shrink-0"
                      title={language === 'nl' ? 'Nieuw adres toevoegen' : 'Add new address'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {db.getGardens().length > 1 && (
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {language === 'nl' ? 'Switch Adres' : 'Switch Address'}
                      </label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={garden?.id || ''}
                        onChange={(e) => {
                          db.setActiveGardenId(e.target.value);
                          window.dispatchEvent(new Event('gardenSwitch'));
                        }}
                      >
                        {db.getGardens().map(g => (
                          <option key={g.id} value={g.id}>
                            {g.address}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )
            )}
          </section>

          {/* Garden Properties — only when garden loaded */}
          {garden && (
            <section className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-500" />
                {language === 'nl' ? '2. Tuin Eigenschappen' : '2. Garden Properties'}
              </h3>
              
              {garden.guessedSoil && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {language === 'nl' ? 'Bodemtype' : 'Soil Type'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Mountain className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 capitalize">
                          {t(`soil${garden.guessedSoil.charAt(0).toUpperCase() + garden.guessedSoil.slice(1)}` as any)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {language === 'nl' ? 'Zonligging' : 'Sunlight'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 capitalize">
                          {t(`sunlight${garden.guessedSunlight === 'full_sun' ? 'Full' : garden.guessedSunlight === 'partial_shade' ? 'Partial' : 'Shade'}` as any)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
          {/* Garden Objects/Elements */}
          {garden && (
            <section className={`bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4 ${
              ftuiStep === 4 ? 'relative z-[9999] ring-4 ring-emerald-500 shadow-2xl' : ''
            }`}>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Mountain className="w-5 h-5 text-emerald-500" />
                {language === 'nl' ? '3. Tuin Elementen' : '3. Garden Elements'}
              </h3>
              <p className="text-xs text-slate-500 leading-normal">
                {language === 'nl' 
                  ? 'Voeg zones toe aan je tuin, zoals grasvelden of terrassen. Sleep hoeken om de vorm aan te passen.' 
                  : 'Add zones to your garden, like lawns or terraces. Drag corners to reshape.'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={ftuiStep === 4}
                  onClick={handleAddLawn}
                  className={`flex items-center justify-center gap-2 px-3 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-2xl font-bold text-xs transition-all ${
                    ftuiStep === 4 ? 'opacity-30 pointer-events-none' : 'hover:bg-emerald-100 active:scale-95'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  {language === 'nl' ? 'Gazon toevoegen' : 'Add Lawn'}
                </button>
                <button
                  disabled={ftuiStep === 4}
                  onClick={handleAddTerrace}
                  className={`flex items-center justify-center gap-2 px-3 py-3 bg-slate-100 text-slate-700 border border-slate-200/50 rounded-2xl font-bold text-xs transition-all ${
                    ftuiStep === 4 ? 'opacity-30 pointer-events-none' : 'hover:bg-slate-200 active:scale-95'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  {language === 'nl' ? 'Terras toevoegen' : 'Add Terrace'}
                </button>
                <button
                  onClick={() => {
                    setIsAddPlantModalOpen(true);
                    if (ftuiStep === 4) {
                      updateFtuiStep(5);
                    }
                  }}
                  className={`col-span-2 flex items-center justify-center gap-2 px-3 py-3 border rounded-2xl font-bold text-xs transition-all mt-1 ${
                    ftuiStep === 4
                      ? 'relative z-[9999] bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-lg scale-102 animate-pulse pointer-events-auto'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/50 active:scale-95'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  {language === 'nl' ? 'Plant toevoegen' : 'Add Plant'}
                </button>
              </div>
            </section>
          )}

          {/* Legend */}
          <section className="bg-slate-900 p-6 rounded-[28px] text-white">
            <h3 className="text-base font-bold mb-4">{language === 'nl' ? 'Legenda' : 'Garden Legend'}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-sm text-slate-300 font-medium">
                  {language === 'nl' ? 'Geplaatste Planten' : 'Mapped Plants'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg border border-emerald-500/30" />
                <span className="text-sm text-slate-400">
                  {language === 'nl' ? 'Perceel Oppervlakte' : 'Parcel Boundary'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-lime-300/60 rounded-lg border border-dashed border-lime-500" />
                <span className="text-sm text-slate-400">
                  {language === 'nl' ? 'Gazon' : 'Lawn'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-400/60 rounded-lg border border-dashed border-slate-500" />
                <span className="text-sm text-slate-400">
                  {language === 'nl' ? 'Terras' : 'Terrace'}
                </span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 flex gap-3">
              <Info className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'nl'
                  ? 'Sleep de planten naar de juiste positie op de perceelkaart.'
                  : 'Drag plants to position them on the parcel map.'}
              </p>
            </div>
          </section>
        </div>

        {/* ── Map card (col-span-2) ── */}
        <div className={`lg:col-span-2 relative ${
          ftuiStep === 7 ? 'relative z-[9999] ring-4 ring-emerald-500 rounded-[40px] shadow-2xl scale-[1.01] transition-transform' : ''
        }`}>
          {isSyncing ? (
            <div className="w-full aspect-square bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="font-bold uppercase tracking-widest text-xs">
                {language === 'nl' ? 'Verbinding maken met Kadaster...' : 'Syncing Kadaster OGC...'}
              </p>
            </div>
          ) : garden ? (
            <div className="relative rounded-[40px] overflow-hidden shadow-xl border border-slate-100 h-[560px]">
              {canvasContent}
              
              {/* Done Editing floating bar */}
              {isEditMode && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-200/80 z-20 flex items-center gap-3 animate-in slide-in-from-top duration-200">
                  <span className="text-xs font-bold text-slate-600">
                    {language === 'nl' ? 'Indeling bewerken' : 'Editing Layout'}
                  </span>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 py-1.5 text-xs font-black transition-colors"
                  >
                    {language === 'nl' ? 'Klaar met bewerken' : 'Done Editing'}
                  </button>
                </div>
              )}

              {/* Expand button */}
              <button
                onClick={() => setIsFullScreen(true)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md hover:bg-white transition-colors z-10"
                title={language === 'nl' ? 'Volledig scherm' : 'Enter fullscreen'}
              >
                <Maximize2 className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          ) : (
            <div className="w-full aspect-square bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-4 group">
              <div className="p-6 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <MapIcon className="w-12 h-12 text-slate-200" />
              </div>
              <p className="font-bold text-slate-400">
                {language === 'nl' ? 'Zoek je adres om de tuin te visualiseren' : 'Search for your address to begin mapping'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen overlay: covers everything except the fixed nav (left-64) */}
      {isFullScreen && garden && (
        <div className="fixed inset-0 left-64 z-50 bg-white flex flex-col">
          <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-white">
            <div />

            <button
              onClick={() => setIsFullScreen(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-sm text-slate-700 transition-colors"
              title={language === 'nl' ? 'Verklein kaart' : 'Exit fullscreen'}
            >
              <Minimize2 className="w-4 h-4" />
              {language === 'nl' ? 'Verkleinen' : 'Exit fullscreen'}
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {canvasContent}
            {/* Done Editing floating bar in fullscreen */}
            {isEditMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-200/80 z-20 flex items-center gap-3 animate-in slide-in-from-top duration-200">
                <span className="text-xs font-bold text-slate-600">
                  {language === 'nl' ? 'Indeling bewerken' : 'Editing Layout'}
                </span>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 py-1.5 text-xs font-black transition-colors"
                >
                  {language === 'nl' ? 'Klaar met bewerken' : 'Done Editing'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Plant Modal */}
      <AddPlantModal 
        isOpen={isAddPlantModalOpen} 
        onClose={() => setIsAddPlantModalOpen(false)} 
        onAdd={handleAddPlant}
      />
    </div>
  );
}
