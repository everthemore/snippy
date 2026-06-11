import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Leaf, Calendar as CalendarIcon, Zap, Map as MapIcon, Settings as SettingsIcon, Languages, User } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Calendar from './pages/Calendar';
import Analysis from './pages/Analysis';
import Map from './pages/Map';
import Settings from './pages/Settings';
import AuthGate from './components/AuthGate';
import ProfileModal from './components/ProfileModal';
import FtuiGuide from './components/FtuiGuide';
import { useLanguage } from './services/i18n';
import { db } from './data/db';
import type { UserSession } from './types/garden';

function AppContent() {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
    setSession(db.getSession());
  }, []);

  const handleRefresh = () => {
    setSession(db.getSession());
  };

  return (
    <AuthGate onLoginStateChange={handleRefresh}>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        {(() => {
          const isSidebarTourActive = ftuiStep !== null && [2, 7, 85, 10].includes(ftuiStep);

          const getLinkClass = (targetStep: number) => {
            const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group";
            if (ftuiStep === targetStep) {
              return `${baseClass} relative z-[9999] bg-emerald-50 text-emerald-700 ring-4 ring-emerald-450 border border-emerald-500 shadow-lg scale-102 animate-pulse pointer-events-auto`;
            }
            if (isSidebarTourActive) {
              return `${baseClass} text-slate-600 opacity-30 pointer-events-none`;
            }
            return `${baseClass} text-slate-600 hover:bg-emerald-50 hover:text-emerald-700`;
          };

          return (
            <nav className={`w-64 bg-white border-r border-slate-200 lg:flex hidden flex-col fixed h-full justify-between transition-all ${
              isSidebarTourActive ? 'z-[9999]' : 'z-[60]'
            }`}>
              <div>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                    <Leaf className="w-8 h-8 text-emerald-500" />
                    <span>Snippy</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">{t('logoSubtitle')}</p>
                </div>
                
                <div className="px-4 space-y-2 mt-4">
                  <Link 
                    to="/" 
                    className={isSidebarTourActive ? 'flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl transition-all duration-200 group opacity-30 pointer-events-none' : 'flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all duration-200 group'}
                  >
                    <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{t('dashboard')}</span>
                  </Link>
                  <Link 
                    to="/inventory" 
                    className={getLinkClass(85)}
                  >
                    <Leaf className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{t('inventory')}</span>
                  </Link>
                  <Link 
                    to="/calendar" 
                    className={getLinkClass(7)}
                  >
                    <CalendarIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{t('calendar')}</span>
                  </Link>
                  <Link 
                    to="/analysis" 
                    className={isSidebarTourActive ? 'flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl transition-all duration-200 group opacity-30 pointer-events-none' : 'flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all duration-200 group'}
                  >
                    <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{t('analysis')}</span>
                  </Link>
                  <Link 
                    to="/map" 
                    className={getLinkClass(2)}
                  >
                    <MapIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{t('gardenMap')}</span>
                  </Link>
                </div>
              </div>

              <div>
                {session && (
                  <div 
                    onClick={() => {
                      if (!isSidebarTourActive) setIsProfileOpen(true);
                    }}
                    className={`mx-4 mb-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 transition-all duration-200 ${
                      isSidebarTourActive ? 'opacity-30 pointer-events-none' : 'cursor-pointer hover:border-slate-200 hover:bg-slate-100/50'
                    }`}
                  >
                    {session.avatarUrl ? (
                      <img src={session.avatarUrl} alt={session.name} className="w-8 h-8 rounded-lg bg-emerald-50 object-cover border border-emerald-100 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-grow">
                      <p className="text-xs font-bold text-slate-700 truncate leading-tight">{session.name}</p>
                      <p className="text-[9px] font-medium text-slate-400 truncate mt-0.5 leading-none">{session.email}</p>
                    </div>
                  </div>
                )}

                {/* Language Switcher */}
                <div className={`px-6 py-4 border-t border-slate-100 flex items-center justify-between transition-all ${
                  isSidebarTourActive ? 'opacity-30 pointer-events-none' : ''
                }`}>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5" />
                    Taal / Lang
                  </span>
                  <div className="bg-slate-100 p-0.5 rounded-lg flex items-center relative">
                    <button 
                      onClick={() => setLanguage('nl')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all active:scale-95 ${language === 'nl' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      NL
                    </button>
                    <button 
                      onClick={() => setLanguage('en')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all active:scale-95 ${language === 'en' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100">
                  <Link 
                    to="/settings" 
                    className={getLinkClass(10)}
                  >
                    <SettingsIcon className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    <span className="font-medium">{t('settings')}</span>
                  </Link>
                </div>
              </div>
            </nav>
          );
        })()}

        {/* Mobile/Tablet Top Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-[60] shadow-sm">
          <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-500" />
            <span>Snippy</span>
          </h1>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const nextLang = language === 'nl' ? 'en' : 'nl';
                setLanguage(nextLang);
              }}
              className="text-xs font-black text-slate-400 bg-slate-100 hover:bg-slate-205 px-2.5 py-1.5 rounded-lg transition-colors font-sans"
            >
              {language === 'nl' ? 'EN' : 'NL'}
            </button>
            
            <Link 
              to="/settings" 
              className={`p-2 text-slate-500 hover:text-slate-800 transition-colors rounded-lg ${location.pathname === '/settings' ? 'text-emerald-600 bg-emerald-50' : ''}`}
              title={t('settings')}
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
            
            {session && (
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="w-8 h-8 rounded-full border border-emerald-100 overflow-hidden shrink-0"
              >
                {session.avatarUrl ? (
                  <img src={session.avatarUrl} alt={session.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Mobile/Tablet Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-2 z-[60] shadow-lg">
          <Link 
            to="/" 
            className={`flex flex-col items-center gap-0.5 text-slate-500 hover:text-emerald-650 ${location.pathname === '/' ? 'text-emerald-600 font-extrabold' : ''}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-bold">{t('dashboard')}</span>
          </Link>
          <Link 
            to="/map" 
            className={`flex flex-col items-center gap-0.5 text-slate-500 hover:text-emerald-650 ${location.pathname === '/map' ? 'text-emerald-600 font-extrabold' : ''}`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[9px] font-bold">{t('gardenMap')}</span>
          </Link>
          <Link 
            to="/inventory" 
            className={`flex flex-col items-center gap-0.5 text-slate-500 hover:text-emerald-650 ${location.pathname === '/inventory' ? 'text-emerald-600 font-extrabold' : ''}`}
          >
            <Leaf className="w-5 h-5" />
            <span className="text-[9px] font-bold">{t('inventory')}</span>
          </Link>
          <Link 
            to="/calendar" 
            className={`flex flex-col items-center gap-0.5 text-slate-500 hover:text-emerald-650 ${location.pathname === '/calendar' ? 'text-emerald-600 font-extrabold' : ''}`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[9px] font-bold">{t('calendar')}</span>
          </Link>
          <Link 
            to="/analysis" 
            className={`flex flex-col items-center gap-0.5 text-slate-500 hover:text-emerald-650 ${location.pathname === '/analysis' ? 'text-emerald-600 font-extrabold' : ''}`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[9px] font-bold">{language === 'nl' ? 'Analyse' : 'Analysis'}</span>
          </Link>
        </nav>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 mt-16 pb-20 lg:mt-0 lg:pb-0 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/map" element={<Map />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onLogout={handleRefresh}
          onGardenSwitch={handleRefresh}
        />

        <FtuiGuide />
      </div>
    </AuthGate>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
