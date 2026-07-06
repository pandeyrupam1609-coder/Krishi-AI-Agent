import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { offlineSchemesData } from '@/lib/offlineData';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface Scheme {
  id: string;
  name: string;
  authority: string;
  benefits: string;
  criteria: string;
  overview: string;
  requiredDocuments: string[];
}

export const schemesData: Scheme[] = [
  {
    id: 'pm-kisan',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    authority: 'Ministry of Agriculture and Farmers Welfare, Govt of India',
    benefits: 'Direct financial assistance of ₹6,000 per year, paid in three equal installments of ₹2,000 directly into bank accounts.',
    criteria: 'All landholding farmer families who own cultivable land in their names are eligible. Taxpayers, institutional landholders, and retired government employees are excluded.',
    overview: 'PM-KISAN is a central sector scheme to supplement financial needs of farmers for procuring inputs to ensure proper crop health and appropriate yields.',
    requiredDocuments: ['Aadhaar Card', 'Land Ownership Documents (Khatauni/Patta)', 'Active Bank Account details', 'Mobile Number linked to Aadhaar']
  },
  {
    id: 'pmfby',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    authority: 'Ministry of Agriculture and Farmers Welfare, Govt of India',
    benefits: 'Comprehensive crop insurance covering risk of yield loss from non-preventable risks (drought, flood, pests, diseases). Low farmer premium: 1.5% for Rabi, 2% for Kharif, 5% for commercial crops.',
    criteria: 'Available for all farmers growing notified food crops, oilseeds, and commercial/horticultural crops in notified areas.',
    overview: 'Provides affordable crop insurance protection. Aims to support sustainable production by stabilizing farmer income after unforeseen crop failures.',
    requiredDocuments: ['Land Record document', 'Sowing Certificate from Patwari/Sarpanch', 'Bank Passbook copy', 'ID Proof (Aadhaar/Voter Card)']
  },
  {
    id: 'soil-health-card',
    name: 'Soil Health Card Scheme',
    authority: 'Department of Agriculture, Cooperation & Farmers Welfare, Govt of India',
    benefits: 'Free soil testing. Providing farmers with printed soil cards containing nutrient status of soil across 12 parameters (N, P, K, pH, etc.) and corrective dosage recommendations.',
    criteria: 'Open to all farmers in India. Soil samples are collected and evaluated once every two years.',
    overview: 'Assists farmers in identifying nutrient deficiencies, allowing them to buy exact fertilizer types and volumes, preventing chemical over-application and saving money.',
    requiredDocuments: ['Land Identification survey number', 'Farmer Registration Card']
  },
  {
    id: 'smam-machinery',
    name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    authority: 'Govt of India in partnership with State Agricultural Departments',
    benefits: 'Financial subsidies ranging from 40% to 80% for purchase of agricultural machinery (tractors, rotavators, power tillers, drone sprayers).',
    criteria: 'Small, marginal, and female farmers receive higher subsidy priority. Must own farm lands.',
    overview: 'Promotes agricultural mechanization to increase efficiency, reduce labour dependency, and lower production costs.',
    requiredDocuments: ['Land Revenue receipt', 'Aadhaar Card', 'Category Certificate (SC/ST/OBC if applicable)', 'Quotations of implements to buy']
  }
];

