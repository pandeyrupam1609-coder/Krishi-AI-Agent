'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/ClientLayout';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Languages,
  User,
  HelpCircle,
  Volume2 as SpeakerIcon
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  id: string;
}

// Translations for UI labels
const chatDict: Record<string, Record<string, string>> = {
  chatSubtitle: {
    en: 'Ask Krishi Mitra about fertilizers, pesticides, weather warnings, or government schemes',
    hi: 'उर्वरक, कीटनाशक, मौसम की चेतावनी या सरकारी योजनाओं के बारे में कृषि मित्र से पूछें',
    mr: 'खते, कीटकनाशके, हवामान किंवा शासकीय योजनांबद्दल कृषी मित्राला विचारा',
    te: 'ఎరువులు, పురుగుల మందులు, వాతావरण హెచ్చరికలు లేదా పథకాల గురించి కృషి మిత్రను అడగండి',
    ta: 'உரங்கள், பூச்சிக்கொல்லிகள், வானிலை எச்சரிக்கைகள் அல்லது திட்டங்கள் பற்றி கிருஷி மித்ராவிடம் கேளுங்கள்'
  },
  placeholderText: {
    en: 'Type your agriculture question here...',
    hi: 'यहाँ अपना कृषि संबंधी प्रश्न लिखें...',
    mr: 'तुमचा शेतीविषयक प्रश्न येथे लिहा...',
    te: 'మీ వ్యవసాయ ప్రశ్నను ఇక్కడ టైప్ చేయండి...',
    ta: 'உங்கள் விவசாய கேள்வியை இங்கே தட்டச்சு செய்யவும்...'
  },
  listeningText: {
    en: 'Listening... Speak now',
    hi: 'सुन रहा हूँ... अब बोलें',
    mr: 'ऐकत आहे... आता बोला',
    te: 'వింటున్నాను... ఇప్పుడు మాట్లాడండి',
    ta: 'கேட்கிறது... இப்போது பேசவும்'
  },
  suggestionTitle: {
    en: 'Suggested Queries',
    hi: 'सुझाए गए प्रश्न',
    mr: 'सुचवलेले प्रश्न',
    te: 'సూచించిన ప్రశ్నలు',
    ta: 'பரிந்துரைக்கப்பட்ட கேள்விகள்'
  }
};

const suggestedQueries: Record<string, string[]> = {
  en: [
    'How do I treat Late Blight on my tomatoes?',
    'What fertilizers are best for wheat during Rabi season?',
    'How can I apply for the PM-KISAN subsidy?',
    'What crop protections should I use before heavy rain?'
  ],
  hi: [
    'टमाटर के पछेती झुलसा रोग का उपचार कैसे करें?',
    'रबी सीजन में गेहूं के लिए कौन सी खाद सबसे अच्छी है?',
    'पीएम-किसान सम्मान निधि के लिए आवेदन कैसे करें?',
    'भारी बारिश से पहले मुझे कौन सा कीटनाशक छिड़कना चाहिए?'
  ],
  mr: [
    'टोमॅटोवरील करपा रोगावर काय उपाय करावा?',
    'गव्हासाठी कोणते खत सर्वात चांगले आहे?',
    'पीएम-किसान योजनेचा लाभ कसा घ्यावा?',
    'पावसाळ्यापूर्वी पिकांची काय काळजी घ्यावी?'
  ],
  te: [
    'టమోటా లేట్ బ్లైట్ వ్యాధి నివారణ ఎలా?',
    'గోధుమ పంటకు ఏ ఎరువులు వేయాలి?',
    'PM-KISAN పథకానికి ఎలా దరखाస్తు చేసుకోవాలి?',
    'వర్షానికి ముందు పంటను ఎలా కాపాడుకోవాలి?'
  ],
  ta: [
    'தக்காளி இலை கருகல் நோயை குணப்படுத்துவது எப்படி?',
    'கோதுமை பயிருக்கு சிறந்த உரம் எது?',
    'பிஎம்-கிசான் திட்டத்திற்கு எவ்வாறு விண்ணப்பிப்பது?',
    'மழைக்கு முன் பயிர்களை எவ்வாறு பாதுகாப்பது?'
  ]
};

// Map languages to Speech Recognition locales
const langLocales: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  ta: 'ta-IN'
};

