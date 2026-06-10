import { i18n } from './i18n';

export interface WikiSuggestion {
  title: string;
  description: string;
  latinName?: string;
  url: string;
}

// In-memory caches to speed up autocomplete and prevent Wikipedia/GBIF rate limits
const validationCache = new Map<string, boolean>();
const queryCache = new Map<string, WikiSuggestion[]>();

const cleanWikiTitle = (title: string): string => {
  return title.replace(/\s*\([^)]*\)/g, "").trim();
};

const COMMON_FIRST_WORDS = new Set([
  'de', 'het', 'een', 'dit', 'dat', 'in', 'op', 'bij', 'met', 'voor', 'naar', 
  'als', 'uit', 'tot', 'om', 'over', 'en', 'of', 'frans', 'engels', 'duits', 
  'nederlands', 'latijn', 'hier', 'daar', 'toen', 'nu', 'appel', 'peer', 'pruim', 
  'kers', 'abrikoos', 'perzik', 'vijg', 'druif', 'bessen', 'framboos', 'braam', 
  'aalbes', 'kruisbes', 'bosbes', 'appelvink', 'doppruim', 'appelpop', 'appelscha',
  'nederlandse', 'engelse', 'franse', 'duitse', 'belgische', 'amerikaanse', 'europese',
  'indische', 'chinese', 'japanse', 'afrikaanse', 'aziatische', 'australische',
  'deze', 'geen', 'sommige', 'veel', 'vele', 'alle', 'alles', 'iedere', 'elk', 'elke'
]);

const COMMON_SECOND_WORDS = new Set([
  'of', 'de', 'the', 'in', 'and', 'or', 'van', 'en', 'is', 'for', 'on', 'at', 
  'by', 'an', 'a', 'to', 'een', 'het', 'met', 'voor', 'door', 'naar', 'als', 
  'uit', 'tot', 'om', 'over', 'bij', 'genoemd', 'heet', 'heeft', 'zijn', 'was', 
  'werd', 'wordt', 'sect', 'section', 'soort', 'genus', 'family', 'familie', 
  'klasse', 'orde', 'order', 'provincie', 'deelstaat', 'gemeente', 'stad', 
  'dorp', 'buurtschap', 'land', 'regio', 'rivier', 'zee', 'meer', 'berg', 
  'dal', 'bos', 'park', 'straat', 'weg', 'eiland', 'schiereiland', 'provincies',
  'landen', 'steden', 'dorpen', 'films', 'film', 'boek', 'boeken', 'schrijver',
  'auteur', 'kunstenaar', 'schilder', 'tekenaar', 'zanger', 'acteur', 'actrice',
  'pornofilm', 'speelfilm', 'documentaire', 'serie', 'televisieserie', 'aflevering',
  'nummer', 'album', 'singles', 'single', 'groep', 'band', 'orkest', 'koor'
]);

function findBinomialName(text: string): string | undefined {
  if (!text) return undefined;
  // Strip hybrid multiplier signs (e.g. Malus ×domestica -> Malus domestica) to enable matches
  const cleanText = text.replace(/×/g, "");
  const regex = /(?:^|[^a-zA-Z])([A-Z][a-z]{2,})\s+([a-z]{3,})(?:[^a-zA-Z]|$)/g;
  
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    const first = match[1];
    const second = match[2];
    
    const firstLower = first.toLowerCase();
    const secondLower = second.toLowerCase();
    
    if (!COMMON_FIRST_WORDS.has(firstLower) && !COMMON_SECOND_WORDS.has(secondLower)) {
      return `${first} ${second}`;
    }
  }
  return undefined;
}

// Contact GBIF species match endpoint to verify name belongs to botanical tree/plant taxonomy
async function isValidPlant(binomialName: string): Promise<boolean> {
  if (!binomialName) return false;
  
  const cacheKey = binomialName.toLowerCase().trim();
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey)!;
  }

  const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(binomialName)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    const data = await response.json();
    const isValid = data.matchType !== 'NONE' && (data.kingdom === 'Plantae' || data.kingdom === 'Fungi');
    validationCache.set(cacheKey, isValid);
    return isValid;
  } catch (e) {
    return false;
  }
}

