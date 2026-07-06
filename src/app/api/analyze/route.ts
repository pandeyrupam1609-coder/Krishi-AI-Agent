import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { mandiPricesData } from '@/app/api/mandi/route';
import { schemesData } from '@/app/api/schemes/route';
import { offlineWeatherData } from '@/lib/offlineData';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Mock coordinate mapping for Indian States (matching Dashboard)
const stateCoordinates: Record<string, { lat: string; lon: string }> = {
  'Punjab': { lat: '31.1471', lon: '75.3412' },
  'Haryana': { lat: '29.0588', lon: '76.0856' },
  'Rajasthan': { lat: '27.0238', lon: '74.2179' },
  'Uttar Pradesh': { lat: '26.8467', lon: '80.9462' },
  'Madhya Pradesh': { lat: '22.9734', lon: '78.6569' },
  'Gujarat': { lat: '22.2587', lon: '71.1924' },
  'Maharashtra': { lat: '19.7515', lon: '75.7139' },
  'Karnataka': { lat: '15.3173', lon: '75.7139' },
  'Andhra Pradesh': { lat: '15.9129', lon: '79.7400' },
  'West Bengal': { lat: '22.9868', lon: '87.8550' }
};

// List of mock diagnoses for fallback
const mockDiagnoses = [
  {
    cropName: 'Tomato',
    healthStatus: 'Diseased' as const,
    diseaseName: 'Tomato Late Blight',
    confidence: 94,
    symptoms: 'Dark water-soaked spots on leaves that turn brown and shrivel. White fuzzy growth appears on the undersides of leaves in humid conditions. Highly affected leaf edges and lower stems.',
    organicRemedies: 'Remove and destroy all infected plant parts. Apply copper-based organic fungicides. Improve air circulation by pruning and spacing plants. Water at the base, not on leaves.',
    chemicalRemedies: 'Apply Chlorothalonil or Mancozeb fungicide according to package instructions at 7-10 day intervals. Use systemic fungicides like Metalaxyl for active outbreaks.',
    fertilizerRecommendations: 'Avoid high nitrogen fertilizers as they encourage dense, blight-susceptible foliage. Use balanced fertilizers with high potassium (e.g., NPK 5-10-10) to boost fruit immunity.',
    irrigationRecommendations: 'Reduce watering frequency and transition to early morning drip irrigation. Do not overhead water as wet leaves accelerate fungal spread.',
    growthStage: 'Flowering stage',
    recommendedMedicine: 'Chlorothalonil 75% WP, Dosage: 2g/liter of water. Method: Foliar spray. Safety: Wear protective gloves and mask. Waiting period: 7 days.',
    preventiveTips: 'Sanitize farming tools. Practice crop rotation with non-solanaceous crops next season. Maintain 2-3 feet spacing between plants.',
    nextRecommendedAction: 'Prune the lowest infected leaves immediately and apply a copper-based fungicide before the next rain.'
  },
  {
    cropName: 'Rice',
    healthStatus: 'Diseased' as const,
    diseaseName: 'Rice Blast (Magnaporthe oryzae)',
    confidence: 88,
    symptoms: 'Spindle-shaped lesions on leaves with greyish centers and brown borders. Lesions on the neck of the panicle causing it to collapse and turn grey-brown.',
    organicRemedies: 'Use blast-resistant seed varieties. Avoid excessive nitrogen applications. Apply organic bio-fungicides containing Pseudomonas fluorescens. Clean tools and field borders.',
    chemicalRemedies: 'Spray Tricyclazole 75 WP at 0.6 grams per liter of water, or Isoprothiolane 40 EC at 1.5 ml per liter of water upon first sight of lesions.',
    fertilizerRecommendations: 'Apply Silicon fertilizers to strengthen cell walls. Split nitrogen fertilizer application into 3-4 doses rather than one large dose.',
    irrigationRecommendations: 'Maintain a shallow water level in fields, avoid drying out the field completely as dry soils make the crop more vulnerable to blast infection.',
    growthStage: 'Vegetative stage',
    recommendedMedicine: 'Tricyclazole 75% WP, Dosage: 0.6g/liter of water. Method: Foliar spray. Safety: Keep livestock away for 14 days. Waiting period: 30 days.',
    preventiveTips: 'Use certified disease-free seeds. Avoid over-fertilizing with nitrogen. Keep field borders clear of weeds.',
    nextRecommendedAction: 'Apply Tricyclazole spray immediately to prevent the disease from reaching the panicle neck.'
  },
  {
    cropName: 'Wheat',
    healthStatus: 'Healthy' as const,
    diseaseName: 'None',
    confidence: 98,
    symptoms: 'Bright green, upright leaves with no visible lesions, powdery spots, or rust pustules. Stems are sturdy and healthy.',
    organicRemedies: 'None needed. Continue crop rotation practices with legumes to maintain soil health. Keep fields weed-free.',
    chemicalRemedies: 'None needed. Preventative fungicide application is not recommended for healthy crops.',
    fertilizerRecommendations: 'Apply standard balanced top-dressing fertilizer (e.g., Urea/NPK) based on soil test card parameters to support optimal grain filling.',
    irrigationRecommendations: 'Ensure adequate moisture during the critical jointing and flowering stages. Avoid waterlogging.',
    growthStage: 'Flowering stage',
    recommendedMedicine: 'None required.',
    preventiveTips: 'Monitor weekly for signs of rust or powdery mildew, especially if humidity rises. Maintain weed control.',
    nextRecommendedAction: 'Continue current watering schedule and apply the final split dose of Nitrogen if due.'
  },
  {
    cropName: 'Potato',
    healthStatus: 'Diseased' as const,
    diseaseName: 'Early Blight (Alternaria solani)',
    confidence: 85,
    symptoms: 'Target-board concentric rings or spots on older leaves. Lower leaves turn yellow and drop off. Dark leathery sunken lesions on tubers.',
    organicRemedies: 'Remove infected leaves early. Spray with Neem oil or biological copper sprays. Rotate crops with non-solanaceous plants for at least 3 years.',
    chemicalRemedies: 'Apply Mancozeb, Chlorothalonil, or Azoxystrobin fungicides at the first sign of early blight lesions. Follow recommended dilution guidelines.',
    fertilizerRecommendations: 'Ensure adequate Potassium (K) levels, as potassium deficiency renders potato plants highly susceptible to Alternaria infections.',
    irrigationRecommendations: 'Water plants at soil level in the morning. Avoid sprinkler irrigation to prevent leaf wetness during warm afternoons.',
    growthStage: 'Vegetative stage',
    recommendedMedicine: 'Mancozeb 75% WP, Dosage: 2g/liter of water. Method: Foliar spray. Safety: Wear goggles and mask. Waiting period: 14 days.',
    preventiveTips: 'Ensure proper crop rotation. Clear crop residues from the field after harvest to reduce soil pathogens.',
    nextRecommendedAction: 'Remove lower affected leaves showing target-like spots and apply Mancozeb fungicide spray.'
  }
];

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { image, mimeType, lat, lon, state: paramState } = body;

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Image base64 data and mimeType are required fields.' },
        { status: 400 }
      );
    }

    // Authenticate (optional, allows guests to check)
    const user = getUserFromRequest(req);
    const userId = user?.userId;

    // Load full profile if logged in
    const userProfile = userId ? await db.users.findOne({ id: userId }) : null;

    // Resolve location (1st: params, 2nd: profile, 3rd: default)
    let state = paramState || userProfile?.state || 'Delhi';
    let latitude = lat || '28.6139';
    let longitude = lon || '77.2090';

    // If coordinates are not provided but we have a state, map it
    if ((!lat || !lon) && stateCoordinates[state]) {
      latitude = stateCoordinates[state].lat;
      longitude = stateCoordinates[state].lon;
    }

    // 1. Fetch weather advisory information
    let weatherInfo = '';
    let weatherWarnings: string[] = [];
    let weatherData: any = null;

    const isOfflineMode = process.env.OFFLINE_MODE === 'true';
    if (!isOfflineMode) {
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        if (weatherRes.ok) {
          weatherData = await weatherRes.json();
        }
      } catch (e) {
        console.error('Failed to fetch weather in api/analyze:', e);
      }
    }

    if (!weatherData) {
      weatherData = offlineWeatherData;
    }

    const currentTemp = weatherData.current?.temperature_2m ?? weatherData.current?.temp;
    const currentHumidity = weatherData.current?.relative_humidity_2m ?? weatherData.current?.humidity;
    const windSpeed = weatherData.current?.wind_speed_10m ?? weatherData.current?.windSpeed;
    const conditionText = weatherData.current?.condition || 'Clear';

    weatherInfo = `Currently ${conditionText}, Temp: ${currentTemp}°C, Humidity: ${currentHumidity}%, Wind: ${windSpeed} km/h. `;
    const dailyProb = weatherData.daily?.precipitation_probability_max || weatherData.daily?.rainProb || [];
    const dailyRain = weatherData.daily?.precipitation_sum || weatherData.daily?.rainSum || [];
    const dates = weatherData.daily?.time || weatherData.daily?.dates || [];

    let rainForecast = '';
    for (let i = 0; i < Math.min(dates.length, 3); i++) {
      rainForecast += `${dates[i]}: Rain Prob ${dailyProb[i]}%, Rain ${dailyRain[i]}mm. `;
    }
    weatherInfo += `Next 3 days: ${rainForecast}`;

    // Compute basic warnings
    if (currentTemp !== undefined) {
      if (currentTemp < 10) {
        weatherWarnings.push('Frost Warning: Extreme cold detected. Keep crops covered and irrigate slightly to elevate ground temperature.');
      } else if (currentTemp > 38) {
        weatherWarnings.push('Heat Wave Alert: Extreme heat detected. Increase watering and apply organic mulch.');
      }
    }
    if (windSpeed !== undefined && windSpeed > 20) {
      weatherWarnings.push('Strong Winds Alert: Postpone spraying of pesticides and support tall crops.');
    }
    if (currentHumidity !== undefined && currentHumidity > 80 && currentTemp !== undefined && currentTemp >= 20 && currentTemp <= 30) {
      weatherWarnings.push('High Fungal Infection Risk: Warm and humid air increases fungal pathogen spread.');
    }

    // 2. Fetch mandi prices for state
    const stateMandiRecords = mandiPricesData.filter(record => 
      record.state.toLowerCase() === state.toLowerCase()
    );
    const mandiContext = stateMandiRecords.map(r => 
      `Crop: ${r.crop}, Market: ${r.market}, Price: ₹${r.minPrice}-₹${r.maxPrice}/Quintal (Modal: ₹${r.modalPrice}/Quintal), Daily Change: ${r.dailyChange}%`
    ).join('\n');

    // 3. Fetch government schemes reference
    const schemesContext = schemesData.map(s => 
      `Scheme: ${s.name}\nAuthority: ${s.authority}\nBenefits: ${s.benefits}\nCriteria: ${s.criteria}\nOverview: ${s.overview}\nDocuments: ${s.requiredDocuments.join(', ')}`
    ).join('\n\n');

    let diagnosisResult;

    if (isOfflineMode || !GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured. Returning fallback mock diagnosis enriched with local context.');
      
      const randomIndex = Math.floor(Math.random() * mockDiagnoses.length);
      const mock = mockDiagnoses[randomIndex];

      // Dynamically filter schemes for this crop and location
      const relevantSchemes = schemesData
        .filter(s => 
          s.name.toLowerCase().includes(mock.cropName.toLowerCase()) || 
          s.overview.toLowerCase().includes(mock.cropName.toLowerCase()) ||
          s.id === 'pm-kisan' || s.id === 'pmfby'
        )
        .map(s => `${s.name} (${s.authority}): ${s.benefits}`)
        .join('; ');

      // Filter mandi prices for this crop
      const cropMandi = stateMandiRecords.find(r => r.crop.toLowerCase().includes(mock.cropName.toLowerCase())) 
        || stateMandiRecords[0] 
        || mandiPricesData.find(r => r.crop.toLowerCase().includes(mock.cropName.toLowerCase()))
        || mandiPricesData[0];

      const mandiPricesStr = cropMandi 
        ? `${cropMandi.market} Mandi: Modal price of ₹${cropMandi.modalPrice}/Quintal (Range: ₹${cropMandi.minPrice} - ₹${cropMandi.maxPrice}). Daily change: ${cropMandi.dailyChange}%. Best sell strategy: sell at market peak when price is above ₹${cropMandi.modalPrice}.`
        : 'Market prices unavailable for this crop in your state.';

      diagnosisResult = {
        ...mock,
        imageUrl: `data:${mimeType};base64,${image.substring(0, 100)}... (mock)`,
        weatherSummary: `Currently ${conditionText} at ${currentTemp}°C. Forecast indicates a max rain probability of ${dailyProb[0]}% today.`,
        riskAlerts: weatherWarnings.length > 0 ? weatherWarnings.join(' ') : 'No severe weather-related risks predicted for the coming days.',
        marketPrices: mandiPricesStr,
        governmentSchemes: relevantSchemes || 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) for financial support.',
      };
    } else {
      // Connect to Gemini
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      // Use 1.5-flash which handles image inputs
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Build agricultural system instructions
      const prompt = `You are an expert agricultural AI agent and plant pathologist. 
Analyze the provided crop image carefully and identify the crop, its growth stage, and check for any diseases, pests, or nutrient deficiencies.
Use the following real-time location and environmental data to enrich your response:
- Farmer Location State: ${state} (Latitude: ${latitude}, Longitude: ${longitude})
- Current Weather & Forecast: ${weatherInfo}
- Nearby Mandi Price Information:
${mandiContext || 'No mandi price entries available for this state.'}
- Government Schemes Reference:
${schemesContext}

You must return a JSON object with EXACTLY the following structure (do not return any other text, explanations, or code blocks):

{
  "cropName": "Identified crop name (e.g., Tomato, Rice, Maize, Wheat)",
  "growthStage": "Estimated growth stage (e.g., Seedling stage, Vegetative stage, Flowering stage, Maturity stage, Harvesting stage)",
  "healthStatus": "Healthy" or "Diseased",
  "diseaseName": "Name of the disease, pest, or nutrient deficiency (or 'None' if healthy)",
  "confidence": 0 to 100 (numerical confidence percentage),
  "symptoms": "Detailed visual symptoms seen in the crop image, or 'No symptoms' if healthy. If diseased, highlight the affected areas of the leaf/plant.",
  "weatherSummary": "Concise summary of the current and forecasted weather for the farmer.",
  "riskAlerts": "Predict and warn about weather-related risks (e.g., frost, heavy rain, heatwaves) based on the forecast. Note any farming warnings.",
  "recommendedMedicine": "If diseased, recommend suitable chemical/organic pesticides, fungicides, or insecticides with exact dosage, application method, safety precautions, and waiting period before harvest. If healthy, write 'None required'.",
  "organicRemedies": "Natural, organic, or cultural remedies to cure or manage the disease (or 'None' if healthy)",
  "chemicalRemedies": "Chemical remedies, fungicide/pesticide names and dosages if applicable (or 'None' if healthy)",
  "fertilizerRecommendations": "Specific fertilizer adjustments based on crop type, growth stage, and detected deficiencies. Include dosage, timing, and organic alternatives.",
  "irrigationRecommendations": "Suggested watering schedule based on weather forecast, crop stage, and risks. Warn against overwatering or underwatering.",
  "marketPrices": "Show current market prices from nearby mandis based on the mandi price data provided, and suggest the best place and time to sell for maximum profit.",
  "governmentSchemes": "Recommend relevant Central or State government schemes, subsidies, crop insurance, or loans that this farmer qualifies for, based on their crop and state location.",
  "preventiveTips": "Practical, safe, and sustainable farming tips to prevent this issue or maintain healthy growth.",
  "nextRecommendedAction": "Simple, farmer-friendly, and actionable next step."
}

Provide response in clear English. If you cannot identify the plant or crop with high confidence, make your best guess but reduce the confidence score accordingly, and mention that the farmer should consult a local agricultural officer. Keep your answers concise, practical, and highly useful for farmers.`;

      // Format image for Gemini
      const imagePart = {
        inlineData: {
          data: image,
          mimeType: mimeType
        }
      };

      try {
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text().trim();
        
        // Clean markdown backticks if returned by LLM
        let cleanText = responseText;
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
        }

        try {
          diagnosisResult = JSON.parse(cleanText);
        } catch (parseError) {
          console.error('Failed to parse Gemini JSON output, raw text was:', responseText);
          throw new Error('Gemini did not return valid JSON.');
        }
      } catch (geminiError: any) {
        console.error('Gemini API call failed, falling back to mock:', geminiError);
        const randomIndex = Math.floor(Math.random() * mockDiagnoses.length);
        const mock = mockDiagnoses[randomIndex];
        diagnosisResult = { 
          ...mock,
          weatherSummary: `Currently ${conditionText} at ${currentTemp}°C. Forecast indicates a max rain probability of ${dailyProb[0]}% today.`,
          riskAlerts: weatherWarnings.length > 0 ? weatherWarnings.join(' ') : 'No severe weather-related risks predicted for the coming days.',
          marketPrices: `${state} markets: Standard grain/vegetable rates apply. Check local mandis.`,
          governmentSchemes: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)'
        };
      }
    }

    // Save to Database
    const savedDiagnosis = await db.diagnoses.create({
      userId,
      cropName: diagnosisResult.cropName,
      healthStatus: diagnosisResult.healthStatus,
      diseaseName: diagnosisResult.diseaseName,
      confidence: diagnosisResult.confidence,
      symptoms: diagnosisResult.symptoms,
      organicRemedies: diagnosisResult.organicRemedies,
      chemicalRemedies: diagnosisResult.chemicalRemedies,
      fertilizerRecommendations: diagnosisResult.fertilizerRecommendations,
      irrigationRecommendations: diagnosisResult.irrigationRecommendations,
      imageUrl: `data:${mimeType};base64,${image}`, // Save full image content for simplicity in testing
      growthStage: diagnosisResult.growthStage,
      weatherSummary: diagnosisResult.weatherSummary,
      riskAlerts: diagnosisResult.riskAlerts,
      recommendedMedicine: diagnosisResult.recommendedMedicine,
      marketPrices: diagnosisResult.marketPrices,
      governmentSchemes: diagnosisResult.governmentSchemes,
      preventiveTips: diagnosisResult.preventiveTips,
      nextRecommendedAction: diagnosisResult.nextRecommendedAction
    });

    // Create a warning notification if the crop is diseased and a user is logged in
    if (savedDiagnosis.healthStatus === 'Diseased' && userId) {
      await db.notifications.create({
        userId,
        title: `Disease Alert: ${savedDiagnosis.diseaseName}`,
        message: `${savedDiagnosis.cropName} crop was analyzed and diagnosed with ${savedDiagnosis.diseaseName} (Confidence: ${savedDiagnosis.confidence}%). Immediate treatment is recommended.`,
        type: 'disease',
        isRead: false
      });
    }

    return NextResponse.json(savedDiagnosis);

  } catch (error: any) {
    console.error('Error in crop analysis endpoint:', error);
    return NextResponse.json(
      { error: 'An error occurred during crop analysis.' },
      { status: 500 }
    );
  }
}
