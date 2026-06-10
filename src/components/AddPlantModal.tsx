import { useState, useEffect } from 'react';
import { X, Search, Camera, ImageIcon, ArrowRight, Loader2, Plus, Sparkles, Sun, Wind, Mountain, Landmark, ChevronDown, ChevronUp } from 'lucide-react';
import { MOCK_PLANTS } from '../data/mockPlants';
import { aiProvider } from '../services/aiProvider';
import { wikipediaService } from '../services/wikipedia';
import type { WikiSuggestion } from '../services/wikipedia';
import type { InitProgressReport } from '@mlc-ai/web-llm';
import type { Plant } from '../types/garden';
import { useLanguage } from '../services/i18n';
import { db } from '../data/db';

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (plant: Plant, config: {
    graftedType: 'single' | 'duo' | 'trio';
    graftedVarieties: string[];
    pruningForm: 'standard' | 'espalier' | 'dwarf' | 'columnar';
    sunlight: 'full_sun' | 'partial_shade' | 'full_shade';
    soilType: 'clay' | 'sand' | 'loam' | 'peat';
    windExposure: 'exposed' | 'sheltered';
    proximityToWalls: 'none' | 'south_wall' | 'other_wall';
  }) => void;
}

type Step = 'method' | 'search' | 'configure' | 'vision' | 'confirm';

