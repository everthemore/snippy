import React, { useRef, useState, useEffect } from 'react';
import { Calendar, Info, Trash2, Sparkles, Camera, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { GardenPlant, Plant } from '../types/garden';
import StatusBadge from './StatusBadge';
import { useLanguage } from '../services/i18n';
import { db } from '../data/db';

interface PlantCardProps {
  gardenPlant: GardenPlant;
  plantDetails: Plant;
  onDelete?: (id: string) => void;
  isFtuiTarget?: boolean;
}

const PlantCard: React.FC<PlantCardProps> = ({ gardenPlant, plantDetails, onDelete, isFtuiTarget }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
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

  const handleOpenInfo = () => {
    setIsInfoModalOpen(true);
    window.dispatchEvent(new Event('ftuiInfoModalOpen'));
  };

  const handleCloseInfo = () => {
    setIsInfoModalOpen(false);
    window.dispatchEvent(new Event('ftuiInfoModalClose'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updated = {
        ...gardenPlant,
        photoUrl: base64String
      };
      db.updatePlant(updated);
      window.dispatchEvent(new Event('gardenSwitch'));
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group relative">
      <div 
        className="h-48 bg-slate-100 relative overflow-hidden group/banner cursor-pointer" 
        onClick={() => {
          if (ftuiStep === null) {
            fileInputRef.current?.click();
          }
        }}
      >
        {gardenPlant.photoUrl || plantDetails.imageUrl ? (
          <>
            <img 
              src={gardenPlant.photoUrl || plantDetails.imageUrl} 
              alt={plantDetails.commonName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 flex items-center justify-center gap-2 text-white font-bold text-sm transition-opacity duration-200">
              <Camera className="w-5 h-5" />
              <span>{language === 'nl' ? 'Foto wijzigen' : 'Change photo'}</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-200 gap-2">
            <Camera className="w-12 h-12 stroke-[1.2]" />
            <span className="text-xs font-bold">{language === 'nl' ? 'Foto uploaden' : 'Upload photo'}</span>
          </div>
        )}
        <div className="absolute top-4 left-4" onClick={(e) => e.stopPropagation()}>
          <StatusBadge status={gardenPlant.status} />
        </div>
        <div className="absolute top-4 right-4 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {onDelete && (
            <button 
              disabled={ftuiStep !== null && (ftuiStep !== 92 || !isFtuiTarget)}
              onClick={(e) => {
                e.stopPropagation();
                if (ftuiStep === 92 || confirm(t('confirmDelete', { name: gardenPlant.nickname || plantDetails.commonName }))) {
                  onDelete(gardenPlant.id);
                }
              }}
              className={`p-2 rounded-full shadow-sm transition-all ${
                isFtuiTarget && ftuiStep === 92
                  ? 'relative z-[9999] bg-rose-600 text-white ring-4 ring-rose-450 scale-115 animate-pulse pointer-events-auto'
                  : ftuiStep !== null
                    ? 'opacity-20 pointer-events-none text-slate-300'
                    : 'bg-white/90 backdrop-blur hover:bg-rose-50 text-rose-500 hover:text-rose-600'
              }`}
              title="Delete Plant"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{gardenPlant.nickname || plantDetails.commonName}</h3>
            <p className="text-sm italic text-slate-500">{plantDetails.latinName}</p>
          </div>
          <button 
            onClick={handleOpenInfo}
            disabled={ftuiStep !== null && (ftuiStep !== 9 || !isFtuiTarget)}
            className={`p-2 transition-all rounded-full ${
              isFtuiTarget && ftuiStep === 9
                ? 'relative z-[9999] bg-emerald-50 text-emerald-600 ring-4 ring-emerald-450 scale-110 animate-pulse pointer-events-auto'
                : ftuiStep !== null
                  ? 'text-slate-300 opacity-20 pointer-events-none'
                  : 'text-slate-400 hover:text-emerald-600'
            }`}
            title={language === 'nl' ? "Plant informatie" : "Plant information"}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>{t('lastTrimmed', { date: gardenPlant.lastTrimmed || t('lastTrimmedNever') })}</span>
          </div>
          
          {/* Custom configuration tags */}
          {(() => {
            const graftedType = gardenPlant.graftedType || 'single';
            const graftedVarieties: string[] = Array.isArray(gardenPlant.graftedVarieties) ? gardenPlant.graftedVarieties : [];
            const pruningForm = gardenPlant.pruningForm || 'standard';
            const sunlight = gardenPlant.sunlight || 'full_sun';
            const soilType = gardenPlant.soilType || 'sand';

            return (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {graftedType !== 'single' && (
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] uppercase tracking-wider font-extrabold rounded-lg border border-indigo-100 shadow-sm">
                    {t(graftedType === 'duo' ? 'graftedDuo' : 'graftedTrio')}: {graftedVarieties.join(' & ')}
                  </span>
                )}
                {pruningForm !== 'standard' && (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-wider font-extrabold rounded-lg border border-emerald-100 shadow-sm">
                    {t(pruningForm === 'espalier' ? 'formEspalier' : pruningForm === 'dwarf' ? 'formDwarf' : 'formColumnar')}
                  </span>
                )}
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] uppercase tracking-wider font-extrabold rounded-lg border border-amber-100 shadow-sm">
                  {t(`sunlight${sunlight === 'full_sun' ? 'Full' : sunlight === 'partial_shade' ? 'Partial' : 'Shade'}` as any)}
                </span>
                <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider font-extrabold rounded-lg border border-slate-200 shadow-sm">
                  {t(`soil${soilType.charAt(0).toUpperCase() + soilType.slice(1)}` as any)}
                </span>
              </div>
            );
          })()}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-50">
          <button 
            disabled={ftuiStep !== null}
            onClick={() => navigate(`/analysis?plantId=${gardenPlant.id}`)}
            className={`w-full font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-1.5 text-sm ${
              ftuiStep !== null
                ? 'opacity-40 pointer-events-none bg-slate-100 text-slate-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            {language === 'nl' ? 'Plant analyse' : 'Plant Analysis'}
          </button>
        </div>
      </div>
    </div>

    {isInfoModalOpen && (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative flex flex-col gap-6 animate-in zoom-in-95 duration-200">
          {/* Close button */}
          <button 
            onClick={handleCloseInfo}
            id="ftui-modal-close"
            className={`absolute top-6 right-6 p-2 rounded-full transition-colors font-bold z-20 w-8 h-8 flex items-center justify-center ${
              ftuiStep === 91
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-450 scale-110 animate-pulse pointer-events-auto'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
            }`}
            title={language === 'nl' ? 'Sluiten' : 'Close'}
          >
            ✕
          </button>

          {/* Header */}
          <div>
            <h3 className="text-3xl font-black text-slate-800">{gardenPlant.nickname || plantDetails.commonName}</h3>
            <p className="text-sm italic text-slate-500 mt-1">{plantDetails.latinName}</p>
          </div>

          {/* Photo preview inside modal */}
          <div className="h-48 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-100">
            {gardenPlant.photoUrl || plantDetails.imageUrl ? (
              <img 
                src={gardenPlant.photoUrl || plantDetails.imageUrl} 
                alt={plantDetails.commonName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-355 bg-slate-50">
                <Image className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {language === 'nl' ? 'Over deze plant' : 'About this plant'}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">{plantDetails.description}</p>
          </div>

          {/* Snoeiadvies per maand */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {language === 'nl' ? 'Snoeiperiode & Advies' : 'Trimming Matrix & Advice'}
            </h4>
            
            {/* Monthly grid */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const matrix = plantDetails.trimmingMatrix.find(item => item.month === m);
                const state = matrix?.state || 'avoid';
                const shortName = (() => {
                  const dutch = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
                  const english = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return language === 'nl' ? dutch[m - 1] : english[m - 1];
                })();

                // Get color class
                let colorClass = 'bg-rose-500 text-white border-rose-600'; // bleeding_risk or avoid
                if (state === 'optimal') {
                  colorClass = 'bg-emerald-500 text-white border-emerald-600';
                } else if (state === 'acceptable') {
                  colorClass = 'bg-amber-500 text-white border-amber-600';
                }

                return (
                  <div 
                    key={m} 
                    className={`py-2 px-1 text-[10px] font-black rounded-lg border text-center flex flex-col items-center justify-center shadow-sm ${colorClass}`}
                    title={matrix?.advice || ''}
                  >
                    <span className="opacity-75">{m}</span>
                    <span className="font-extrabold uppercase tracking-wide text-[9px] mt-0.5">{shortName}</span>
                  </div>
                );
              })}
            </div>

            {/* Best pruning details */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 max-h-[160px] overflow-y-auto">
              {plantDetails.trimmingMatrix.map(m => {
                if (m.state === 'optimal' || m.state === 'acceptable') {
                  const monthLongName = (() => {
                    const dutch = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
                    const english = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    return language === 'nl' ? dutch[m.month - 1] : english[m.month - 1];
                  })();
                  const stateLabel = m.state === 'optimal' 
                    ? (language === 'nl' ? 'Goed' : 'Optimal') 
                    : (language === 'nl' ? 'Acceptabel' : 'Acceptable');
                  const badgeColor = m.state === 'optimal' ? 'bg-emerald-50 text-emerald-750 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
                  
                  return (
                    <div key={m.month} className="text-xs">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <span className={`px-2 py-0.5 border text-[10px] uppercase tracking-wider font-extrabold rounded-md ${badgeColor}`}>
                          {stateLabel}
                        </span>
                        <span className="text-slate-800">{monthLongName}</span>
                      </div>
                      <p className="text-slate-500 leading-normal font-medium pl-1">{m.advice}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Tools & Nutrition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Recommended tools with Intratuin/Bosrand search links */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {language === 'nl' ? 'Geadviseerd Gereedschap' : 'Recommended Tools'}
              </h4>
              <div className="flex flex-col gap-2">
                {plantDetails.defaultInstructions?.tools.map((tool, idx) => (
                  <div key={idx} className="flex flex-col p-3 bg-slate-50 border border-slate-150 rounded-2xl shadow-sm gap-1.5">
                    <span className="text-xs font-bold text-slate-700 capitalize">{tool}</span>
                    <div className="flex gap-2">
                      <a 
                        href={`https://www.intratuin.nl/catalogsearch/result/?q=${encodeURIComponent(tool)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-colors shadow-sm ${
                          ftuiStep === 91
                            ? 'bg-emerald-50 text-emerald-700/50 pointer-events-none opacity-40 border border-emerald-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        Intratuin
                      </a>
                      <a 
                        href={`https://www.bosrand.nl/catalogsearch/result/?q=${encodeURIComponent(tool)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-colors shadow-sm ${
                          ftuiStep === 91
                            ? 'bg-slate-100 text-slate-700/50 pointer-events-none opacity-40 border border-slate-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:text-slate-800'
                        }`}
                      >
                        De Bosrand
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Plant nutrition (food) with Intratuin/Bosrand search links */}
            {(() => {
              const getPlantFoodQuery = (name: string): string => {
                const lower = name.toLowerCase();
                if (lower.includes('vijg') || lower.includes('appel') || lower.includes('peer') || lower.includes('pruim') || lower.includes('perzik') || lower.includes('abrikozen') || lower.includes('kersen')) {
                  return 'kleinfruit voeding';
                }
                if (lower.includes('buxus') || lower.includes('haag')) {
                  return 'buxusvoeding';
                }
                if (lower.includes('hortensia') || lower.includes('hydrangea')) {
                  return 'hortensia voeding';
                }
                if (lower.includes('roos') || lower.includes('rose')) {
                  return 'rozenvoeding';
                }
                if (lower.includes('druif') || lower.includes('grape')) {
                  return 'druiven voeding';
                }
                if (lower.includes('lavendel')) {
                  return 'lavendel voeding';
                }
                return 'universele plantenvoeding';
              };

              const foodQuery = getPlantFoodQuery(plantDetails.commonName);

              return (
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {language === 'nl' ? 'Geadviseerde Voeding' : 'Suggested Plant Food'}
                  </h4>
                  <div className="flex flex-col p-4 bg-emerald-50/35 border border-emerald-150 rounded-2xl shadow-sm gap-2">
                    <span className="text-xs font-bold text-emerald-900 capitalize">{foodQuery}</span>
                    <p className="text-[11px] text-slate-500 leading-normal font-medium">
                      {language === 'nl' 
                        ? 'Meststof speciaal afgestemd om de groei en bloei van deze plant te ondersteunen.' 
                        : 'Fertilizer specially balanced to support the growth and health of this plant.'}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <a 
                        href={`https://www.intratuin.nl/catalogsearch/result/?q=${encodeURIComponent(foodQuery)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-colors shadow-sm ${
                          ftuiStep === 91
                            ? 'bg-emerald-500/50 text-white pointer-events-none opacity-40'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                      >
                        Intratuin
                      </a>
                      <a 
                        href={`https://www.bosrand.nl/catalogsearch/result/?q=${encodeURIComponent(foodQuery)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-colors shadow-sm ${
                          ftuiStep === 91
                            ? 'bg-white text-slate-600/50 pointer-events-none opacity-40 border border-slate-200'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        De Bosrand
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* AI Disclaimer */}
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-3 text-[11px] text-amber-800 font-medium leading-relaxed mt-2 shadow-sm">
            <span className="text-base leading-none shrink-0">⚠️</span>
            <div>
              <p className="font-bold uppercase tracking-wider text-[9px] text-amber-900">
                {language === 'nl' ? 'AI-Gegenereerd Advies' : 'AI-Generated Advice'}
              </p>
              <p className="mt-0.5 text-slate-600">
                {language === 'nl' 
                  ? 'De getoonde snoeiaanbevelingen, periodes en productkoppelingen zijn gegenereerd door kunstmatige intelligentie. Controleer altijd de behoeften van uw specifieke plant of raadpleeg verpakkingen.'
                  : 'The recommendations, periods, and product searches shown are generated by AI. Always verify specific requirements for your plant variety.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);
};

export default PlantCard;
