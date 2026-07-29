
// Use correct import from @google/genai
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { DiseaseDiagnosis, SoilReport, PestIdentification, FertilizerPlan, JournalEntry, Task } from "../types";

// Always initialize with named parameter and process.env.GEMINI_API_KEY or fallback
export const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  if (!apiKey) {
    console.error("[AI Service Error] Gemini API key is missing or empty! Ensure GEMINI_API_KEY is configured.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Robust retry wrapper with exponential backoff to handle 429 Resource Exhausted errors.
 * Logs detailed error information to console for debugging.
 */
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 5, baseDelay = 2000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const isRateLimit = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota");
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`[AI Service Warning] Rate limit reached. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`, errorMsg);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error(`[AI Service Error] Call failed on attempt ${i + 1}/${maxRetries}:`, {
        message: error?.message,
        status: error?.status,
        stack: error?.stack,
        error
      });
      throw error;
    }
  }
  console.error(`[AI Service Error] All ${maxRetries} retries exhausted. Final error:`, lastError);
  throw lastError;
};

export const getWeatherAdvisory = async (forecast: any, crops: string[], location: string, language: string = 'English'): Promise<string> => {
  const ai = getAIClient();
  const prompt = `Act as a senior agronomist. Analyze this 5-day weather forecast for ${location}: ${JSON.stringify(forecast)}. 
  Crops currently growing: ${crops.join(', ')}. 
  Provide a set of "Field Directives" for the farmer. Address:
  1. Best windows for spraying (wind/rain context).
  2. Irrigation adjustments.
  3. Risk of frost or heat stress.
  4. Best days for harvesting.
  Keep the tone professional, urgent, and practical. Use concise bullet points.
  CRITICAL: Provide the entire response in ${language}.`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash', 
    contents: prompt
  }));
  return response.text || "Continue standard operations.";
};

export interface SeasonalEvent {
  date: string;
  title: string;
  type: 'Planting' | 'Harvest' | 'Irrigation' | 'Fertilizer' | 'Observation';
  description: string;
}

export const fetchSeasonalCalendar = async (location: string, crops: string[], plantingDate: string, language: string = 'English'): Promise<SeasonalEvent[]> => {
  const ai = getAIClient();
  const prompt = `Generate a 6-month agricultural calendar for ${location} starting from ${plantingDate}.
  Main crops: ${crops.join(', ')}.
  Include key milestones:
  1. Planting date (use ${plantingDate}).
  2. Predicted harvest dates for each crop.
  3. Critical irrigation windows based on typical monsoon patterns.
  4. Fertilizer application stages.
  5. Pest observation windows.
  
  Return a JSON array of objects with fields: date (YYYY-MM-DD), title, type (one of: Planting, Harvest, Irrigation, Fertilizer, Observation), and description.
  CRITICAL: All text fields (title, description) must be in ${language}.`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["Planting", "Harvest", "Irrigation", "Fertilizer", "Observation"] },
            description: { type: Type.STRING }
          },
          required: ["date", "title", "type", "description"]
        }
      }
    }
  }));

  return JSON.parse(response.text || '[]');
};

export const fetchSeasonalPlanning = async (location: string, crops: string[], language: string = 'English', plantingDate?: string) => {
  const ai = getAIClient();
  const currentYear = new Date().getFullYear();
  const plantingInfo = plantingDate ? `The farmer plans to plant (or has planted) on ${plantingDate}.` : '';
  const prompt = `Act as a senior agricultural strategist for India. Analyze the 6-month climate outlook for ${location} for the year ${currentYear}. 
  Current focus crops: ${crops.join(', ')}. ${plantingInfo}
  Address:
  1. Upcoming monsoon onset/withdrawal trends.
  2. Long-term heatwave or coldwave risks.
  3. Strategic "Crop Switch" or "Intercropping" recommendations based on predicted rainfall.
  4. Market timing: When to sell based on typical seasonal harvest gluts.
  Keep the tone authoritative and strategic. Provide the entire response in ${language}.`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  }));

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const suggestCropsForSeason = async (location: string, plantingDate: string, language: string = 'English') => {
  const ai = getAIClient();
  const prompt = `Suggest 4 specific crops that are highly suitable for planting in ${location} around the date ${plantingDate}. 
  Consider typical Indian seasonal cycles (Kharif, Rabi, Zaid) and current climate trends. 
  Return a JSON array of objects with fields: name, reasoning (short), and suitability (High or Moderate).
  CRITICAL: All text fields in the JSON must be in ${language}.`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            suitability: { type: Type.STRING, enum: ["High", "Moderate"] }
          },
          required: ["name", "reasoning", "suitability"]
        }
      }
    }
  }));

  return JSON.parse(response.text || '[]');
};

