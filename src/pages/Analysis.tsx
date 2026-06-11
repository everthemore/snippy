import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap, Loader2, Wind, Sparkles, MessageSquare, Check, Mountain, Sun, Landmark } from 'lucide-react';
import PhotoUpload from '../components/PhotoUpload';
import { aiProvider } from '../services/aiProvider';
import { db } from '../data/db';
import type { GardenPlant, Plant } from '../types/garden';
import { useLanguage } from '../services/i18n';

export default function AnalysisPage() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const plantIdParam = searchParams.get('plantId');

  const [gardenPlants, setGardenPlants] = useState<GardenPlant[]>([]);
  const [selectedGardenPlant, setSelectedGardenPlant] = useState<GardenPlant | null>(null);
  const [plantDetails, setPlantDetails] = useState<Plant | null>(null);

  // User input states
  const [question, setQuestion] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Status states
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState('');
  const [adviceResponse, setAdviceResponse] = useState<string | null>(null);

  // Load garden plants
  useEffect(() => {
    const loadPlants = () => {
      const plants = db.getGardenPlants();
      setGardenPlants(plants);
      
      // Auto-select plant if provided in URL parameter
      if (plantIdParam) {
        const gp = plants.find(p => p.id === plantIdParam);
        if (gp) {
          setSelectedGardenPlant(gp);
          const details = db.getPlantDetails(gp.plantId);
          if (details) setPlantDetails(details);
        }
      } else if (plants.length > 0) {
        // Default select the first one
        const gp = plants[0];
        setSelectedGardenPlant(gp);
        const details = db.getPlantDetails(gp.plantId);
        if (details) setPlantDetails(details);
      } else {
        setSelectedGardenPlant(null);
        setPlantDetails(null);
      }
    };

    loadPlants();
    window.addEventListener('gardenSwitch', loadPlants);
    return () => window.removeEventListener('gardenSwitch', loadPlants);
  }, [plantIdParam]);

  const handlePlantSelect = (id: string) => {
    const gp = gardenPlants.find(p => p.id === id);
    if (gp) {
      setSelectedGardenPlant(gp);
      const details = db.getPlantDetails(gp.plantId);
      setPlantDetails(details || null);
      setAdviceResponse(null); // Clear old advice response
    }
  };

  const handlePhotoUpload = (file: File) => {
    setImageFile(file);
  };

  const handleGetAdvice = async () => {
    if (!selectedGardenPlant || !plantDetails || !question.trim()) return;

    setIsGenerating(true);
    setAdviceResponse(null);
    setAiProgress(language === 'nl' ? "Sleutel ophalen..." : "Retrieving settings...");

    try {
      const response = await aiProvider.askAdviceForPlant(
        plantDetails,
        selectedGardenPlant,
        question,
        imageFile || undefined,
        (progress) => setAiProgress(progress)
      );
      setAdviceResponse(response);
    } catch (e: any) {
      console.error(e);
      setAdviceResponse(language === 'nl' 
        ? `### Fout bij genereren\n\nEr is een probleem opgetreden tijdens het ophalen van het AI-advies. Controleer je API-instellingen en netwerkverbinding.` 
        : `### Generation Error\n\nFailed to retrieve AI advice. Please verify your API settings and connection.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to parse bold and links in inline text
  const parseInlineMarkdown = (lineText: string) => {
    // Match either bold (**text**) or links ([text](url))
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    const parts = lineText.split(regex);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-slate-800">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const closeBracketIdx = part.indexOf('](');
        const linkText = part.slice(1, closeBracketIdx);
        const url = part.slice(closeBracketIdx + 2, -1);
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-bold underline transition-colors"
          >
            {linkText}
          </a>
        );
      }
      return part;
    });
  };

  // Helper to format response markdown text
  const formatAdviceResponse = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('###')) {
        return <h4 key={idx} className="text-base font-bold text-slate-800 mt-4 mb-2">{cleanLine.replace('###', '').trim()}</h4>;
      }
      if (cleanLine.startsWith('##')) {
        return <h3 key={idx} className="text-lg font-extrabold text-slate-900 mt-6 mb-3 border-b border-slate-100 pb-1.5">{cleanLine.replace('##', '').trim()}</h3>;
      }
      if (cleanLine.startsWith('#')) {
        return <h2 key={idx} className="text-xl font-black text-slate-900 mt-8 mb-4">{cleanLine.replace('#', '').trim()}</h2>;
      }
      if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
        const itemContent = cleanLine.substring(1).trim();
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-slate-600 mb-1.5 leading-relaxed">
            {parseInlineMarkdown(itemContent)}
          </li>
        );
      }
      if (cleanLine === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm text-slate-600 leading-relaxed mb-2">
          {parseInlineMarkdown(cleanLine)}
        </p>
      );
    });
  };

  if (gardenPlants.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center py-24">
        <Zap className="w-16 h-16 mx-auto mb-4 text-slate-200" />
        <h2 className="text-2xl font-bold text-slate-700">{t('doctorAdviceHeader')}</h2>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">{t('doctorNoPlants')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4">
            <Zap className="w-10 h-10 text-emerald-600 animate-pulse" />
            {t('doctorAdviceHeader')}
          </h1>
          <p className="text-slate-500 mt-2">{t('doctorAdviceDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Select Plant & Upload Context */}
        <div className="space-y-8">
          {/* Step 1: Selection */}
          <section className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 text-sm">1</span>
              {t('doctorSelectPlant')}
            </h3>

            <select
              value={selectedGardenPlant?.id || ''}
              onChange={(e) => handlePlantSelect(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-700"
            >
              {gardenPlants.map(gp => {
                const details = db.getPlantDetails(gp.plantId);
                return (
                  <option key={gp.id} value={gp.id}>
                    {gp.nickname || details?.commonName || 'Plant'} ({details?.latinName})
                  </option>
                );
              })}
            </select>

            {/* Microclimate profile details of selected plant */}
            {selectedGardenPlant && plantDetails && (() => {
              const graftedType = selectedGardenPlant.graftedType || 'single';
              const graftedVarieties = selectedGardenPlant.graftedVarieties || [];
              const pruningForm = selectedGardenPlant.pruningForm || 'standard';
              const sunlight = selectedGardenPlant.sunlight || 'full_sun';
              const soilType = selectedGardenPlant.soilType || 'sand';
              const windExposure = selectedGardenPlant.windExposure || 'sheltered';
              const proximityToWalls = selectedGardenPlant.proximityToWalls || 'none';

              return (
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('microclimateLabel')}</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-150 rounded-xl shadow-sm">
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t('sunlightLabel')}</span>
                        <span className="text-xs font-bold text-slate-700 capitalize">
                          {t(`sunlight${sunlight === 'full_sun' ? 'Full' : sunlight === 'partial_shade' ? 'Partial' : 'Shade'}` as any)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-150 rounded-xl shadow-sm">
                      <Mountain className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t('soilLabel')}</span>
                        <span className="text-xs font-bold text-slate-700 capitalize">
                          {t(`soil${soilType.charAt(0).toUpperCase() + soilType.slice(1)}` as any)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-150 rounded-xl shadow-sm">
                      <Wind className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t('windLabel')}</span>
                        <span className="text-xs font-bold text-slate-700 capitalize">
                          {t(windExposure === 'exposed' ? 'windExposed' : 'windSheltered')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-150 rounded-xl shadow-sm">
                      <Landmark className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t('wallLabel')}</span>
                        <span className="text-xs font-bold text-slate-700 capitalize">
                          {t(proximityToWalls === 'south_wall' ? 'wallSouth' : proximityToWalls === 'other_wall' ? 'wallOther' : 'wallNone')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {graftedType !== 'single' && (
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-800 font-bold">
                      {t('graftedVarietiesLabel')}: {graftedVarieties.join(', ')}
                    </div>
                  )}
                  {pruningForm !== 'standard' && (
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-bold">
                      {t('pruningFormLabel')}: {t(pruningForm === 'espalier' ? 'formEspalier' : pruningForm === 'dwarf' ? 'formDwarf' : 'formColumnar')}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {/* Step 2: Photo Upload & Question */}
          <section className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 text-sm">2</span>
              {language === 'nl' ? 'Upload Foto & Stel Vraag' : 'Attach Photo & Ask'}
            </h3>

            <div>
              <PhotoUpload onUpload={handlePhotoUpload} label={language === 'nl' ? 'Maak/selecteer foto' : 'Take or upload photo'} />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                {language === 'nl' ? 'Stel je vraag aan de AI-dokter' : 'Type your question'}
              </label>
              <textarea
                rows={3}
                placeholder={t('doctorQuestionPlaceholder')}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 text-sm"
              />
            </div>

            <button
              onClick={handleGetAdvice}
              disabled={!question.trim() || isGenerating}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-99 flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {t('doctorSubmit')}
            </button>
          </section>
        </div>

        {/* Right Column: AI Response */}
        <div>
          {isGenerating ? (
            <div className="h-full bg-slate-50 rounded-[32px] sm:rounded-[40px] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 sm:p-12 text-center min-h-[400px]">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500/20 animate-ping rounded-full scale-150" />
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin relative z-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{language === 'nl' ? 'Consult aanvragen...' : 'Consulting expert...'}</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm">{aiProgress}</p>
            </div>
          ) : adviceResponse ? (
            <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-sm space-y-6 min-h-[400px]">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Check className="w-6 h-6 text-emerald-500 bg-emerald-50 p-1 rounded-full" />
                  {language === 'nl' ? 'Snoei & Gezondheidsadvies' : 'Medical Trimming advice'}
                </h3>
              </div>

              <div className="prose max-w-none">
                {formatAdviceResponse(adviceResponse)}
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 rounded-[32px] sm:rounded-[40px] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 sm:p-12 text-center text-slate-300 min-h-[400px]">
              <Zap className="w-16 h-16 mb-4 opacity-20 text-slate-400" />
              <p className="font-bold text-lg text-slate-400">{language === 'nl' ? 'Wacht op vraag' : 'Waiting for question'}</p>
              <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
                {language === 'nl' 
                  ? 'Stel een vraag op het linkerscherm om persoonlijk botanisch advies te ontvangen.'
                  : 'Ask a question on the left to receive expert custom advice.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
