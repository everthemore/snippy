import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../services/i18n';
import { db } from '../data/db';
import { Sparkles, ArrowRight, ArrowLeft, X } from 'lucide-react';

export default function FtuiGuide() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<number | null>(null);

  // Sync step from localStorage
  const syncStep = () => {
    const s = localStorage.getItem('snippy_ftui_step');
    if (s) {
      setStep(parseInt(s, 10));
    } else {
      const completed = localStorage.getItem('snippy_ftui_completed');
      if (!completed) {
        localStorage.setItem('snippy_ftui_step', '1');
        setStep(1);
      } else {
        setStep(null);
      }
    }
  };

  useEffect(() => {
    syncStep();
    window.addEventListener('ftuiStateChange', syncStep);
    window.addEventListener('storage', syncStep);
    
    // Custom events for inventory details modal
    const handleModalOpen = () => {
      const current = localStorage.getItem('snippy_ftui_step');
      if (current === '9') {
        updateStep(91);
      }
    };
    const handleModalClose = () => {
      const current = localStorage.getItem('snippy_ftui_step');
      if (current === '91') {
        updateStep(92);
      }
    };
    const handleGardenSwitch = () => {
      const current = localStorage.getItem('snippy_ftui_step');
      if (current === '3') {
        const activeGarden = db.getActiveGarden();
        if (activeGarden && activeGarden.address) {
          updateStep(4);
        }
      }
    };

    window.addEventListener('ftuiInfoModalOpen', handleModalOpen);
    window.addEventListener('ftuiInfoModalClose', handleModalClose);
    window.addEventListener('gardenSwitch', handleGardenSwitch);

    return () => {
      window.removeEventListener('ftuiStateChange', syncStep);
      window.removeEventListener('storage', syncStep);
      window.removeEventListener('ftuiInfoModalOpen', handleModalOpen);
      window.removeEventListener('ftuiInfoModalClose', handleModalClose);
      window.removeEventListener('gardenSwitch', handleGardenSwitch);
    };
  }, []);

  // Auto-progress triggers on route changes or address loaded
  useEffect(() => {
    if (step === 2 && location.pathname === '/map') {
      updateStep(3);
    } else if (step === 3) {
      const activeGarden = db.getActiveGarden();
      if (activeGarden && activeGarden.address) {
        updateStep(4);
      }
    } else if (step === 7 && location.pathname === '/calendar') {
      updateStep(8);
    } else if (step === 85 && location.pathname === '/inventory') {
      updateStep(9);
    } else if (step === 10 && location.pathname === '/settings') {
      updateStep(11);
    }
  }, [step, location.pathname]);

  const updateStep = (newStep: number | null) => {
    if (newStep === null || newStep <= 0) {
      localStorage.removeItem('snippy_ftui_step');
      localStorage.removeItem('snippy_ftui_added_plant_id');
      localStorage.setItem('snippy_ftui_completed', 'true');
      setStep(null);
    } else {
      localStorage.setItem('snippy_ftui_step', newStep.toString());
      setStep(newStep);
    }
    window.dispatchEvent(new Event('ftuiStateChange'));
  };

  if (step === null) return null;

  const handleNext = () => {
    if (step === 1) {
      updateStep(2);
    } else if (step === 2) {
      navigate('/map');
      updateStep(3);
    } else if (step === 3) {
      updateStep(4);
    } else if (step === 4) {
      // Manual next just in case
      updateStep(5);
    } else if (step === 5) {
      updateStep(6);
    } else if (step === 6) {
      updateStep(7);
    } else if (step === 7) {
      navigate('/calendar');
      updateStep(8);
    } else if (step === 8) {
      updateStep(85);
    } else if (step === 85) {
      navigate('/inventory');
      updateStep(9);
    } else if (step === 9) {
      updateStep(91);
    } else if (step === 91) {
      updateStep(92);
    } else if (step === 92) {
      navigate('/settings');
      updateStep(10);
    } else if (step === 10) {
      navigate('/settings');
      updateStep(11);
    } else if (step === 11) {
      updateStep(null);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      updateStep(1);
    } else if (step === 3) {
      navigate('/settings');
      updateStep(2);
    } else if (step === 4) {
      updateStep(3);
    } else if (step === 5) {
      updateStep(4);
    } else if (step === 6) {
      updateStep(5);
    } else if (step === 7) {
      updateStep(4); // Back to element placement
    } else if (step === 8) {
      navigate('/map');
      updateStep(7);
    } else if (step === 85) {
      updateStep(8);
    } else if (step === 9) {
      navigate('/calendar');
      updateStep(8);
    } else if (step === 91) {
      updateStep(9);
    } else if (step === 92) {
      updateStep(91);
    } else if (step === 10) {
      navigate('/inventory');
      updateStep(9);
    } else if (step === 11) {
      navigate('/settings');
      updateStep(10);
    }
  };

  // Translations matching step 1-11
  const getStepData = () => {
    const dataList = language === 'nl' ? [
      {
        stepNum: 1,
        title: "Welkom bij Snippy! 🌱",
        desc: "Laten we je snel op weg helpen met de basisfuncties van de app. In deze rondleiding leer je hoe je je tuin intekent, fruitbomen toevoegt, je plantenkaarten bekijkt en de snoeikalender gebruikt.",
        btn: "Start de rondleiding",
      },
      {
        stepNum: 2,
        title: "Stap 1: Ga naar de Tuinkaart 🗺️",
        desc: "Klik op het gehighlighte item 'Tuinkaart' in de zijbalk om naar de kaartweergave te gaan. De rest van de interface is tijdelijk geblokkeerd zodat je de weg makkelijk vindt.",
        btn: "Naar de Kaart",
      },
      {
        stepNum: 3,
        title: "Stap 2: Zoek je tuinadres 🏠",
        desc: "Vul linksboven onder '1. Tuin Adres' je adres in. Snippy haalt dan automatisch de officiële Kadaster-perceelgrenzen en eigenschappen op van PDOK! Zodra je een adres kiest, gaan we door.",
        btn: "Volgende stap",
      },
      {
        stepNum: 4,
        title: "Stap 3: Planten toevoegen 🔨",
        desc: "De knoppen voor grasveld en terras zijn nu tijdelijk uitgeschakeld. Klik op de knop 'Plant toevoegen' om het toevoegvenster te openen.",
        btn: "Volgende stap",
      },
      {
        stepNum: 5,
        title: "Stap 4: Selecteer toevoegmethode 🔍",
        desc: "Klik in het venster op de gehighlighte knop 'Zoeken op naam'. Andere toevoegmethodes zijn nu uitgeschakeld.",
        btn: "Volgende",
      },
      {
        stepNum: 6,
        title: "Stap 5: Zoek een Appelboom 🍎",
        desc: "Typ 'Appelboom' (of iets anders) in het zoekveld, kies een ras uit de lijst en klik op 'Kalender ophalen' om de boom toe te voegen.",
        btn: "Volgende",
      },
      {
        stepNum: 7,
        title: "Stap 6: Boom op de kaart! 🗺️",
        desc: "Je nieuwe boom is toegevoegd aan de interactieve 2D-kaart! Je kunt hem later verslepen om te positioneren. Laten we nu de Snoeikalender bekijken: klik op 'Kalender' in het zijmenu.",
        btn: "Naar Kalender",
      },
      {
        stepNum: 8,
        title: "Stap 7: De Snoeikalender bekijken 📅",
        desc: "Hier zie je de snoeikalender voor al je planten. De appelboom die je zojuist hebt toegevoegd staat in de lijst. Groene vakjes geven de optimale snoeimaanden aan. Bekijk de kalender rustig en klik op 'Volgende stap' om verder te gaan.",
        btn: "Volgende stap",
      },
      {
        stepNum: 85,
        title: "Stap 7a: Navigeer naar Planten 🌿",
        desc: "Laten we nu de plantenkaarten bekijken: klik op 'Planten' in het zijmenu om naar de inventaris te gaan.",
        btn: "Naar Planten",
      },
      {
        stepNum: 9,
        title: "Stap 8: Details bekijken ⓘ",
        desc: "Hier zie je je plantenkaart. Klik op het info-icoontje (ⓘ) op de gehighlighte kaart van je nieuwe boom om de snoeitips en retailers te bekijken.",
        btn: "Volgende",
      },
      {
        stepNum: 91,
        title: "Stap 8a: Info Modal 📄",
        desc: "Dit is de plantenkaart met AI-snoeiadvies en geschikte tools/voeding. Sluit nu dit venster door op het kruisje (✕) rechtsboven te klikken.",
        btn: "Volgende",
      },
      {
        stepNum: 92,
        title: "Stap 8b: Plant verwijderen 🗑️",
        desc: "Verwijder nu de zojuist toegevoegde boom door op het rode prullenbak-icoontje (🗑️) op de plantenkaart te klikken.",
        btn: "Naar Settings",
      },
      {
        stepNum: 10,
        title: "Stap 9: Instellingen ⚙️",
        desc: "Laten we tot slot de AI-instellingen bekijken. Klik op 'Instellingen' onderaan in het zijmenu.",
        btn: "Naar Instellingen",
      },
      {
        stepNum: 11,
        title: "Stap 10: AI-sleutel instellen 🔑",
        desc: "In de instellingen kun je 'Gemini Cloud' selecteren en je eigen API-sleutel invoeren om slim advies te activeren. Je kunt de rondleiding later altijd opnieuw starten vanaf deze instellingenpagina. Klik op 'Rondleiding afronden' om te finishen!",
        btn: "Rondleiding afronden",
      }
    ] : [
      {
        stepNum: 1,
        title: "Welcome to Snippy! 🌱",
        desc: "Let's get you started with the basics. In this tour you'll learn how to map your garden, add fruit trees, view plant cards, and check the pruning calendar.",
        btn: "Start the tour",
      },
      {
        stepNum: 2,
        title: "Step 1: Go to the Garden Map 🗺️",
        desc: "Click the highlighted 'Garden Map' link in the sidebar to navigate to the map view. Other inputs are blocked to guide you.",
        btn: "Go to Map",
      },
      {
        stepNum: 3,
        title: "Step 2: Find your address 🏠",
        desc: "Enter your address in the top-left sidebar under '1. Garden Address'. Snippy automatically fetches Kadaster boundaries, soil type, and sun orientation from PDOK! Once selected, we will advance.",
        btn: "Next step",
      },
      {
        stepNum: 4,
        title: "Step 3: Add Plants 🔨",
        desc: "Lawn and terrace buttons are disabled. Click 'Add Plant' now to open the creation modal.",
        btn: "Next step",
      },
      {
        stepNum: 5,
        title: "Step 4: Select method 🔍",
        desc: "Click 'Search by name' in the highlighted section. Other methods are disabled.",
        btn: "Next",
      },
      {
        stepNum: 6,
        title: "Step 5: Add an Apple Tree 🍎",
        desc: "Type 'Apple Tree' in the input, select a variety and click 'Get Schedule' to add it.",
        btn: "Next",
      },
      {
        stepNum: 7,
        title: "Step 6: Tree on the map! 🗺️",
        desc: "Your new tree is placed on the SVG map. You can drag to position it later. Let's check the Pruning Calendar: click 'Calendar' in the sidebar.",
        btn: "Go to Calendar",
      },
      {
        stepNum: 8,
        title: "Step 7: View Pruning Calendar 📅",
        desc: "Here you can see the pruning calendar for your plants. The apple tree you just added is listed here. Green blocks show the optimal pruning months. Take a look and click 'Next step' to continue.",
        btn: "Next step",
      },
      {
        stepNum: 85,
        title: "Step 7a: Go to Plants 🌿",
        desc: "Let's inspect the plant cards: click 'Plants' in the sidebar to go to the inventory.",
        btn: "Go to Plants",
      },
      {
        stepNum: 9,
        title: "Step 8: View details ⓘ",
        desc: "Click the info icon (ⓘ) on the highlighted tree card to view its card data.",
        btn: "Next",
      },
      {
        stepNum: 91,
        title: "Step 8a: Info Modal 📄",
        desc: "Here is your plant card and AI advice. Close this modal by clicking the close (✕) button in the top-right corner.",
        btn: "Next",
      },
      {
        stepNum: 92,
        title: "Step 8b: Remove Plant 🗑️",
        desc: "Remove the tree you just added by clicking the red trash delete button on its card.",
        btn: "Go to Settings",
      },
      {
        stepNum: 10,
        title: "Step 9: Settings ⚙️",
        desc: "Let's check settings: click 'Settings' at the bottom of the sidebar.",
        btn: "Go to Settings",
      },
      {
        stepNum: 11,
        title: "Step 10: Configure API Key 🔑",
        desc: "Finally, select 'Gemini Cloud' and enter your API key to activate AI advice. You can always restart the tour later from this settings page. Click 'Finish Tour' to complete!",
        btn: "Finish Tour",
      }
    ];

    return dataList.find(d => d.stepNum === step) || dataList[0];
  };

  const currentData = getStepData();

  // Steps that require blocking backdrop
  const isBlockingStep = [2, 3, 4, 5, 6, 7, 8, 85, 9, 91, 92, 10, 11].includes(step);

  const getStepLabel = () => {
    if (step === 91) return language === 'nl' ? 'Stap 8a van 10' : 'Step 8a of 10';
    if (step === 92) return language === 'nl' ? 'Stap 8b van 10' : 'Step 8b of 10';
    if (step === 85) return language === 'nl' ? 'Stap 7a van 10' : 'Step 7a of 10';
    
    // For normal steps:
    // step 2 -> Stap 1
    // step 3 -> Stap 2
    // ...
    // step 11 -> Stap 10
    const num = step >= 10 ? step - 1 : step - 1;
    return language === 'nl' ? `Stap ${num} van 10` : `Step ${num} of 10`;
  };

  return (
    <>
      {/* Blocking Backdrop Overlay */}
      {isBlockingStep && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-[9998] pointer-events-auto animate-in fade-in duration-200" />
      )}

      {step === 1 ? (
        // Welcome Modal Overlay
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">{currentData.title}</h2>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed font-medium">{currentData.desc}</p>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-99 flex items-center justify-center gap-2"
            >
              <span>{currentData.btn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateStep(null)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-semibold font-bold"
            >
              {language === 'nl' ? 'Skip rondleiding' : 'Skip tour'}
            </button>
          </div>
        </div>
      ) : (
        // Floating Guide Card in bottom right corner
        <div className="fixed bottom-6 right-6 max-w-sm w-full bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 z-[9999] flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>{language === 'nl' ? `Rondleiding: ${getStepLabel()}` : `Onboarding: ${getStepLabel()}`}</span>
            </div>
            <button
              onClick={() => updateStep(null)}
              className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
              title={language === 'nl' ? 'Stop rondleiding' : 'Stop tour'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h4 className="text-base font-bold text-white leading-snug">{currentData.title}</h4>
            <p className="text-slate-300 text-xs mt-1.5 leading-relaxed font-medium">{currentData.desc}</p>
          </div>

          <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-800">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-white transition-colors font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'nl' ? 'Vorige' : 'Back'}</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-extrabold"
            >
              <span>{currentData.btn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