export const getCropRotationAdvice = async (location: string, currentCrops: string[], soilType: string, history: string[], language: string = 'English') => {
  const ai = getAIClient();
  const prompt = `Act as an expert Indian agronomist. For a farm in ${location}, with ${soilType} soil, currently growing ${currentCrops.join(', ')}, and a history of planting ${history.join(', ')}, provide a strategic "Crop Rotation & Symbiotic Plan".
  Address:
  1. Optimal Crop Rotation: A 3-year cycle to maximize soil nitrogen, improve soil structure, and break pest cycles.
  2. Companion Planting: Which secondary crops (e.g. Marigolds, Pulses) should be planted alongside the main crops.
  3. Intercropping Strategies: Specific row-ratio patterns for better yield (e.g. 1:2 Mustard/Wheat).
  4. Soil Health Recovery: How this rotation specifically addresses the ${soilType} soil type.
  Provide the response in ${language}. Use clear sections and professional tone.`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt
  }));
  return response.text;
};

export const diagnosePlant = async (base64Image: string, language: string = 'English'): Promise<DiseaseDiagnosis> => {
  const ai = getAIClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: `Analyze this plant image and provide a detailed diagnosis. Be specific about disease names and treatments common in the Indian subcontinent. Include traditional organic remedies (e.g., Neem based) if applicable. CRITICAL: All text fields in the JSON response must be in ${language}.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plantName: { type: Type.STRING },
          condition: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          isHealthy: { type: Type.BOOLEAN }
        },
        required: ["plantName", "condition", "confidence", "symptoms", "recommendations", "isHealthy"]
      }
    }
  }));

  return JSON.parse(response.text || '{}');
};

export const identifyPest = async (base64Image: string, language: string = 'English'): Promise<PestIdentification> => {
  const ai = getAIClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: `Identify the agricultural pest in this image. Focus on pests common in India. Provide its name, scientific name, threat level, host crops (like Paddy, Sugarcane, Wheat), current lifecycle stage, symptoms of damage, and control measures including integrated pest management (IPM). CRITICAL: All descriptive text in the JSON response must be in ${language}.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pestName: { type: Type.STRING },
          scientificName: { type: Type.STRING },
          description: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          damageSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          controlMeasures: { type: Type.ARRAY, items: { type: Type.STRING } },
          threatLevel: { type: Type.STRING, description: "Low, Moderate, High, or Critical" },
          hostCrops: { type: Type.ARRAY, items: { type: Type.STRING } },
          lifecycleStage: { type: Type.STRING }
        },
        required: ["pestName", "scientificName", "description", "confidence", "damageSymptoms", "controlMeasures", "threatLevel", "hostCrops", "lifecycleStage"]
      }
    }
  }));

  return JSON.parse(response.text || '{}');
};