export const wikipediaService = {
  async getSuggestions(query: string): Promise<WikiSuggestion[]> {
    if (!query || query.length < 2) return [];

    const normQuery = query.toLowerCase().trim();
    if (queryCache.has(normQuery)) {
      return queryCache.get(normQuery)!;
    }

    // Extract potential base species name and cultivar suffix (e.g. Malus domestica Delgrina)
    const words = query.trim().split(/\s+/);
    let baseQuery = "";
    let cultivarSuffix = "";

    if (words.length >= 3) {
      baseQuery = words.slice(0, 2).join(" ");
      cultivarSuffix = words.slice(2).join(" ").replace(/['"“”]/g, "").trim();
    } else if (words.length === 2) {
      baseQuery = words[0];
      cultivarSuffix = words[1].replace(/['"“”]/g, "").trim();
    }

    // Fetch Wikipedia pages starting with the search term
    const fetchWikipediaPages = async (searchTerm: string): Promise<any[]> => {
      const url = `https://nl.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=prefixsearch&gpssearch=${encodeURIComponent(searchTerm)}&gpslimit=10&prop=extracts&exintro=1&explaintext=1&exsentences=1&redirects=1`;
      try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return data.query?.pages ? Object.values(data.query.pages) : [];
      } catch (e) {
        return [];
      }
    };

    // Fetch GBIF Backbone Taxonomy results using hybrid search
    const fetchGbifSpecies = async (searchTerm: string): Promise<any[]> => {
      const urlVernacular = `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(searchTerm)}&kingdom=Plantae&qField=VERNACULAR&limit=10`;
      const urlScientific = `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(searchTerm)}&kingdom=Plantae&limit=10`;
      
      try {
        const [resV, resS] = await Promise.all([
          fetch(urlVernacular).then(r => r.ok ? r.json() : { results: [] }),
          fetch(urlScientific).then(r => r.ok ? r.json() : { results: [] })
        ]);
        
        const results = [...(resV.results || [])];
        const seenKeys = new Set(results.map(r => r.key));
        
        (resS.results || []).forEach((r: any) => {
          if (!seenKeys.has(r.key)) {
            results.push(r);
            seenKeys.add(r.key);
          }
        });
        
        return results;
      } catch (e) {
        return [];
      }
    };

    // Fetch Wikipedia pages for specific titles in bulk
    const fetchWikipediaExtractsByTitle = async (titles: string[]): Promise<any[]> => {
      if (titles.length === 0) return [];
      const url = `https://nl.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(titles.join('|'))}&prop=extracts&exintro=1&explaintext=1&exsentences=1&redirects=1`;
      try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return data.query?.pages ? Object.values(data.query.pages) : [];
      } catch (e) {
        return [];
      }
    };

    try {
      // 1. Run Wikipedia prefix search and GBIF search in parallel for full query
      let [wikiResults, gbifResults] = await Promise.all([
        fetchWikipediaPages(query),
        fetchGbifSpecies(query)
      ]);

      let isFallbackActive = false;

      // If no direct results are found, fall back to the base query
      if (wikiResults.length === 0 && gbifResults.length === 0 && baseQuery) {
        isFallbackActive = true;
        [wikiResults, gbifResults] = await Promise.all([
          fetchWikipediaPages(baseQuery),
          fetchGbifSpecies(baseQuery)
        ]);
      }

      const pages: any[] = [];
      const seenIds = new Set<number>();
      const seenTitles = new Set<string>();

      // Merge prefix search results
      wikiResults.forEach(p => {
        if (!seenIds.has(p.pageid)) {
          seenIds.add(p.pageid);
          seenTitles.add(p.title.toLowerCase());
          pages.push(p);
        }
      });

      // Collect new scientific plant species names from GBIF results
      const gbifNamesToFetch: string[] = [];
      gbifResults.forEach(item => {
        const canonicalName = item.species || item.genus || item.canonicalName;
        if (canonicalName && !seenTitles.has(canonicalName.toLowerCase())) {
          gbifNamesToFetch.push(canonicalName);
          seenTitles.add(canonicalName.toLowerCase());
        }
      });

      // 2. Fetch Wikipedia extracts for the GBIF plant names in bulk
      if (gbifNamesToFetch.length > 0) {
        const gbifWikiPages = await fetchWikipediaExtractsByTitle(gbifNamesToFetch);
        gbifWikiPages.forEach(p => {
          if (p.pageid && p.pageid !== -1 && !seenIds.has(p.pageid)) {
            seenIds.add(p.pageid);
            pages.push(p);
          }
        });
      }

      // 3. Filter pages using GBIF validation
      const validationPromises = pages.map(async (page) => {
        const binomial = findBinomialName(page.extract || "");
        if (!binomial) return { page, valid: false, binomial };
        const valid = await isValidPlant(binomial);
        return { page, valid, binomial };
      });

      const validatedPages = await Promise.all(validationPromises);
      const speciesPages = validatedPages
        .filter(item => item.valid)
        .map(item => ({ ...item.page, parsedBinomial: item.binomial }));

      const suggestions: WikiSuggestion[] = speciesPages.map(page => {
        const title = page.title || "";
        const extract = page.extract || "";
        const latinName = page.parsedBinomial;

        const cleanDesc = extract
          .replace(/\s*\([^)]*\)\s*/g, " ")
          .substring(0, 120) + "...";

        const cleanTitle = cleanWikiTitle(title);

        return {
          title: isFallbackActive && cultivarSuffix
            ? `${cleanTitle} "${cultivarSuffix}"`
            : cleanTitle,
          description: cleanDesc || (i18n.getLanguage() === 'nl' ? "Plantensoort of botanisch onderwerp." : "Plant species or botanical subject."),
          latinName: isFallbackActive && cultivarSuffix && latinName
            ? `${latinName} ${cultivarSuffix}`
            : latinName,
          url: `https://nl.wikipedia.org/wiki/${encodeURIComponent(title)}`
        };
      });

      // Sort suggestions by relevance:
      // 1. Exact match with common name or Latin name
      // 2. Prefix match
      const queryNorm = normQuery.replace(/[\s-]+/g, "");
      suggestions.sort((a, b) => {
        const aTitleNorm = a.title.toLowerCase().replace(/[\s-]+/g, "");
        const bTitleNorm = b.title.toLowerCase().replace(/[\s-]+/g, "");
        const aLatinNorm = (a.latinName || '').toLowerCase().replace(/[\s-]+/g, "");
        const bLatinNorm = (b.latinName || '').toLowerCase().replace(/[\s-]+/g, "");

        const aExact = aTitleNorm === queryNorm || aLatinNorm === queryNorm;
        const bExact = bTitleNorm === queryNorm || bLatinNorm === queryNorm;

        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;

        const aStarts = aTitleNorm.startsWith(queryNorm) || aLatinNorm.startsWith(queryNorm);
        const bStarts = bTitleNorm.startsWith(queryNorm) || bLatinNorm.startsWith(queryNorm);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return 0;
      });

      // Remove duplicates
      const uniqueSuggestions: WikiSuggestion[] = [];
      const seenPairs = new Set<string>();
      suggestions.forEach(s => {
        const pairKey = `${s.title.toLowerCase()}|${(s.latinName || '').toLowerCase()}`;
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          uniqueSuggestions.push(s);
        }
      });

      queryCache.set(normQuery, uniqueSuggestions);
      return uniqueSuggestions;
    } catch (error) {
      console.error("Wikipedia Redesigned Suggest API Error:", error);
      return [];
    }
  }
};