export default function ChatbotPage() {
  const { language, setLanguage } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechError, setSpeechError] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Welcome Message when language changes
  useEffect(() => {
    const welcomeMessages: Record<string, string> = {
      en: "Hello! I am Krishi Mitra, your farming assistant. Ask me anything about crop health, weather protection, or agricultural schemes.",
      hi: "नमस्ते! मैं कृषि मित्र हूँ, आपका सहायक। मुझसे फसलों के स्वास्थ्य, मौसम की सुरक्षा या कृषि योजनाओं के बारे में कुछ भी पूछें।",
      mr: "नमस्कार! मी कृषी मित्र आहे. मला पिकांचे आरोग्य, खते, हवामान संरक्षण किंवा शासकीय योजनांविषयी काहीही विचारा.",
      te: "నమస్కారం! నేను కృషి మిత్ర, మీ సహాయకుడిని. పంటల ఆరోగ్యం, వాతావరణం, లేదా వ్యవసాయ పథకాల గురించి నన్ను అడగండి.",
      ta: "வணக்கம்! நான் கிருஷி மித்ரா, உங்கள் விவசாய உதவியாளர். பயிர் ஆரோக்கியம், வானிலை பாதுகாப்பு அல்லது விவசாய திட்டங்கள் பற்றி என்னிடம் கேளுங்கள்."
    };

    setMessages([
      {
        role: 'model',
        content: welcomeMessages[language] || welcomeMessages['en'],
        id: 'welcome'
      }
    ]);
  }, [language]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
          setIsListening(true);
          setSpeechError('');
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone permission blocked. Please check browser privacy permissions.');
          } else {
            setSpeechError('Could not understand voice. Please speak again.');
          }
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('Voice dictation is not supported by your current browser. Try Chrome/Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSpeechError('');
      recognitionRef.current.lang = langLocales[language] || 'en-IN';
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // TTS Voice Speech Synthesizer
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    // Stop currently active synthesizers
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice language locale
    utterance.lang = langLocales[language] || 'en-IN';
    utterance.rate = 0.95; // slightly slower for better farmer comprehension
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      id: Math.random().toString(36).substring(2, 11)
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setSpeechError('');

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
          language
        })
      });

      const data = await res.json();
      if (res.ok) {
        const botMessage: ChatMessage = {
          role: 'model',
          content: data.reply,
          id: Math.random().toString(36).substring(2, 11)
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Auto speak if sound toggle is on
        if (soundEnabled) {
          speakText(data.reply);
        }
      } else {
        setSpeechError('Krishi Mitra is experiencing high load. Please try again.');
      }
    } catch (err) {
      setSpeechError('Network error. Check connection and send again.');
    } finally {
      setLoading(false);
    }
  };

  const t = (key: string) => {
    return chatDict[key]?.[language] || chatDict[key]?.['en'] || key;
  };

  const queries = suggestedQueries[language] || suggestedQueries['en'] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[80vh] max-h-[80vh]">
      
      {/* Active Conversation Drawer (Left - 3 columns width) */}
      <div className="lg:col-span-3 glass-panel rounded-3xl border border-slate-900 flex flex-col h-full overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200">Krishi Mitra</h3>
              <p className="text-[10px] text-slate-400">Expert Farming AI Assistant • Online</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button 
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (soundEnabled) window.speechSynthesis?.cancel(); // cancel speak
              }}
              className={`p-2 rounded-lg border transition ${
                soundEnabled 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title="Toggle Audio Feedback"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => {
            const isModel = msg.role === 'model';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${isModel ? 'mr-auto text-left' : 'ml-auto text-right flex-row-reverse'}`}
              >
                {/* Bubble Icon */}
                <div className={`w-8 h-8 rounded-full border flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                  isModel 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  {isModel ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                </div>

                {/* Content Bubble */}
                <div className={`p-3.5 rounded-2xl border relative group ${
                  isModel 
                    ? 'bg-slate-900/60 border-slate-800/80 text-slate-200 rounded-tl-none' 
                    : 'bg-gradient-to-r from-emerald-600/15 to-teal-600/10 border-emerald-500/20 text-emerald-300 rounded-tr-none text-left'
                }`}>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* TTS Button on model messages */}
                  {isModel && (
                    <button 
                      onClick={() => speakText(msg.content)}
                      className="absolute right-2 bottom-1.5 opacity-0 group-hover:opacity-100 p-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition"
                      title="Speak Response"
                    >
                      <SpeakerIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[85%] mr-auto text-left">
              <div className="w-8 h-8 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="p-3.5 rounded-2xl border bg-slate-900/60 border-slate-800/80 text-slate-400 rounded-tl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 flex flex-col gap-2 flex-shrink-0">
          {speechError && (
            <p className="text-[10px] text-rose-400 font-semibold mb-1">{speechError}</p>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }} 
            className="flex items-center gap-3"
          >
            {/* Microphone dictation trigger */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3.5 rounded-xl border transition flex-shrink-0 cursor-pointer ${
                isListening 
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak your question'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input fields */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? t('listeningText') : t('placeholderText')}
              disabled={isListening}
              className="flex-1 p-3.5 bg-slate-900/80 border border-slate-800 text-slate-100 rounded-xl text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-75"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>

      {/* Suggested Queries & Language Quick-Jump Panel (Right - 1 col width) */}
      <div className="lg:col-span-1 space-y-6 flex flex-col h-full overflow-hidden">
        
        {/* Suggestion block */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-900 flex-grow flex flex-col overflow-hidden">
          <h3 className="text-sm font-bold text-slate-200 pb-3 border-b border-slate-800/80 mb-4 flex items-center gap-2 flex-shrink-0">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            {t('suggestionTitle')}
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {queries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900 text-[11px] text-slate-300 font-semibold leading-relaxed transition disabled:opacity-50 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Info panel */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-900 flex-shrink-0">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Languages className="w-4 h-4 text-teal-400" />
            AI Language Engine
          </h3>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Krishi Mitra translates and processes speech natively. Switch your preferred app language in the sidebar/header to ask questions in your mother tongue.
          </p>
        </div>

      </div>

    </div>
  );
}