export const analyzeSoil = async (base64Image: string, language: string = 'English'): Promise<SoilReport> => {
  const ai = getAIClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: `Analyze the soil in this photo within the context of Indian land types. Estimate its texture, organic matter, and drainage. Provide estimated structured N-P-K levels as Low, Medium, or High. Provide an estimated numerical pH value between 0.0 and 14.0 based on visual markers. CRITICAL: All descriptive text and recommendations in the JSON response must be in ${language}.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          texture: { type: Type.STRING },
          estimatedPh: { type: Type.NUMBER, description: "Numerical pH value from 0.0 to 14.0" },
          organicMatter: { type: Type.STRING },
          drainage: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          n: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
          p: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
          k: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
        },
        required: ["texture", "estimatedPh", "organicMatter", "drainage", "recommendations", "n", "p", "k"]
      }
    }
  }));
  const data = JSON.parse(response.text || '{}');
  return {
    ...data,
    estimatedPh: data.estimatedPh.toString()
  };
};

export const analyzeFieldBoundary = async (points: { lat: number; lng: number }[], name: string, language: string = 'English') => {
  const ai = getAIClient();
  const coordsString = points.map(p => `[${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}]`).join(', ');
  const prompt = `Perform a geo-profile analysis for an Indian agricultural field named "${name}" defined by coordinates: ${coordsString}. 
  Describe typical: 1. Regional soil characteristics. 2. Climate/Rainfall pattern. 3. Suitability for Kharif/Rabi crops. 4. Potential drainage issues based on local terrain patterns. 5. Government schemes applicable in this latitude/longitude.
  CRITICAL: Provide the entire response in ${language}.`;
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash', 
    contents: prompt
  }));
  return response.text;
};

export const fetchAgriNews = async (location: string, language: string = 'English', weatherContext?: string) => {
  const ai = getAIClient();
  const prompt = `Find the latest agricultural news, Mandi prices, and government schemes (like PM-KISAN, Fasal Bima) specifically for farmers in ${location}. ${weatherContext ? `Current weather: ${weatherContext}.` : ''} Provide entire response in ${language}.`;
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  }));

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const fetchInputPriceAdvisory = async (location: string, inputs: string[], language: string = 'English', coords?: {lat: number, lon: number}) => {
  const ai = getAIClient();
  const distanceRequest = coords ? `CRITICAL: Since GPS coordinates are available, for each dealer found, provide an estimated distance from the farmer's current location in kilometers (e.g., "Distance: 2.5 km").` : '';
  
  const prompt = `Find current market rates and suppliers for agricultural inputs: ${inputs.join(', ')} in ${location}. 
  Provide comparison of rates, suggest verified government or cooperative suppliers (like IFFCO), and provide tips on saving costs through bulk buying or subsidies. 
  
  IDENTIFY at least 5 nearby agricultural dealers, seed stores, and fertilizer shops. For EACH dealer, please try to find and list their:
  - Name
  - Exact Address
  - Phone Number/Contact
  - Types of inputs they likely stock (Seeds, Fertilizer, etc.)
  ${distanceRequest}
  
  Format the response in ${language}. Use clear sections.`;
  
  const config: any = {
    tools: [{ googleSearch: {} }, { googleMaps: {} }]
  };

  if (coords) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: coords.lat,
          longitude: coords.lon
        }
      }
    };
  }

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config
  }));

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const fetchSprayingAdvice = async (data: { crop: string, pest: string, chemical?: string, area: string, tankSize: string, windSpeed: number }, language: string = 'English') => {
  const ai = getAIClient();
  const prompt = `Provide precise spraying advice for ${data.crop} targeting ${data.pest} in an Indian farming context. 
  Address: 
  1. Tank Mix Recipe. 
  2. Safety/PPE (crucial for local climate). 
  3. Application technique. 
  4. Weather warning for wind speed ${data.windSpeed} km/h. 
  5. TIMING: Specify the "Safe Spray Window" (early morning vs late evening) and "Restricted Times" (midday heat, high wind). Mention pollinator protection.
  Recommend eco-friendly alternatives popular in India where possible.
  CRITICAL: Provide the entire response in ${language}.`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt
  }));
  return response.text;
};

export const predictHarvest = async (data: { crop: string, variety: string, plantingDate: string, location: string }, language: string = 'English') => {
  const ai = getAIClient();
  const prompt = `Predict harvest date for ${data.variety} ${data.crop} planted on ${data.plantingDate} in ${data.location}. Use Indian cropping seasons (Kharif/Rabi/Zaid) context and monsoon patterns. Provide post-harvest Mandi storage tips.
  CRITICAL: Provide the entire response in ${language}.`;
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt
  }));
  return response.text;
};

export const diagnoseLivestock = async (base64Image: string, animalType: string, language: string = 'English') => {
  const ai = getAIClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: `Analyze health of this ${animalType} (context: Indian dairy/livestock farming). Provide potential issues, urgency, and care steps. CRITICAL: All text fields in the JSON response must be in ${language}.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          conditionName: { type: Type.STRING },
          urgency: { type: Type.STRING },
          symptomsSeen: { type: Type.ARRAY, items: { type: Type.STRING } },
          careSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          nutritionalAdvice: { type: Type.STRING },
          isHealthy: { type: Type.BOOLEAN }
        },
        required: ["conditionName", "urgency", "symptomsSeen", "careSteps", "nutritionalAdvice", "isHealthy"]
      }
    }
  }));
  return JSON.parse(response.text || '{}');
};

export const fetchFieldMap = async (lat: number, lon: number, query: string) => {
  const ai = getAIClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `Identify ${query} near lat ${lat}, lon ${lon}. Focus on Mandis, KVK centers, and Seed stores.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lon } } }
    },
  }));

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const estimateYield = async (data: { crop: string, area: string, unit: string, irrigation: string, variety: string }, language: string = 'English') => {
  const ai = getAIClient();
  const prompt = `Estimate harvest yield and ROI for ${data.area} ${data.unit} of ${data.variety} ${data.crop} in India using ${data.irrigation} irrigation. Mention potential earnings in INR based on typical MSP (Minimum Support Price) trends.
  CRITICAL: Provide the entire response in ${language}.`;
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt
  }));
  return response.text;
}

