import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Mock responses dictionary for offline fallback
const mockResponses: { keywords: string[]; replies: Record<string, string> }[] = [
  {
    keywords: ['tomato', 'tamatar', 'late blight', 'blight'],
    replies: {
      en: "Late blight is a serious tomato disease caused by the fungus Phytophthora infestans. Remove all infected leaves immediately and apply copper-based organic sprays or chemical Mancozeb. Water plants at the base early in the morning.",
      hi: "टमाटर में पछेती झुलसा (लेट ब्लाइट) एक गंभीर बीमारी है। संक्रमित पत्तियों को तुरंत हटा दें, जैविक तांबा कवकनाशी या मैन्कोजेब का छिड़काव करें। पौधों को सुबह के समय सीधे जड़ों में पानी दें।"
    }
  },
  {
    keywords: ['fertilizer', 'khad', 'urea', 'npk', 'nitrogen'],
    replies: {
      en: "For leafy growth, use Nitrogen-rich fertilizer (like Urea). For flowering and roots, use Phosphorus (like DAP) and Potassium (Muriate of Potash). Always perform a soil test card review before application.",
      hi: "पत्तियों के विकास के लिए नाइट्रोजन युक्त खाद (जैसे यूरिया) का प्रयोग करें। फूल आने और जड़ों के लिए फास्फोरस (डीएपी) और पोटेशियम का उपयोग करें। खाद डालने से पहले मिट्टी का परीक्षण जरूर करवाएं।"
    }
  },
  {
    keywords: ['weather', 'mausam', 'rain', 'barish', 'thand'],
    replies: {
      en: "Keep an eye on regional weather warnings. If heavy rain is expected within 24 hours, avoid applying top-dress fertilizer or spraying pesticides, as they will wash away.",
      hi: "मौसम की चेतावनियों पर नज़र रखें। यदि अगले 24 घंटों में भारी बारिश की संभावना है, तो खाद या कीटनाशकों के छिड़काव से बचें, क्योंकि वे पानी में बह जाएंगे।"
    }
  },
  {
    keywords: ['subsidy', 'scheme', 'yojana', 'paisa', 'pm kisan'],
    replies: {
      en: "The PM-KISAN scheme provides ₹6,000 yearly in three installments to small farmers. PM Fasal Bima Yojana offers crop insurance coverage against natural disasters. Check the Schemes tab for full eligibility.",
      hi: "पीएम-किसान योजना के तहत छोटे किसानों को सालाना ₹6,000 तीन किस्तों में दिए जाते हैं। पीएम फसल बीमा योजना प्राकृतिक आपदाओं के खिलाफ फसल बीमा प्रदान करती है। पूरी जानकारी के लिए 'योजनाएं' टैब देखें।"
    }
  }
];

const generalReplies: Record<string, string> = {
  en: "Hello! I am Krishi Mitra, your AI farming assistant. I can help you with crop health, fertilizer suggestions, irrigation methods, and market prices. What would you like to ask today?",
  hi: "नमस्कार! मैं कृषि मित्र हूँ, आपका एआई खेती सहायक। मैं फसल स्वास्थ्य, खाद के सुझाव, सिंचाई के तरीकों और मंडी भाव में आपकी मदद कर सकता हूँ। आज आप क्या पूछना चाहते हैं?",
  mr: "नमस्कार! मी कृषी मित्र आहे, आपला एआय शेती सहाय्यक. मी पीक आरोग्य, खत शिफारसी, आणि बाजार भावाबद्दल माहिती देऊ शकतो. आज आपल्याला काय विचारायचे आहे?",
  te: "నమస్కారం! నేను కృషి मित्र, మీ వ్యవసాయ సహాయకుడిని. పంటల సంరక్షణ, ఎరువులు మరియు మార్కెట్ ధరలపై నేను మీకు సహాయం చేయగలను. ఈరోజు మీ ప్రశ్న ఏమిటి?",
  ta: "வணக்கம்! நான் கிருஷி மித்ரா, உங்கள் விவசாய உதவியாளர். பயிர் ஆரோக்கியம், உரம் மற்றும் சந்தை விலைகள் பற்றி உங்களுக்கு நான் உதவ முடியும். இன்று நீங்கள் என்ன கேட்க விரும்புகிறீர்கள்?"
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, language = 'en' } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const lowerMsg = message.toLowerCase();

    // Fallback: If Gemini is not set up
    if (!GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured. Returning local mock chatbot reply.');
      
      // Match keywords in mock responses
      let replyText = '';
      for (const item of mockResponses) {
        if (item.keywords.some(kw => lowerMsg.includes(kw))) {
          replyText = item.replies[language] || item.replies['en'];
          break;
        }
      }

      if (!replyText) {
        replyText = generalReplies[language] || generalReplies['en'];
        // Append context-aware helpful sentence
        if (language === 'hi') {
          replyText += ` (योर संदेश: "${message}". हमने आपके संदेश से संबंधित जानकारी खोजी, उचित परिणाम के लिए कृपया यूरिया, टमाटर, या मौसम जैसे शब्दों का प्रयोग करें)`;
        } else {
          replyText += ` (Your message: "${message}". For specific mock results try asking about: tomato, fertilizer, weather, or schemes)`;
        }
      }

      return NextResponse.json({ reply: replyText });
    }

    // Call Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Format chat history for Gemini
    const chatSession = model.startChat({
      generationConfig: {
        maxOutputTokens: 1000,
      },
      systemInstruction: `You are "Krishi Mitra" (meaning Farmer's Friend), a knowledgeable, compassionate, and highly professional AI agricultural agent. 
Your goal is to assist farmers with their questions about crop diseases, pest management, fertilizers, organic farming, modern machinery, weather-related crop protection, and government schemes.

Provide your responses in the language requested by the user: "${language}". 
Make sure you use a simple, encouraging, and direct tone. Avoid high-level technical jargon where possible, or explain it in simple terms.
If the farmer asks in Hindi, reply in clear, natural Hindi. If Marathi, reply in Marathi, and so on.
If the question is unrelated to agriculture, farming, weather, or rural livelihoods, politely guide them back to agricultural topics. Keep responses concise and easy to read.`,
      history: (history || []).map((chat: any) => ({
        role: chat.role === 'user' ? 'user' : 'model',
        parts: [{ text: chat.content }]
      }))
    });

    const result = await chatSession.sendMessage(message);
    const replyText = result.response.text();

    return NextResponse.json({ reply: replyText });

  } catch (error: any) {
    console.error('Error in chatbot api endpoint:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating chatbot response.' },
      { status: 500 }
    );
  }
}
