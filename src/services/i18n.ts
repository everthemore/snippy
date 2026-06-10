import { useState, useEffect } from 'react';

export type Language = 'en' | 'nl';

const translations = {
  en: {
    // Navigation / Sidebar
    dashboard: "Dashboard",
    inventory: "Inventory",
    calendar: "Calendar",
    analysis: "Plant Analysis",
    gardenMap: "Garden Map",
    settings: "Settings",
    logoSubtitle: "Garden Trimming",

    // Dashboard
    welcomeHeader: "Welcome back, Gardener",
    welcomeSubtitle: "Here is what is happening in your garden today.",
    plantsInGarden: "Plants in Garden",
    tasksThisMonth: "Tasks This Month",
    healthStatus: "Health Status",
    manageInventory: "Je Planten", // Je Planten/Plantenverzameling
    manageInventoryDesc: "Manage your garden collection",
    pendingTasks: "{count} tasks pending this month",
    pendingTasksNone: "No tasks pending this month",
    microclimateInsightTitle: "Smart Microclimate Insight",
    microclimateInsightText: "We detected a 20% heat retention increase in your north-west sector due to the brick wall. Consider pruning your Lavenders 10 days earlier than planned.",
    viewAnalysis: "View Analysis",

    // Inventory
    inventoryHeader: "Plant Inventory",
    inventorySubtitle: "Manage and track the health of your garden collection.",
    addNewPlant: "Add New Plant",
    searchGardenPlaceholder: "Search your garden...",
    filters: "Filters",
    lastTrimmed: "Last trimmed: {date}",
    lastTrimmedNever: "Never",
    confirmDelete: "Are you sure you want to remove {name}?",

    // Add Plant Modal
    addNewPlantModal: "Add New Plant",
    howToAdd: "How would you like to add your plant?",
    searchByName: "Search by Name",
    searchByNameDesc: "Type common or Latin name",
    scanPlantCard: "Scan Plant Card",
    scanPlantCardDesc: "Scan plant details via photo",
    ocrCardDesc: "OCR details from garden center card",
    identifyPhoto: "Identify by Photo",
    identifyPhotoDesc: "Use image recognition to find species",
    searchPlaceholder: "e.g. Lavender, Buxus, Apricot...",
    liveSuggestions: "Live Suggestions",
    getSchedule: "Get Schedule",
    cantFindWhatYouNeed: "Can't find what you need?",
    createCustomSchedule: "Create custom trimming matrix for \"{query}\"",
    analyzingProfile: "Analyzing botanical profile...",
    consultingGuides: "Consulting botanical guides...",
    matchFound: "Match Found!",
    confirmAdd: "Confirm & Add to Garden",
    backToOptions: "Back to options",
    loadingEngine: "Accessing botanical libraries...",
    unableToFetch: "Unable to fetch plant data. Please try again.",

    // Calendar
    trimmingCalendar: "Trimming Calendar",
    calendarSubtitle: "Your 12-month guide to optimal garden maintenance.",
    currentMonth: "Current Month: {month}",
    contextualAnalysisTitle: "Contextual Plant Analysis", 
    contextualAnalysisDesc: "Did you know that a south-facing wall can shift your trimming schedule by up to 2 weeks?",
    analyzeMyGarden: "Analyze My Garden",

    // Settings
    settingsHeader: "Configuration Panel",
    settingsSubtitle: "Customize your language, AI models, and botanical engines.",
    aiProviderLabel: "Botanical Engine Provider",
    aiProviderDesc: "Choose between running fully private offline intelligence or accessing deep botanical cloud knowledge.",
    localProviderName: "Local Botanical Engine (Offline & Free)",
    localProviderDesc: "Runs 100% locally in your browser cache. Great for privacy and offline usage.",
    geminiProviderName: "Advanced Cloud Engine (Google Gemini)",
    geminiProviderDesc: "Unlocks highly accurate, elite botanical knowledge. Perfect for specific fruit trees or rare plants. Requires a free key.",
    geminiApiKeyLabel: "Gemini API Key",
    geminiApiKeyPlaceholder: "Enter your Gemini API Key...",
    getApiKeyLink: "Get a free API Key from Google AI Studio (takes 10 seconds)",
    saveSettings: "Save Settings",
    settingsSaved: "Configuration saved successfully!",

    // New translation keys
    graftedSingle: "Single",
    graftedDuo: "Duo (2 varieties)",
    graftedTrio: "Trio (3 varieties)",
    graftedVarietiesLabel: "Grafted Varieties",
    graftName: "Variety {num}",
    formStandard: "Standard",
    formEspalier: "Espalier (Lei)",
    formDwarf: "Dwarf (Dwerg)",
    formColumnar: "Columnar (Zuil)",
    sunlightLabel: "Sunlight Exposure",
    sunlightFull: "Full Sun",
    sunlightPartial: "Partial Shade",
    sunlightShade: "Full Shade",
    soilLabel: "Soil Type",
    soilClay: "Clay",
    soilSand: "Sand",
    soilLoam: "Loam",
    soilPeat: "Peat",
    windLabel: "Wind Exposure",
    windSheltered: "Sheltered",
    windExposed: "Exposed to wind",
    wallLabel: "Proximity to Walls",
    wallNone: "Free standing",
    wallSouth: "South-facing wall",
    wallOther: "Other wall",
    graftingLabel: "Grafting Type",
    pruningFormLabel: "Pruning / Growth Form",
    microclimateLabel: "Microclimate & Soil",
    customApiSettings: "Custom OpenAI-Compatible API",
    customApiBaseUrl: "API Base URL",
    customApiModel: "Model ID",
    customApiKey: "API Key",
    customApiDesc: "Use custom endpoints like DeepSeek, Grok, or OpenRouter for testing.",
    doctorAdviceHeader: "Plant Analysis",
    doctorAdviceDesc: "Ask questions about your plants. AI uses its location, soil, sun, wind, and training form to answer.",
    doctorQuestionPlaceholder: "Ask something, e.g. Why are my leaves yellowing? How should I prune the young shoots?",
    doctorSubmit: "Get Expert Advice",
    doctorSelectPlant: "Select Plant",
    doctorNoPlants: "Please add a plant to your garden first."
  },
  nl: {
    // Navigation / Sidebar
    dashboard: "Dashboard",
    inventory: "Planten",
    calendar: "Kalender",
    analysis: "Plant analyse",
    gardenMap: "Tuinkaart",
    settings: "Instellingen",
    logoSubtitle: "Snoei & Onderhoud",

    // Dashboard
    welcomeHeader: "Welkom terug, Tuinier",
    welcomeSubtitle: "Dit gebeurt er vandaag in je tuin.",
    plantsInGarden: "Planten in tuin",
    tasksThisMonth: "Taken deze maand",
    healthStatus: "Gezondheid",
    manageInventory: "Je Planten",
    manageInventoryDesc: "Beheer je plantenverzameling",
    pendingTasks: "{count} openstaande snoeitaken",
    pendingTasksNone: "Geen snoeitaken deze maand",
    microclimateInsightTitle: "Slimme Microklimaat Analyse",
    microclimateInsightText: "We hebben een verhoogde warmtevasthouding van 20% gedetecteerd in de noordwestelijke sector door de bakstenen muur. Overweeg je Lavendel 10 dagen eerder te snoeien dan gepland.",
    viewAnalysis: "Bekijk Analyse",

    // Inventory
    inventoryHeader: "Planteninventaris",
    inventorySubtitle: "Beheer en volg de gezondheid van je plantenverzameling.",
    addNewPlant: "Nieuwe plant toevoegen",
    searchGardenPlaceholder: "Zoeken in je tuin...",
    filters: "Filters",
    lastTrimmed: "Laatst gesnoeid: {date}",
    lastTrimmedNever: "Nooit",
    confirmDelete: "Weet je zeker dat je {name} wilt verwijderen?",

    // Add Plant Modal
    addNewPlantModal: "Nieuwe plant toevoegen",
    howToAdd: "Hoe wil je je plant toevoegen?",
    searchByName: "Zoeken op naam",
    searchByNameDesc: "Typ de Nederlandse of Latijnse naam",
    scanPlantCard: "Plantenkaart scannen",
    scanPlantCardDesc: "Gegevens scannen via foto",
    ocrCardDesc: "OCR gegevens scannen van de plantenkaart",
    identifyPhoto: "Identificeren via foto",
    identifyPhotoDesc: "Gebruik beeldherkenning om de soort te bepalen",
    searchPlaceholder: "bijv. Lavendel, Buxus, Amandel...",
    liveSuggestions: "Live Suggesties",
    getSchedule: "Kalender ophalen",
    cantFindWhatYouNeed: "Niet gevonden wat je zoekt?",
    createCustomSchedule: "Aangepaste kalender genereren voor \"{query}\"",
    analyzingProfile: "Botanisch profiel analyseren...",
    consultingGuides: "Botanische gidsen raadplegen...",
    matchFound: "Overeenkomst gevonden!",
    confirmAdd: "Bevestigen & toevoegen aan tuin",
    backToOptions: "Terug naar opties",
    loadingEngine: "Botanische gidsen raadplegen...",
    unableToFetch: "Kan plantgegevens niet ophalen. Probeer het opnieuw.",

    // Calendar
    trimmingCalendar: "Snoeikalender",
    calendarSubtitle: "Jouw 12-maanden gids voor optimaal tuinonderhoud.",
    currentMonth: "Huidige maand: {month}",
    contextualAnalysisTitle: "Contextuele Plantanalyse",
    contextualAnalysisDesc: "Wist je dat een muur op het zuiden de snoeiperiode tot wel 2 weken kan verschuiven?",
    analyzeMyGarden: "Analyseer mijn tuin",

    // Settings
    settingsHeader: "Instellingen & Configuratie",
    settingsSubtitle: "Pas je taal, snoei-engines, en AI-modellen aan naar wens.",
    aiProviderLabel: "Botanische AI Engine",
    aiProviderDesc: "Kies tussen een volledig lokaal model (volledig privé) of geavanceerde cloud-intelligentie.",
    localProviderName: "Lokale Snoei-Engine (Offline & Gratis)",
    localProviderDesc: "Draait 100% lokaal in je browser cache. Geen internet of API-key nodig. Volledig privé.",
    geminiProviderName: "Geavanceerde Cloud Engine (Google Gemini)",
    geminiProviderDesc: "Biedt uiterst nauwkeurige snoeitips voor fruitbomen (zoals abrikozen) en zeldzame planten. Vereist een gratis API-sleutel.",
    geminiApiKeyLabel: "Gemini API-sleutel",
    geminiApiKeyPlaceholder: "Voer je Gemini API-sleutel in...",
    getApiKeyLink: "Krijg een gratis API-sleutel van Google AI Studio (binnen 10 seconden)",
    saveSettings: "Instellingen Opslaan",
    settingsSaved: "Configuratie succesvol opgeslagen!",

    // New translation keys (nl)
    graftedSingle: "Enkel",
    graftedDuo: "Duo (2 rassen)",
    graftedTrio: "Trio (3 rassen)",
    graftedVarietiesLabel: "Geënte Rassen",
    graftName: "Ras {num}",
    formStandard: "Standaard",
    formEspalier: "Leivorm (Lei)",
    formDwarf: "Dwergvorm",
    formColumnar: "Zuilvorm",
    sunlightLabel: "Zonlicht",
    sunlightFull: "Volle zon",
    sunlightPartial: "Halfschaduw",
    sunlightShade: "Schaduw",
    soilLabel: "Grondsoort",
    soilClay: "Klei",
    soilSand: "Zand",
    soilLoam: "Leem",
    soilPeat: "Veen",
    windLabel: "Windbelasting",
    windSheltered: "Beschut",
    windExposed: "Veel wind (blootgesteld)",
    wallLabel: "Nabijheid muren",
    wallNone: "Vrijstaand",
    wallSouth: "Zuidmuur (warmtemassa)",
    wallOther: "Andere muur",
    graftingLabel: "Ent-vorm",
    pruningFormLabel: "Snoeivorm / Groeivorm",
    microclimateLabel: "Microklimaat & Bodem",
    customApiSettings: "Aangepaste OpenAI-Compatibele API",
    customApiBaseUrl: "API Base URL",
    customApiModel: "Model ID",
    customApiKey: "API Key",
    customApiDesc: "Gebruik eigen endpoints zoals DeepSeek, Grok of OpenRouter voor goedkoper/gratis testen.",
    doctorAdviceHeader: "Plant analyse",
    doctorAdviceDesc: "Stel vragen over je planten. De AI gebruikt standplaats, grondsoort, zon, wind en snoeivorm om te antwoorden.",
    doctorQuestionPlaceholder: "Stel een vraag, bijv. Waarom worden mijn bladeren geel? Hoe moet ik de jonge takken snoeien?",
    doctorSubmit: "Ontvang Advies",
    doctorSelectPlant: "Selecteer Plant",
    doctorNoPlants: "Voeg eerst een plant toe aan je tuin."
  }
};

let currentLang: Language = (localStorage.getItem('snippy-lang') as Language) || 'nl';
const listeners = new Set<(lang: Language) => void>();

export const i18n = {
  getLanguage(): Language {
    return currentLang;
  },
  setLanguage(lang: Language) {
    currentLang = lang;
    localStorage.setItem('snippy-lang', lang);
    listeners.forEach(l => l(lang));
  },
  subscribe(listener: (lang: Language) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  t(key: keyof typeof translations['nl'], variables?: Record<string, string>): string {
    const translation = translations[currentLang][key] || translations['nl'][key] || String(key);
    if (variables) {
      return Object.entries(variables).reduce((str, [k, v]) => str.replace(`{${k}}`, v), translation);
    }
    return translation;
  }
};

export function useLanguage() {
  const [lang, setLang] = useState<Language>(i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe(newLang => setLang(newLang));
  }, []);

  return {
    language: lang,
    setLanguage: i18n.setLanguage,
    t: i18n.t
  };
}
