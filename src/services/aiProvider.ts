import { CreateMLCEngine } from "@mlc-ai/web-llm";
import type { InitProgressReport, MLCEngineInterface } from "@mlc-ai/web-llm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Plant } from "../types/garden";
import { i18n } from "./i18n";
import { db } from "../data/db";

export type AIProviderType = 'local' | 'gemini' | 'custom';

class AIProvider {
  private engine: MLCEngineInterface | null = null;
  private isInitializing = false;

  getProviderType(): AIProviderType {
    const stored = localStorage.getItem('snippy_ai_provider');
    if (stored) return stored as AIProviderType;
    const envProvider = import.meta.env.VITE_AI_PROVIDER;
    if (envProvider) return envProvider as AIProviderType;
    return 'local';
  }

  setProviderType(type: AIProviderType) {
    localStorage.setItem('snippy_ai_provider', type);
  }

  getGeminiApiKey(): string {
    return localStorage.getItem('snippy_gemini_api_key') || 
           (import.meta.env.VITE_GEMINI_API_KEY as string) || 
           '';
  }

  setGeminiApiKey(key: string) {
    localStorage.setItem('snippy_gemini_api_key', key);
  }

  // Custom API Provider getters/setters
  getCustomApiBaseUrl(): string {
    return localStorage.getItem('snippy_custom_api_base_url') || 
           (import.meta.env.VITE_CUSTOM_API_BASE_URL as string) || 
           'https://api.deepseek.com/v1';
  }

  setCustomApiBaseUrl(url: string) {
    localStorage.setItem('snippy_custom_api_base_url', url);
  }

  getCustomApiModel(): string {
    return localStorage.getItem('snippy_custom_api_model') || 
           (import.meta.env.VITE_CUSTOM_API_MODEL as string) || 
           'deepseek-chat';
  }

  setCustomApiModel(model: string) {
    localStorage.setItem('snippy_custom_api_model', model);
  }

  getCustomApiKey(): string {
    return localStorage.getItem('snippy_custom_api_key') || 
           (import.meta.env.VITE_CUSTOM_API_KEY as string) || 
           '';
  }

  setCustomApiKey(key: string) {
    localStorage.setItem('snippy_custom_api_key', key);
  }