const AddPlantModal: React.FC<AddPlantModalProps> = ({ isOpen, onClose, onAdd }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('method');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Plant[]>([]);
  const [wikiSuggestions, setWikiSuggestions] = useState<WikiSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<WikiSuggestion | null>(null);
  const [selectedPredefinedPlant, setSelectedPredefinedPlant] = useState<Plant | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const updateFtuiStep = (newStep: number | null) => {
    if (newStep === null) {
      localStorage.removeItem('snippy_ftui_step');
    } else {
      localStorage.setItem('snippy_ftui_step', newStep.toString());
    }
    window.dispatchEvent(new Event('ftuiStateChange'));
  };
  const [aiProgress, setAiProgress] = useState<string>('');

  // Configuration settings (Step 2)
  const [graftedType, setGraftedType] = useState<'single' | 'duo' | 'trio'>('single');
  const [variety1, setVariety1] = useState('');
  const [variety2, setVariety2] = useState('');
  const [variety3, setVariety3] = useState('');
  const [pruningForm, setPruningForm] = useState<'standard' | 'espalier' | 'dwarf' | 'columnar'>('standard');
  const [sunlight, setSunlight] = useState<'full_sun' | 'partial_shade' | 'full_shade'>('full_sun');
  const [soilType, setSoilType] = useState<'clay' | 'sand' | 'loam' | 'peat'>('sand');
  const [windExposure, setWindExposure] = useState<'exposed' | 'sheltered'>('sheltered');
  const [proximityToWalls, setProximityToWalls] = useState<'none' | 'south_wall' | 'other_wall'>('none');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSearchQuery('');
      setSearchResults([]);
      setWikiSuggestions([]);
      setSelectedSuggestion(null);
      setSelectedPredefinedPlant(null);
      setIsProcessing(false);
      setAiProgress('');
      setGraftedType('single');
      setVariety1('');
      setVariety2('');
      setVariety3('');
      setPruningForm('standard');
      setWindExposure('sheltered');
      setProximityToWalls('none');
      setShowAdvanced(false);

      // Pre-fill Standplaats/Bodem using PDOK guesses from the local DB if available
      const garden = db.getActiveGarden();
      setSoilType(garden?.guessedSoil || 'sand');
      setSunlight(garden?.guessedSunlight || 'full_sun');
    }
  }, [isOpen]);

  // Pre-fill typical varieties on suggestion select based on query
  useEffect(() => {
    if (selectedSuggestion) {
      const nameLower = selectedSuggestion.title.toLowerCase();
      if (nameLower.includes('pruim') || nameLower.includes('plum')) {
        setVariety1('Opal');
        setVariety2('Victoria');
        setVariety3("Reine Claude d'Althan");
      } else if (nameLower.includes('appel') || nameLower.includes('apple')) {
        setVariety1('Elstar');
        setVariety2('Jonagold');
        setVariety3('Golden Delicious');
      } else if (nameLower.includes('peer') || nameLower.includes('pear')) {
        setVariety1('Conference');
        setVariety2('Doyenné du Comice');
        setVariety3('Gieser Wildeman');
      } else if (nameLower.includes('kers') || nameLower.includes('cherry')) {
        setVariety1('Kordia');
        setVariety2('Regina');
        setVariety3('Stella');
      } else {
        setVariety1('Variety A');
        setVariety2('Variety B');
        setVariety3('Variety C');
      }
    }
  }, [selectedSuggestion]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const exactMatches = MOCK_PLANTS.filter(p => 
        p.commonName.toLowerCase().includes(query.toLowerCase()) || 
        p.latinName.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(exactMatches);

      try {
        const suggestions = await wikipediaService.getSuggestions(query);
        setWikiSuggestions(suggestions);
      } catch (error) {
        console.error("Failed to load wiki suggestions:", error);
      }
    } else {
      setSearchResults([]);
      setWikiSuggestions([]);
    }
  };

  const handleWikiSuggestionClick = (suggestion: WikiSuggestion) => {
    setSelectedPredefinedPlant(null);
    setSelectedSuggestion(suggestion);
    setStep('configure');
  };

  const handleCustomQueryClick = () => {
    setSelectedPredefinedPlant(null);
    setSelectedSuggestion({
      title: searchQuery,
      description: 'Custom plant schedule',
      url: ''
    });
    setStep('configure');
  };

  const handleGenerateAdvice = async () => {
    if (!selectedSuggestion) return;
    
    const config = {
      graftedType,
      graftedVarieties: graftedType === 'single' ? [] : graftedType === 'duo' ? [variety1, variety2] : [variety1, variety2, variety3],
      pruningForm,
      sunlight,
      soilType,
      windExposure,
      proximityToWalls
    };

    if (selectedPredefinedPlant) {
      const configuredPlant: Plant = {
        ...selectedPredefinedPlant,
        id: `predefined-${Date.now()}`
      };
      onAdd(configuredPlant, config);
      return;
    }

    setIsProcessing(true);
    setStep('vision'); // Loading spinner screen
    setAiProgress(t('loadingEngine'));

    try {
      const dynamicPlant = await aiProvider.generatePlantData(
        selectedSuggestion.title, 
        selectedSuggestion.latinName,
        config,
        (report: InitProgressReport) => {
          setAiProgress(report.text);
        }
      );
      
      onAdd(dynamicPlant, config);
    } catch (e) {
      console.error(e);
      setAiProgress(t('unableToFetch'));
      setTimeout(() => {
        setStep('configure');
        setAiProgress('');
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">
            {step === 'configure' ? t('microclimateLabel') : t('addNewPlantModal')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {step === 'method' && (
            <div className="space-y-4">
              <p className="text-slate-500 mb-6">{t('howToAdd')}</p>
              
              <button 
                onClick={() => {
                  setStep('search');
                  if (ftuiStep === 5) {
                    updateFtuiStep(6);
                  }
                }}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all group text-left ${
                  ftuiStep === 5
                    ? 'relative z-[9999] bg-emerald-50 border-emerald-500 ring-4 ring-emerald-400 shadow-lg scale-102 animate-pulse pointer-events-auto'
                    : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50'
                }`}
              >
                <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                  <Search className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{t('searchByName')}</h3>
                  <p className="text-sm text-slate-500">{t('searchByNameDesc')}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                disabled={ftuiStep === 5}
                onClick={() => setStep('search')}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all group text-left ${
                  ftuiStep === 5
                    ? 'opacity-30 pointer-events-none border-slate-100'
                    : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50'
                }`}
              >
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{t('scanPlantCard')}</h3>
                  <p className="text-sm text-slate-500">{t('scanPlantCardDesc')}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                disabled={ftuiStep === 5}
                onClick={() => setStep('search')}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all group text-left ${
                  ftuiStep === 5
                    ? 'opacity-30 pointer-events-none border-slate-100'
                    : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50'
                }`}
              >
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <ImageIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{t('identifyPhoto')}</h3>
                  <p className="text-sm text-slate-500">{t('identifyPhotoDesc')}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          )}

          {step === 'search' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder={t('searchPlaceholder')} 
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                    ftuiStep === 6
                      ? 'relative z-[9999] border-emerald-500 ring-4 ring-emerald-400 bg-white shadow-md pointer-events-auto'
                      : 'border-slate-200'
                  }`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {searchResults.map((plant, idx) => (
                  <button 
                    key={plant.id}
                    onClick={() => {
                      setSelectedPredefinedPlant(plant);
                      setSelectedSuggestion({
                        title: plant.commonName,
                        latinName: plant.latinName,
                        description: plant.description,
                        url: ''
                      });
                      setStep('configure');
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group border ${
                      ftuiStep === 6 && idx === 0
                        ? 'border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50 ring-4 ring-emerald-450/40 animate-pulse'
                        : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-slate-800">{plant.commonName}</h4>
                      <p className="text-xs italic text-slate-500">{plant.latinName}</p>
                    </div>
                    <Plus className="w-5 h-5 text-slate-300 group-hover:text-emerald-600" />
                  </button>
                ))}

                {wikiSuggestions.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('liveSuggestions')}</h4>
                    <div className="space-y-2">
                      {wikiSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleWikiSuggestionClick(s)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group text-left border ${
                            ftuiStep === 6 && idx === 0 && searchResults.length === 0
                              ? 'border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50 ring-4 ring-emerald-450/40 animate-pulse'
                              : 'border-transparent hover:bg-emerald-50/50 hover:border-emerald-100/50'
                          }`}
                        >
                          <div className="pr-4 flex-1">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                              {s.title}
                            </h4>
                            {s.latinName && (
                              <p className="text-xs italic text-emerald-600 font-medium">{s.latinName}</p>
                            )}
                            <p className="text-xs text-slate-500 line-clamp-1">{s.description}</p>
                          </div>
                          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Sparkles className="w-3 h-3" />
                            {t('getSchedule')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchQuery.length > 2 && (
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-3 text-center">{t('cantFindWhatYouNeed')}</p>
                    <button 
                      onClick={handleCustomQueryClick}
                      className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-bold transition-colors border ${
                        ftuiStep === 6 && searchResults.length === 0 && wikiSuggestions.length === 0
                          ? 'border-emerald-550 bg-emerald-100 text-emerald-800 ring-4 ring-emerald-450/40 animate-pulse'
                          : 'bg-emerald-550/10 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                      }`}
                    >
                      <Sparkles className="w-5 h-5" />
                      {t('createCustomSchedule', { query: searchQuery })}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'configure' && selectedSuggestion && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                <h4 className="font-bold text-slate-800 text-base">{selectedSuggestion.title}</h4>
                {selectedSuggestion.latinName && (
                  <p className="text-xs italic text-emerald-600 font-bold">{selectedSuggestion.latinName}</p>
                )}
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{selectedSuggestion.description}</p>
              </div>

              {/* 1. Grafting Settings */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{t('graftingLabel')}</label>
                <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-150">
                  {(['single', 'duo', 'trio'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setGraftedType(type)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        graftedType === type
                          ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {t(type === 'single' ? 'graftedSingle' : type === 'duo' ? 'graftedDuo' : 'graftedTrio')}
                    </button>
                  ))}
                </div>

                {graftedType !== 'single' && (
                  <div className="grid grid-cols-1 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-150 animate-in slide-in-from-top-2 duration-250">
                    <h5 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      {t('graftedVarietiesLabel')}
                    </h5>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{t('graftName', { num: '1' })}</label>
                      <input
                        type="text"
                        value={variety1}
                        onChange={(e) => setVariety1(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{t('graftName', { num: '2' })}</label>
                      <input
                        type="text"
                        value={variety2}
                        onChange={(e) => setVariety2(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
                      />
                    </div>
                    {graftedType === 'trio' && (
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{t('graftName', { num: '3' })}</label>
                        <input
                          type="text"
                          value={variety3}
                          onChange={(e) => setVariety3(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Shape / Training Style */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{t('pruningFormLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['standard', 'espalier', 'dwarf', 'columnar'] as const).map(form => (
                    <button
                      key={form}
                      type="button"
                      onClick={() => setPruningForm(form)}
                      className={`py-3 px-4 text-xs font-bold rounded-xl border transition-all text-left flex justify-between items-center ${
                        pruningForm === form
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                          : 'border-slate-150 bg-white text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {t(form === 'standard' ? 'formStandard' : form === 'espalier' ? 'formEspalier' : form === 'dwarf' ? 'formDwarf' : 'formColumnar')}
                      {pruningForm === form && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Microclimate & Soil (Foldable Advanced Section) */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-150 hover:bg-slate-100 hover:border-slate-200 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest transition-all text-left focus:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-600" />
                    {t('microclimateLabel')} (Advanced)
                  </span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                
                {showAdvanced && (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-150 animate-in slide-in-from-top-2 duration-200">
                    {/* Sun */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        {t('sunlightLabel')}
                      </span>
                      <select
                        value={sunlight}
                        onChange={(e) => setSunlight(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="full_sun">{t('sunlightFull')}</option>
                        <option value="partial_shade">{t('sunlightPartial')}</option>
                        <option value="full_shade">{t('sunlightShade')}</option>
                      </select>
                    </div>

                    {/* Soil */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Mountain className="w-3.5 h-3.5 text-emerald-600" />
                        {t('soilLabel')}
                      </span>
                      <select
                        value={soilType}
                        onChange={(e) => setSoilType(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="clay">{t('soilClay')}</option>
                        <option value="sand">{t('soilSand')}</option>
                        <option value="loam">{t('soilLoam')}</option>
                        <option value="peat">{t('soilPeat')}</option>
                      </select>
                    </div>

                    {/* Wind */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Wind className="w-3.5 h-3.5 text-blue-500" />
                        {t('windLabel')}
                      </span>
                      <select
                        value={windExposure}
                        onChange={(e) => setWindExposure(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="sheltered">{t('windSheltered')}</option>
                        <option value="exposed">{t('windExposed')}</option>
                      </select>
                    </div>

                    {/* Wall */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Landmark className="w-3.5 h-3.5 text-indigo-500" />
                        {t('wallLabel')}
                      </span>
                      <select
                        value={proximityToWalls}
                        onChange={(e) => setProximityToWalls(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="none">{t('wallNone')}</option>
                        <option value="south_wall">{t('wallSouth')}</option>
                        <option value="other_wall">{t('wallOther')}</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerateAdvice}
                className={`w-full font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg ${
                  ftuiStep === 6
                    ? 'relative z-[9999] bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-400 border border-emerald-500 shadow-emerald-100 animate-pulse pointer-events-auto'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                {t('getSchedule')}
              </button>
            </div>
          )}

          {step === 'vision' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 animate-ping rounded-full" />
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin relative z-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{t('analyzingProfile')}</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">{aiProgress}</p>
              </div>
            </div>
          )}
        </div>

        {step !== 'method' && !isProcessing && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-start">
            <button 
              onClick={() => {
                if (step === 'configure') {
                  setStep('search');
                } else {
                  setStep('method');
                  setSearchQuery('');
                  setSearchResults([]);
                }
              }} 
              className="text-slate-500 font-bold hover:text-slate-800 transition-colors flex items-center gap-2 text-sm"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              {t('backToOptions')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPlantModal;
