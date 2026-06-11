import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { db } from '../data/db';
import type { Plant } from '../types/garden';
import TrimmingMatrix from '../components/TrimmingMatrix';
import TrimmingDetailModal from '../components/TrimmingDetailModal';
import { useLanguage } from '../services/i18n';

export default function Calendar() {
  const { language, t } = useLanguage();
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gardenPlants, setGardenPlants] = useState(() => db.getGardenPlants());
  const [ftuiStep, setFtuiStep] = useState<number | null>(() => {
    const s = localStorage.getItem('snippy_ftui_step');
    return s ? parseInt(s, 10) : null;
  });

  useEffect(() => {
    const handleRefresh = () => {
      setGardenPlants(db.getGardenPlants());
    };
    const handleSync = () => {
      const s = localStorage.getItem('snippy_ftui_step');
      setFtuiStep(s ? parseInt(s, 10) : null);
    };
    window.addEventListener('gardenSwitch', handleRefresh);
    window.addEventListener('ftuiStateChange', handleSync);
    return () => {
      window.removeEventListener('gardenSwitch', handleRefresh);
      window.removeEventListener('ftuiStateChange', handleSync);
    };
  }, []);

  const plantsWithDetails = gardenPlants.map(gp => ({
    garden: gp,
    details: db.getPlantDetails(gp.plantId)!
  }));

  const handleCellClick = (plant: Plant, month: number) => {
    setSelectedPlant(plant);
    setSelectedMonth(month);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4">
            <CalendarIcon className="w-10 h-10 text-emerald-600" />
            {t('trimmingCalendar')}
          </h1>
          <p className="text-slate-500 mt-2">{t('calendarSubtitle')}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100">
          <Info className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">
            {t('currentMonth', { month: new Date().toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US', { month: 'long' }) })}
          </p>
        </div>
      </div>

      <div className={`mb-12 overflow-x-auto w-full select-none ${
        ftuiStep === 8 ? 'relative z-[9999] ring-4 ring-emerald-500 rounded-[32px] shadow-2xl p-4 bg-white transition-all duration-300' : ''
      }`}>
        <div className="min-w-[750px] md:min-w-0">
          <TrimmingMatrix 
            plants={plantsWithDetails} 
            onCellClick={handleCellClick} 
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h3 className="text-2xl font-bold mb-3">{t('contextualAnalysisTitle')}</h3>
            <p className="text-slate-400 leading-relaxed">
              {t('contextualAnalysisDesc')}
            </p>
          </div>
          <button className="bg-white text-slate-900 font-bold px-8 py-4 rounded-2xl hover:bg-slate-100 transition-colors whitespace-nowrap">
            {t('analyzeMyGarden')}
          </button>
        </div>
      </div>

      <TrimmingDetailModal 
        isOpen={isModalOpen}
        plant={selectedPlant}
        month={selectedMonth}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
