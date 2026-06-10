import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Sparkles, Key, CheckCircle, ExternalLink, Languages, Laptop, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../services/i18n';
import { aiProvider } from '../services/aiProvider';
import type { AIProviderType } from '../services/aiProvider';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<AIProviderType>(() => aiProvider.getProviderType());
  const [apiKey, setApiKey] = useState(() => aiProvider.getGeminiApiKey());
  const [customBaseUrl, setCustomBaseUrl] = useState(() => aiProvider.getCustomApiBaseUrl());
  const [customModel, setCustomModel] = useState(() => aiProvider.getCustomApiModel());
  const [customApiKey, setCustomApiKey] = useState(() => aiProvider.getCustomApiKey());
  const [showSavedToast, setShowSavedToast] = useState(false);
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

  const handleSave = () => {
    aiProvider.setProviderType(provider);
    aiProvider.setGeminiApiKey(apiKey);
    aiProvider.setCustomApiBaseUrl(customBaseUrl);
    aiProvider.setCustomApiModel(customModel);
    aiProvider.setCustomApiKey(customApiKey);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-6 h-6" />
          <span className="font-bold">{t('settingsSaved')}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4">
          <SettingsIcon className="w-10 h-10 text-emerald-600 animate-spin-slow" />
          {t('settingsHeader')}
        </h1>
        <p className="text-slate-500 mt-2">{t('settingsSubtitle')}</p>
      </div>

      <div className="space-y-8">
        {/* Language Selection Card */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-6">
            <Languages className="w-6 h-6 text-emerald-500" />
            <span>Taal / Language</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setLanguage('nl')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                language === 'nl'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Nederlands</span>
                {language === 'nl' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
              </div>
              <p className="text-xs text-slate-500">De gehele applicatie en snoei-adviezen in het Nederlands.</p>
            </button>

            <button
              onClick={() => setLanguage('en')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                language === 'en'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">English</span>
                {language === 'en' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
              </div>
              <p className="text-xs text-slate-500">The entire application interface and trimming advice in English.</p>
            </button>
          </div>
        </div>

        {/* AI Model / Engine Card */}
        <div className={`bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 ${
          ftuiStep === 11 ? 'relative z-[9999] ring-4 ring-emerald-500 shadow-2xl scale-102 transition-transform' : ''
        }`}>
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-500" />
              <span>{t('aiProviderLabel')}</span>
            </h3>
            <p className="text-sm text-slate-500 mt-1">{t('aiProviderDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Local WebLLM */}
            <button
              onClick={() => setProvider('local')}
              className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-48 ${
                provider === 'local'
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${provider === 'local' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Laptop className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs leading-tight">{t('localProviderName')}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">{t('localProviderDesc')}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded w-fit">
                <Shield className="w-3 h-3" />
                100% Privé
              </div>
            </button>

            {/* Gemini Cloud */}
            <button
              onClick={() => setProvider('gemini')}
              className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-48 ${
                provider === 'gemini'
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${provider === 'gemini' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs leading-tight">{t('geminiProviderName')}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">{t('geminiProviderDesc')}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-bold text-indigo-700 bg-indigo-100/50 px-2 py-0.5 rounded w-fit">
                <Sparkles className="w-3 h-3" />
                Fruitbomen
              </div>
            </button>

            {/* Custom API */}
            <button
              onClick={() => setProvider('custom')}
              className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-48 ${
                provider === 'custom'
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${provider === 'custom' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Network className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs leading-tight">{t('customApiSettings')}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">{t('customApiDesc')}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-bold text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded w-fit">
                <Network className="w-3 h-3" />
                DeepSeek / Grok / etc.
              </div>
            </button>
          </div>

          {/* Gemini API Key Configuration */}
          {provider === 'gemini' && (
            <div className="pt-6 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-400" />
                {t('geminiApiKeyLabel')}
              </label>
              
              <input
                type="password"
                placeholder={t('geminiApiKeyPlaceholder')}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm"
              />

              {import.meta.env.VITE_GEMINI_API_KEY && !localStorage.getItem('snippy_gemini_api_key') && (
                <p className="text-xs text-emerald-600 font-bold mt-1">
                  {language === 'nl' ? '✓ Geladen uit lokaal milieubestand (.env)' : '✓ Loaded from local environment (.env)'}
                </p>
              )}
              
              {import.meta.env.VITE_AI_PROVIDER === 'gemini' && !localStorage.getItem('snippy_ai_provider') && (
                <p className="text-xs text-slate-400 font-medium">
                  {language === 'nl' ? 'Provider standaard ingesteld via .env' : 'Provider defaulted via .env'}
                </p>
              )}

              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors group mt-1"
              >
                {t('getApiKeyLink')}
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          )}

          {/* Custom OpenAI-Compatible API Configuration */}
          {provider === 'custom' && (
            <div className="pt-6 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {t('customApiBaseUrl')}
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.deepseek.com/v1"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  />
                  {import.meta.env.VITE_CUSTOM_API_BASE_URL && !localStorage.getItem('snippy_custom_api_base_url') && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">
                      {language === 'nl' ? '✓ Geladen uit .env' : '✓ Loaded from .env'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {t('customApiModel')}
                  </label>
                  <input
                    type="text"
                    placeholder="deepseek-chat"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-mono"
                  />
                  {import.meta.env.VITE_CUSTOM_API_MODEL && !localStorage.getItem('snippy_custom_api_model') && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">
                      {language === 'nl' ? '✓ Geladen uit .env' : '✓ Loaded from .env'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  {t('customApiKey')}
                </label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm"
                />
                {import.meta.env.VITE_CUSTOM_API_KEY && !localStorage.getItem('snippy_custom_api_key') && (
                  <p className="text-xs text-emerald-600 font-bold mt-1">
                    {language === 'nl' ? '✓ Sleutel geladen uit .env' : '✓ Key loaded from .env'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Onboarding Tour Card */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
            <span>{language === 'nl' ? 'Rondleiding / Onboarding' : 'Introduction Tour'}</span>
          </h3>
          <p className="text-sm text-slate-500">
            {language === 'nl'
              ? 'Start de interactieve rondleiding om te leren hoe je Snippy gebruikt, inclusief het intekenen van je tuin en het toevoegen van planten.'
              : 'Start the interactive tour to learn how to use Snippy, including mapping your garden and adding plants.'}
          </p>
          <button
            onClick={() => {
              localStorage.setItem('snippy_ftui_step', '1');
              window.dispatchEvent(new Event('ftuiStateChange'));
              navigate('/map');
            }}
            className="px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl border border-emerald-250 transition-colors"
          >
            {language === 'nl' ? 'Rondleiding starten' : 'Start Tour'}
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all active:scale-99"
        >
          {t('saveSettings')}
        </button>
      </div>
    </div>
  );
}
