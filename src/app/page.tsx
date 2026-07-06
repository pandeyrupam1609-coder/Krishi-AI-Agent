'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sprout, 
  Bot, 
  TrendingUp, 
  Award, 
  CloudSun, 
  ArrowRight,
  ShieldCheck, 
  MessageCircle,
  Activity,
  Mic
} from 'lucide-react';
import { useApp } from '@/components/ClientLayout';

export default function LandingPage() {
  const { language } = useApp();

  const landingDict: Record<string, Record<string, string>> = {
    heroTitle: {
      en: 'Empower Your Farming with AI Intelligence',
      hi: 'कृषि में कृत्रिम बुद्धिमत्ता (AI) का वरदान',
      mr: 'एआय तंत्रज्ञानाने तुमची शेती समृद्ध करा',
      te: 'AI విజ్ఞానంతో మీ వ్యవసాయాన్ని బలోపేతం చేయండి',
      ta: 'AI நுண்ணறிவு மூலம் உங்கள் விவசாயத்தை மேம்படுத்துங்கள்'
    },
    heroSubtitle: {
      en: 'Upload crop images to diagnose diseases instantly, consult with our multilingual voice assistant, view mandi prices, and check eligibility for government schemes.',
      hi: 'फसलों के रोगों का तुरंत निदान करने के लिए तस्वीरें अपलोड करें, हमारी बहुभाषी आवाज सहायक से सलाह लें, मंडी भाव देखें और सरकारी योजनाओं की पात्रता जांचें।',
      mr: 'पिकांच्या रोगांचे त्वरित निदान करण्यासाठी फोटो अपलोड करा, आमच्या कृषी मित्राशी बोलून सल्ला घ्या, आणि चालू बाजार भाव मिळवा.',
      te: 'పంటల వ్యాధులను తక్షణమే గుర్తించడానికి ఫోటోలను అప్‌లోడ్ చేయండి, వాయిస్ అసిస్టెంట్‌తో మాట్లాడండి మరియు ప్రభుత్వ పథకాల వివరాలు తెలుసుకోండి.',
      ta: 'பயிர்களின் நோய்களை உடனடியாக கண்டறிய படங்களை பதிவேற்றவும், குரல் உதவியாளருடன் பேசவும் மற்றும் அரசு திட்டங்களை அறியவும்.'
    },
    getStarted: { en: 'Get Started', hi: 'शुरू करें', mr: 'सुरू करा', te: 'ప్రారంభించండి', ta: 'தொடங்கவும்' },
    guestMode: { en: 'Try Guest Mode', hi: 'अतिथि मोड आज़माएं', mr: 'अतिथी मोड', te: 'గెస్ట్ మోడ్', ta: 'விருந்தினர் பயன்முறை' }
  };

  const getTranslation = (key: string) => {
    return landingDict[key]?.[language] || landingDict[key]?.[ 'en'] || key;
  };

  const features = [
    {
      title: 'AI Crop Diagnosis',
      desc: 'Scan crops with your mobile camera to detect infections, fungal growth, and nutrient deficiencies. Receive instant organic and chemical treatments.',
      icon: Sprout,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Multilingual Chatbot (Voice & Text)',
      desc: 'Speak to Krishi Mitra in your native language. Our AI translates voice messages to guide you on fertilizer inputs, water limits, and crop safety.',
      icon: Mic,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
    },
    {
      title: 'Real-Time Mandi Prices',
      desc: 'Check crop price indices from active mandis in your district. Track daily changes and 6-month historical price trends to sell at peak values.',
      icon: TrendingUp,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'Live Weather Crop Warnings',
      desc: 'Retrieve local weather conditions combined with agricultural intelligence. Get alerts for frost, heavy rain, or high-humidity fungal risk days.',
      icon: CloudSun,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Government Schemes Explorer',
      desc: 'Fill out a simple farm profile and ask our AI eligibility model which central and state subsidies (like PM-KISAN or PMFBY) you qualify for.',
      icon: Award,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10"></div>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto text-center pt-16 pb-20 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <Activity className="w-3.5 h-3.5" /> Next-Gen Smart Farming
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-[1.1] mb-6">
          {getTranslation('heroTitle')}
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          {getTranslation('heroSubtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/auth/signup" 
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-base font-bold shadow-[0_4px_25px_rgba(16,185,129,0.25)] transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {getTranslation('getStarted')} <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/60 hover:bg-slate-900/90 text-slate-200 hover:text-white rounded-2xl text-base font-bold border border-slate-800 hover:border-slate-700 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {getTranslation('guestMode')}
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 glow-text-emerald">
            Everything a Farmer Needs, Connected in One App
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Powered by modern AI algorithms and local data resources to help maximize yields, protect crops, and monitor market prices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx}
                className="glass-panel p-6 rounded-3xl flex flex-col items-start text-left border border-slate-900/80 hover:-translate-y-1 transition duration-300"
              >
                <div className={`p-3 rounded-2xl border mb-5 ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2.5">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed flex-grow">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats / Trust Badges */}
      <section className="max-w-4xl mx-auto border-t border-slate-900 py-16 px-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="glass-panel py-8 rounded-2xl border border-slate-950">
            <span className="block text-3xl font-extrabold text-emerald-400 glow-text-emerald">99%</span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">AI Accuracy</span>
          </div>
          <div className="glass-panel py-8 rounded-2xl border border-slate-950">
            <span className="block text-3xl font-extrabold text-teal-400">5+</span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">Languages</span>
          </div>
          <div className="glass-panel py-8 rounded-2xl border border-slate-950">
            <span className="block text-3xl font-extrabold text-amber-400">Zero</span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">Setup Cost</span>
          </div>
        </div>
      </section>

    </div>
  );
}