  async init(onProgress?: (progress: InitProgressReport) => void) {
    if (this.getProviderType() !== 'local') return; // Cloud APIs don't need WebLLM setup
    if (this.engine) return;
    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise(r => setTimeout(r, 500));
      }
      return;
    }

    this.isInitializing = true;
    try {
      this.engine = await CreateMLCEngine(
        "Llama-3.2-1B-Instruct-q4f16_1-MLC",
        { initProgressCallback: onProgress },
      );
    } catch (error) {
      console.error("Failed to initialize WebLLM:", error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async generatePlantData(
    query: string, 
    latinName?: string, 
    options?: {
      graftedType: 'single' | 'duo' | 'trio';
      graftedVarieties: string[];
      pruningForm: 'standard' | 'espalier' | 'dwarf' | 'columnar';
      sunlight: 'full_sun' | 'partial_shade' | 'full_shade';
      soilType: 'clay' | 'sand' | 'loam' | 'peat';
      windExposure: 'exposed' | 'sheltered';
      proximityToWalls: 'none' | 'south_wall' | 'other_wall';
    },
    onProgress?: (progress: InitProgressReport) => void
  ): Promise<Plant> {
    const provider = this.getProviderType();
    const activeLang = i18n.getLanguage();
    const isDutch = activeLang === 'nl';
    const langName = isDutch ? "Dutch (Nederlands)" : "English";

    const systemPrompt = `You are an expert botanist API. 
The user will provide a plant name and description. You must return ONLY a raw JSON object matching this exact TypeScript interface:
{
  "id": string, // Generate a unique ID like "custom-[timestamp]"
  "commonName": string, // Must be in ${langName}
  "latinName": string, // Standard botanical binomial name
  "description": string, // 1-2 sentence description strictly in ${langName}
  "trimmingMatrix": [
    // Must contain exactly 12 objects, one for each month from 1 to 12 in chronological order:
    {
      "month": number, // 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, or 12
      "state": "optimal" | "acceptable" | "avoid" | "bleeding_risk",
      "advice": string // Highly specific, actual pruning tips for this month in ${langName}. Mention professional techniques if applicable, e.g. removing water shoots (waterloten), pruning back to a specific bud/node (terugsnoeien tot op de 3e knop/oog), opening the crown, preventing silver leaf (loodglans) for stone fruits, thinning fruit branches, or post-harvest cuts.
    }
    // ... exactly 12 items
  ],
  "defaultInstructions": {
    "targetShoots": string, // Professional shoot-targeting advice in ${langName}, e.g. ${isDutch ? '"Snoei opwaarts groeiende waterloten weg en open de kroon"' : '"Prune upright water shoots and open the crown"'}
    "cutDepth": string, // Specific cutting depth advice in ${langName}, e.g. ${isDutch ? '"Zijscheuten terugsnoeien tot op 3-4 knoppen (ogen)"' : '"Prune side shoots back to 3-4 buds (nodes)"'}
    "tools": string[], // Tools strictly in ${langName}, e.g. ${isDutch ? '["Snoeischaar", "Takkenschaar"]' : '["Secateurs", "Loppers"]'}
    "frostWarning": boolean
  }
}

All text fields MUST be returned strictly in the ${langName} language.
If the user specifies a particular training form (like espalier/leivorm, dwarf, columnar) or a duo/trio grafting with multiple varieties, you MUST customize the monthly trimming advice and default instructions to incorporate these characteristics (e.g. how to prune espalier spurs, how to balance the growth of duo grafts so one variety doesn't dominate, or how the microclimate of a south wall affects early sap flow/frost risks).
Do not use generic placeholders; customize every tip specifically for the target species and its provided layout options. Do not include markdown blocks, just the JSON string.`;

    let userContent = latinName
      ? `Generate JSON for the plant: "${query}" (Scientific binomial: "${latinName}")`
      : `Generate JSON for the plant: "${query}"`;

    if (options) {
      userContent += `\nCultivation and shape details:
- Grafting Type: ${options.graftedType}${options.graftedType !== 'single' ? ` (Varieties: ${options.graftedVarieties.join(', ')})` : ''}
- Training/Pruning Shape: ${options.pruningForm}
- Sunlight Exposure: ${options.sunlight}
- Soil Type: ${options.soilType}
- Wind Exposure: ${options.windExposure}
- Proximity to Walls: ${options.proximityToWalls}`;
    }

    let content = "{}";

    if (provider === 'gemini') {
      const apiKey = this.getGeminiApiKey();
      if (!apiKey) {
        throw new Error(isDutch ? "Voer je Gemini API-key in op de Instellingen pagina." : "Please enter your Gemini API Key in the Settings page.");
      }

      if (onProgress) {
        onProgress({ 
          text: isDutch ? "Verbinding maken met Gemini..." : "Connecting to Gemini...", 
          progress: 0.5,
          timeElapsed: 0
        });
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });

        const result = await model.generateContent({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\nUser request:\n${userContent}` }] }
          ]
        });
        const response = await result.response;
        content = response.text();
      } catch (error: any) {
        console.error("Gemini Generation Error:", error);
        throw new Error(isDutch 
          ? "Gemini kon geen data ophalen. Controleer je API-key of internetverbinding." 
          : "Gemini failed to generate content. Please check your API Key or connection."
        );
      }
    } else if (provider === 'custom') {
      const baseUrl = this.getCustomApiBaseUrl();
      const apiKey = this.getCustomApiKey();
      const modelId = this.getCustomApiModel();

      if (!apiKey) {
        throw new Error(isDutch ? "Voer je API-key in op de Instellingen pagina." : "Please enter your Custom API Key in the Settings page.");
      }

      if (onProgress) {
        onProgress({ 
          text: isDutch ? "Verbinding maken met Custom API..." : "Connecting to Custom API...", 
          progress: 0.5,
          timeElapsed: 0
        });
      }

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        content = data.choices?.[0]?.message?.content || "{}";
      } catch (error: any) {
        console.error("Custom API Generation Error:", error);
        throw new Error(isDutch 
          ? "Custom API kon geen data ophalen. Controleer je instellingen." 
          : "Custom API failed to generate content. Please check your settings."
        );
      }
    } else {
      // Local WebLLM
      await this.init(onProgress);

      if (!this.engine) throw new Error("AI Engine not initialized");

      const response = await this.engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        temperature: 0.1,
      });

      content = response.choices[0].message.content || "{}";
    }

    try {
      const startIdx = content.indexOf('{');
      const endIdx = content.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
        throw new Error("No JSON object found in response");
      }
      const jsonStr = content.substring(startIdx, endIdx + 1);
      const data = JSON.parse(jsonStr);
      
      data.id = `ai-${Date.now()}`;
      
      if (latinName) {
        data.latinName = latinName;
      }
      
      return data as Plant;
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI failed to return valid JSON");
    }
  }

  async askAdviceForPlant(
    plant: Plant,
    gardenPlant: any,
    question: string,
    imageFile?: File,
    onProgress?: (progress: string) => void
  ): Promise<string> {
    const provider = this.getProviderType();
    const activeLang = i18n.getLanguage();
    const isDutch = activeLang === 'nl';
    
    // Fetch weather forecast if coordinates exist
    let weatherContext = "";
    const gardenData = db.getActiveGarden();
    if (gardenData && gardenData.center && gardenData.center.lat && gardenData.center.lng) {
      const { lat, lng } = gardenData.center;
      try {
        if (onProgress) {
          onProgress(isDutch ? "Weersvoorspelling ophalen..." : "Fetching weather forecast...");
        }
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_min&timezone=Europe/Amsterdam&forecast_days=3`;
        const res = await fetch(weatherUrl);
        if (res.ok) {
          const weatherData = await res.json();
          if (weatherData.daily && weatherData.daily.temperature_2m_min && weatherData.daily.time) {
            const temps = weatherData.daily.temperature_2m_min;
            const dates = weatherData.daily.time;
            const weatherForecasts = dates.map((dateStr: string, idx: number) => {
              const temp = temps[idx];
              const warning = temp <= 0 ? (isDutch ? " (VORST WAARSCHUWING!)" : " (FROST WARNING!)") : "";
              return `${dateStr}: ${temp}°C${warning}`;
            });
            weatherContext = `Local 3-day weather forecast (daily minimum temperatures): ${weatherForecasts.join(', ')}`;
          }
        }
      } catch (err) {
        console.error("Failed to fetch weather forecast:", err);
      }
    }

    const plantContext = `
Plant Common Name: ${plant.commonName}
Scientific Name: ${plant.latinName}
Description: ${plant.description}
Cultivation and position characteristics in the garden:
- Grafting Type: ${gardenPlant.graftedType}${gardenPlant.graftedType !== 'single' ? ` (Varieties: ${gardenPlant.graftedVarieties.join(', ')})` : ''}
- Training/Pruning Shape: ${gardenPlant.pruningForm}
- Sunlight Exposure: ${gardenPlant.sunlight}
- Soil Type: ${gardenPlant.soilType}
- Wind Exposure: ${gardenPlant.windExposure}
- Proximity to Walls: ${gardenPlant.proximityToWalls}
${weatherContext ? `- Weather Forecast Context: ${weatherContext}` : ""}
`;

    const systemPrompt = `You are an expert plant doctor and horticulturist. 
The user is asking a question about a specific plant in their garden. 
You are given the plant's detailed botanical context and its specific microclimate/cultivation conditions in the garden (along with the current 3-day minimum temperature weather forecast if available).
You must answer the user's question with professional, highly specific, and actionable advice tailored to their plant's properties, microclimate (taking into account the sun, wind, soil, proximity to walls, grafting type, and training shape), and local weather forecast.

IMPORTANT WEATHER SKILL INSTRUCTIONS:
- Analyze the 3-day weather forecast context. If a night frost warning (temperature <= 0°C) is present in the forecast, you MUST warn the user against immediate pruning of fresh cuts, as frost can damage exposed plant tissues. Always warn them about night frost risks when advising on pruning.

IMPORTANT INTRATUIN PRODUCT RECOMMENDER SKILL INSTRUCTIONS:
- Recommend specific treatment products (such as organic fungicides, specific types of pruning shears, or wound sealant) when diagnosing plant diseases or suggesting pruning.
- Format every product recommendation as a direct, live Markdown search link to the official Intratuin webshop using this exact format: \`[Product Name](https://www.intratuin.nl/catalogsearch/result/?q=Product+Name)\`. Replace spaces in the query with '+' or '%20'. For example, if you suggest a "handzaag", write: \`[handzaag](https://www.intratuin.nl/catalogsearch/result/?q=handzaag)\`. If you suggest "organische schimmelbestrijding", write: \`[organische schimmelbestrijding](https://www.intratuin.nl/catalogsearch/result/?q=organische+schimmelbestrijding)\`.
- Ensure all search terms are in Dutch since the target webshop is Dutch.

Write your response in clear, helpful, and premium ${isDutch ? "Dutch (Nederlands)" : "English"} using markdown formatting.`;

    const userContent = `Here is the plant's context:
${plantContext}

User Question: "${question}"`;

    let responseText = "";

    if (provider === 'gemini') {
      const apiKey = this.getGeminiApiKey();
      if (!apiKey) {
        throw new Error(isDutch ? "Voer je Gemini API-key in op de Instellingen pagina." : "API key is required");
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const parts: any[] = [{ text: `${systemPrompt}\n\n${userContent}` }];
        
        if (imageFile) {
          if (onProgress) onProgress(isDutch ? "Afbeelding verwerken..." : "Processing image...");
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(imageFile);
          });
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: imageFile.type
            }
          });
        }
        
        if (onProgress) onProgress(isDutch ? "Advies genereren..." : "Generating advice...");
        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
        const response = await result.response;
        responseText = response.text();
      } catch (e) {
        console.error("Gemini Advice Error:", e);
        throw e;
      }
    } else if (provider === 'custom') {
      const baseUrl = this.getCustomApiBaseUrl();
      const apiKey = this.getCustomApiKey();
      const modelId = this.getCustomApiModel();

      if (!apiKey) {
        throw new Error(isDutch ? "Voer je Custom API-key in op de Instellingen pagina." : "API key is required");
      }
      
      if (onProgress) onProgress(isDutch ? "Advies genereren..." : "Generating advice...");
      
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent + (imageFile ? `\n\n[Note: The user attached an image of this plant, please advise on potential visible issues or shape trimming based on this context.]` : '') }
            ],
            temperature: 0.5
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content || "";
      } catch (e) {
        console.error("Custom API Advice Error:", e);
        throw e;
      }
    } else {
      // Local LLM
      if (onProgress) onProgress(isDutch ? "Lokaal advies genereren..." : "Generating local advice...");
      await this.init();
      if (!this.engine) throw new Error("AI Engine not initialized");
      
      const response = await this.engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        temperature: 0.5
      });
      responseText = response.choices[0].message.content || "";
    }

    return responseText;
  }
}

export const aiProvider = new AIProvider();