export async function GET() {
  return NextResponse.json(schemesData);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schemeId, farmerProfile } = body;

    if (!schemeId || !farmerProfile) {
      return NextResponse.json(
        { error: 'schemeId and farmerProfile are required fields.' },
        { status: 400 }
      );
    }

    const scheme = schemesData.find(s => s.id === schemeId);
    if (!scheme) {
      return NextResponse.json({ error: 'Scheme not found.' }, { status: 404 });
    }

    const { name, state, farmSize, cropTypes = [] } = farmerProfile;
    const farmSizeNum = parseFloat(farmSize) || 0;

    let evaluationResult;

    if (!GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured. Running local deterministic scheme evaluator.');
      // Direct rule evaluation
      let isEligible = 'Potentially Eligible';
      let confidence = 80;
      let reason = '';

      if (schemeId === 'pm-kisan') {
        if (farmSizeNum > 0 && farmSizeNum <= 5) {
          isEligible = 'Eligible';
          confidence = 95;
          reason = `Hello ${name || 'Farmer'}. With a farm size of ${farmSizeNum} hectares in ${state || 'your state'}, you meet the primary landholding criteria for PM-KISAN. Your land holdings fall in the small-to-medium bracket. Ensure the land deeds are in your name.`;
        } else if (farmSizeNum > 5) {
          isEligible = 'Eligible';
          confidence = 85;
          reason = `While PM-KISAN is now expanded to all landholding families, larger holdings of ${farmSizeNum} ha undergo strict reviews regarding business usage. You are eligible, provided you are not an institutional owner or taxpayer.`;
        } else {
          isEligible = 'Potentially Eligible';
          confidence = 70;
          reason = `Please update your farm size in your profile to check exact PM-KISAN eligibility. If you own cultivable land, you generally qualify.`;
        }
      } else if (schemeId === 'pmfby') {
        if (cropTypes.length > 0) {
          isEligible = 'Eligible';
          confidence = 90;
          reason = `Your crops (${cropTypes.join(', ')}) are covered under PMFBY. Since you grow standard crops, you can buy the insurance from nearest bank branch or cooperative society before sowing. Premium rates will be very low (1.5% - 2%).`;
        } else {
          isEligible = 'Eligible';
          confidence = 80;
          reason = `PMFBY covers almost all crops. Enter your active crop lists in your profile to check crop-specific insurance premiums.`;
        }
      } else {
        isEligible = 'Eligible';
        confidence = 90;
        reason = `You qualify for this scheme. It is open to all active farmers registered in ${state || 'India'}. Proceed with organizing your Aadhaar Card and Land Records.`;
      }

      evaluationResult = {
        status: isEligible,
        confidence,
        explanation: reason,
        requiredSteps: scheme.requiredDocuments.map(doc => `Verify you have: ${doc}`)
      };
    } else {
      // Use Gemini to analyze eligibility
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Evaluate if the following farmer qualifies for the scheme: "${scheme.name}".
Farmer Profile:
- Name: ${name || 'N/A'}
- State/Location: ${state || 'N/A'}
- Land Owned: ${farmSize || 'N/A'} Hectares
- Cultivated Crops: ${cropTypes.join(', ') || 'N/A'}

Scheme Details:
- Authority: ${scheme.authority}
- Benefits: ${scheme.benefits}
- Criteria: ${scheme.criteria}

Determine eligibility status: 'Eligible', 'Potentially Eligible', or 'Ineligible'.
Output a JSON object matching this schema (do not write any explanations, markdown code blocks, or extra text):
{
  "status": "Eligible" | "Potentially Eligible" | "Ineligible",
  "confidence": 0 to 100,
  "explanation": "Provide a simple, personalized explanation of why they qualify, noting any critical rules (e.g. land limits, crop conditions) that apply to their profile.",
  "requiredSteps": ["Step 1: Check document X", "Step 2: Submit form at Y"]
}`;

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        
        let cleanText = text;
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
        }

        evaluationResult = JSON.parse(cleanText);
      } catch (geminiError) {
        console.error('Gemini scheme evaluation failed, using local fallback:', geminiError);
        // Fallback to deterministic rules if parse fails
        evaluationResult = {
          status: 'Eligible',
          confidence: 85,
          explanation: `Based on your land size of ${farmSize || '0'} ha in ${state || 'India'}, you generally qualify for ${scheme.name}. Organize your papers to apply.`,
          requiredSteps: scheme.requiredDocuments.map(doc => `Verify you have: ${doc}`)
        };
      }
    }

    return NextResponse.json(evaluationResult);

  } catch (error) {
    console.error('Error in scheme evaluation endpoint:', error);
    return NextResponse.json(
      { error: 'An error occurred during eligibility analysis.' },
      { status: 500 }
    );
  }
}