export const fetchMarketPrices = async (crop: string, location: string, language: string = 'English') => {
  const ai = getAIClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `Analyze current Mandi prices and 6-month trends for ${crop} in ${location} (India). Include MSP context. Provide the data as a clean JSON object containing summary, currentPrice, currency, unit, and trend (array of {month, price}). CRITICAL: The "summary" field and month names in "trend" must be in ${language}.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  }));

  let cleanText = response.text || '{}';
  if (cleanText.includes('```json')) {
    cleanText = cleanText.split('```json')[1].split('```')[0].trim();
  } else if (cleanText.includes('```')) {
    cleanText = cleanText.split('```')[1].split('```')[0].trim();
  }

  return {
    data: JSON.parse(cleanText),
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const getCropAdvice = async (crop: string, location: string, soilType: string, language: string = 'English', weatherContext?: string) => {
  const ai = getAIClient();
  const weatherInfo = weatherContext ? `Current weather conditions: ${weatherContext}.` : '';
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `Give comprehensive Indian farming advice for ${crop} in ${location} with ${soilType} soil. ${weatherInfo} Include season (Kharif/Rabi), irrigation, and IPM. Provide the entire response in ${language}.`
  }));
  return response.text;
}

export const getFertilizerAdvice = async (crop: string, location: string, soilType: string, language: string = 'English', weatherContext?: string): Promise<FertilizerPlan> => {
  const ai = getAIClient();
  const weatherInfo = weatherContext ? `Consider these current weather conditions for application timing and nutrient leaching risks: ${weatherContext}.` : '';
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `Provide detailed fertilizer plan for ${crop} in ${location} with ${soilType} soil (Indian context). ${weatherInfo} Adhere to Soil Health Card guidelines. Provide all descriptive text and instructions in ${language}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cropRequirements: { type: Type.STRING },
          soilAdjustments: { type: Type.STRING },
          fertilizers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                npk: { type: Type.STRING },
                description: { type: Type.STRING },
                isOrganic: { type: Type.BOOLEAN }
              },
              required: ["name", "npk", "description", "isOrganic"]
            }
          },
          schedule: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { stage: { type: Type.STRING }, timing: { type: Type.STRING }, dosage: { type: Type.STRING }, method: { type: Type.STRING } },
              required: ["stage", "timing", "dosage", "method"]
            }
          },
          micronutrients: { type: Type.ARRAY, items: { type: Type.STRING } },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["cropRequirements", "soilAdjustments", "fertilizers", "schedule", "micronutrients", "tips"]
      }
    }
  }));

  return JSON.parse(response.text || '{}');
};

export const chatWithExpert = async (message: string, history: any[], language: string = 'English', profile?: any) => {
  const ai = getAIClient();
  const profileContext = profile ? `
  FARMER PROFILE CONTEXT:
  - Farmer Name: ${profile.farmerName}
  - Farm Name: ${profile.farmName}
  - Location: ${profile.location} (${profile.state}, ${profile.district})
  - Farm Size: ${profile.farmSize} ${profile.sizeUnit}
  - Soil Type: ${profile.soilType}
  - Irrigation: ${profile.irrigation}
  - Terrain: ${profile.terrain}
  - Active Crops: ${profile.mainCrops.join(', ')}
  - Crop History: ${JSON.stringify(profile.cropHistory)}
  - Past Issues: ${profile.pastIssues.join(', ')}
  ` : '';

  const chat = ai.chats.create({
    model: 'gemini-3.6-flash',
    config: {
      systemInstruction: `You are KrishiExpert, a senior Indian agricultural advisor. You know Mandi trends, government schemes, and localized soil health card parameters. 
      ${profileContext}
      Use the farmer's profile data to provide highly personalized, context-aware advice. If they have a history of specific pests or soil issues, address them.
      CRITICAL: Always respond in ${language}.`
    }
  });
  const response = await withRetry<GenerateContentResponse>(() => chat.sendMessage({ message }));
  return response.text;
};

// gemini-3.1-flash-lite-image for standard image generation
export const generatePestVisual = async (pestName: string, cropType?: string, lifecycleStage?: string): Promise<string> => {
  const ai = getAIClient();
  const prompt = `Educational illustration of ${pestName} in India${cropType ? ` on ${cropType}` : ''}. Macro botanical style.`;
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  }));
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image");
};

export const analyzeJournal = async (entries: JournalEntry[], language: string = 'English') => {
  const ai = getAIClient();
  const dataString = entries.map(e => `[${e.date}] ${e.category} (${e.crop}): ${e.notes}`).join('\n');
  const prompt = `Review these Indian farm log entries. Provide seasonal insights based on Monsoon and regional crop cycles. Journal: ${dataString}. CRITICAL: Provide the entire analysis in ${language}.`;
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt
  }));
  return response.text;
};

export const suggestTasks = async (context: { weather: string, crops: string[], date: string }, language: string = 'English') => {
  const ai = getAIClient();
  const prompt = `Based on Indian agricultural calendar (${context.date}), current monsoon/weather (${context.weather}), and crops (${context.crops.join(', ')}), suggest 4 urgent farm tasks. Return JSON array. CRITICAL: All titles and descriptions must be in ${language}.`;
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            category: { type: Type.STRING }
          },
          required: ["title", "description", "priority", "category"]
        }
      }
    }
  }));
  return JSON.parse(response.text || '[]');
};

export const evaluateSustainability = async (practices: string[], language: string = 'English') => {
  const ai = getAIClient();
  const prompt = `Analyze the ecological impact of these farming practices: ${practices.join(', ')}. 
  Provide a detailed audit of environmental benefits, estimate potential carbon credit eligibility in the Indian voluntary market, and suggest strategic improvements.
  CRITICAL: Provide the entire response in ${language}.`;
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt
  }));
  return response.text;
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const ai = getAIClient();
  const prompt = `Translate the following agricultural text into ${targetLanguage}. Maintain technical accuracy and formatting.
  
  Text:
  ${text}`;
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt
  }));

  return response.text || text;
};

export const fetchSatelliteReport = async (fieldName: string, crop: string, language: string = 'English') => {
  const ai = getAIClient();
  const prompt = `Act as an ESA/ISRO crop monitoring model. Generate a daily telemetry audit for field '${fieldName}' growing '${crop}'.
  We need 5 metrics:
  1. NDVI (Normalized Difference Vegetation Index, a float between 0.2 and 0.9)
  2. Soil Moisture percentage/description (e.g. "Optimal (64%)" or "Stressed (42%)")
  3. Chlorophyll level (e.g. "Low", "Medium", "High")
  4. Surface Temperature (e.g. "23.4°C" or "28.1°C")
  5. Canopy Biomass (e.g. "12.4 t/ha")
  
  Also provide an agronomist recommendation for this field's state.
  Return a JSON object with fields: ndvi (number), moisture (string), chlorophyll (string), temp (string), biomass (string), recommendation (string).
  CRITICAL: The recommendation field must be in ${language}.`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ndvi: { type: Type.NUMBER },
          moisture: { type: Type.STRING },
          chlorophyll: { type: Type.STRING },
          temp: { type: Type.STRING },
          biomass: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        },
        required: ["ndvi", "moisture", "chlorophyll", "temp", "biomass", "recommendation"]
      }
    }
  }));

  return JSON.parse(response.text || '{}');
};

export interface DailyAgriTip {
  title: string;
  category: string;
  advice: string;
  actionStep: string;
  seasonalContext: string;
}

export const fetchDailyAgriTip = async (
  location: string, 
  state: string, 
  district: string, 
  crops: string[], 
  language: string = 'English'
): Promise<DailyAgriTip> => {
  const ai = getAIClient();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  
  const prompt = `Provide a highly localized, seasonal "Daily Agri-Tip" for a farmer in India.
  Location Context:
  - Region/City: ${location || 'North India'}
  - State: ${state || 'Punjab'}
  - District: ${district || 'Amritsar'}
  - Current Month: ${currentMonth}
  - Crops Cultivated: ${crops && crops.length > 0 ? crops.join(', ') : 'General seasonal crops'}
  
  Consider typical Indian cropping seasons (Kharif, Rabi, Zaid) appropriate for ${currentMonth} in ${state || 'this region'}.
  Provide actionable, highly practical agronomical advice suitable for today.
  
  Return a JSON object.
  CRITICAL: All text fields in the JSON response must be in ${language}.`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A catchy, positive 4-7 word title for the daily tip." },
          category: { type: Type.STRING, description: "One word category: Soil, Pest, Weather, Irrigation, Nutrient, Harvest, or Safety" },
          advice: { type: Type.STRING, description: "Detailed agronomical advice in 2-3 clear sentences." },
          actionStep: { type: Type.STRING, description: "One high-priority, specific action item the farmer can do on the field today." },
          seasonalContext: { type: Type.STRING, description: "The seasonal context, e.g., 'Early Rabi Prep', 'Mid-Kharif Moisture management'." }
        },
        required: ["title", "category", "advice", "actionStep", "seasonalContext"]
      }
    }
  }));

  return JSON.parse(response.text || '{}');
};

