import { useState, useEffect } from 'react';
import { Leaf, Calendar, ArrowRight, Scissors, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../services/i18n';
import { db } from '../data/db';
import GardenCanvas from '../components/GardenCanvas';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const [gardenPlants, setGardenPlants] = useState(() => db.getGardenPlants());
  const [hasAddress, setHasAddress] = useState(() => !!db.getActiveGarden());

  useEffect(() => {
    const handleRefresh = () => {
      setGardenPlants(db.getGardenPlants());
      setHasAddress(!!db.getActiveGarden());
    };
    window.addEventListener('gardenSwitch', handleRefresh);
    return () => window.removeEventListener('gardenSwitch', handleRefresh);
  }, []);

  const activeGarden = db.getActiveGarden();
  const plantsCount = gardenPlants.length;

  const currentMonth = new Date().getMonth() + 1;
  const optimalPruningCount = gardenPlants.filter(gp => {
    const details = db.getPlantDetails(gp.plantId);
    if (!details) return false;
    const currentMonthState = details.trimmingMatrix.find(m => m.month === currentMonth)?.state;
    return currentMonthState === 'optimal';
  }).length;

  const plantNames = (() => {
    const names: Record<string, string> = {};
    gardenPlants.forEach(gp => {
      const details = db.getPlantDetails(gp.plantId);
      if (details?.commonName) {
        names[gp.id] = details.commonName;
      }
    });
    return names;
  })();

  const stats = [
    { 
      label: t('plantsInGarden'), 
      value: String(plantsCount), 
      icon: Leaf, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: language === 'nl' ? 'Snoeibaar deze maand' : 'Can be pruned this month', 
      value: String(optimalPruningCount), 
      icon: Scissors, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{t('welcomeHeader')}</h1>
        <p className="text-slate-500 mt-2">{t('welcomeSubtitle')}</p>
      </div>

      {/* Address Configuration Alert Banner */}
      {!hasAddress && (
        <Link to="/map" className="block mb-8 group animate-fade-in">
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 hover:from-amber-500/15 hover:to-amber-600/10 border-2 border-dashed border-amber-300/60 hover:border-amber-400 p-6 rounded-[32px] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl group-hover:scale-105 transition-transform shrink-0">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  {language === 'nl' ? 'Lokaliseer je tuin op de kaart!' : 'Locate your garden on the map!'}
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {language === 'nl' ? 'Aanbevolen' : 'Recommended'}
                  </span>
                </h4>
                <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">
                  {language === 'nl' 
                    ? 'Voer je adres in om automatisch de bodemsoort te schatten, 3-daagse weersvoorspellingen en vorstwaarschuwingen te ontvangen, en sleep je planten direct op je Kadastrale perceelkaart!' 
                    : 'Enter your address to auto-detect soil types, retrieve local weather forecasts and frost warnings, and drag-and-drop your plants directly onto your Kadaster parcel map!'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-bold text-amber-700 hover:text-amber-800 transition-colors shrink-0 self-end md:self-auto text-sm">
              <span>{language === 'nl' ? 'Kaart openen' : 'Open Map'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Garden SVG Map Card (read-only) — shown only if address is active */}
        {hasAddress && activeGarden && (
          <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col p-8 h-[520px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{language === 'nl' ? 'Mijn Tuinkaart' : 'My Garden Map'}</h3>
                <p className="text-sm text-slate-400 mt-1 leading-normal font-medium">{activeGarden.address}</p>
              </div>
              <Link 
                to="/map" 
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-5 py-3 rounded-2xl transition-all shadow-sm shadow-emerald-50 shrink-0"
              >
                {language === 'nl' ? 'Kaart openen' : 'Open Map'}
              </Link>
            </div>
            
            <div className="flex-1 rounded-[32px] overflow-hidden border border-slate-100/80 relative">
              <GardenCanvas
                geoPolygon={activeGarden.parcelPolygon?.coordinates || []}
                scaledPolygon={activeGarden.scaledPolygon || null}
                isEditMode={false}
                plants={gardenPlants}
                plantNames={plantNames}
                buildings={activeGarden.buildings || []}
                houseGeoPosition={activeGarden.center}
                lawns={activeGarden.lawns || []}
              />
            </div>
          </div>
        )}

        {/* Sidebar Cards Column */}
        <div className={`space-y-8 ${hasAddress ? 'lg:col-span-1' : 'lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8 space-y-0'}`}>
          <Link to="/inventory" className="block group">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-emerald-50 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Leaf className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{t('manageInventory')}</h3>
                  <p className="text-slate-500">{t('manageInventoryDesc')}</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link to="/calendar" className="block group">
            <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl hover:shadow-2xl transition-all flex items-center justify-between">
              <div className="flex items-center gap-6 text-white">
                <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-emerald-500 transition-colors">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t('trimmingCalendar')}</h3>
                  <p className="text-slate-400">
                    {optimalPruningCount > 0 
                      ? (language === 'nl' ? `${optimalPruningCount} planten kunnen deze maand worden gesnoeid` : `${optimalPruningCount} plants can be pruned this month`)
                      : (language === 'nl' ? 'Geen planten te snoeien deze maand' : 'No plants can be pruned this month')}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
