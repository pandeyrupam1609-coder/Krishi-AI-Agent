'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/ClientLayout';
import { 
  CloudSun, 
  TrendingUp, 
  Bell, 
  Sprout, 
  IndianRupee, 
  ArrowRight, 
  AlertTriangle,
  User, 
  MapPin, 
  Activity,
  History,
  Info,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface WeatherState {
  current?: {
    temp: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    weatherCode: number;
  };
  warnings: string[];
}

interface MandiSummaryItem {
  id: string;
  crop: string;
  state: string;
  market: string;
  modalPrice: number;
  dailyChange: number;
}

interface DiagnosisHistoryItem {
  id: string;
  cropName: string;
  healthStatus: 'Healthy' | 'Diseased';
  diseaseName?: string;
  confidence: number;
  imageUrl?: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user, token, language } = useApp();
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [mandiPrices, setMandiPrices] = useState<MandiSummaryItem[]>([]);
  const [mandiLoading, setMandiLoading] = useState(true);
  const [history, setHistory] = useState<DiagnosisHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Multilingual translations for dashboard widgets
  const dashboardDict: Record<string, Record<string, string>> = {
    profileCard: { en: 'Farm Profile', hi: 'कृषि प्रोफ़ाइल', mr: 'शेती प्रोफाइल', te: 'వ్యవసాయ ప్రొఫైల్', ta: 'விவசாய சுயவிவரம்' },
    farmSizeText: { en: 'Farm Size', hi: 'खेत का आकार', mr: 'शेतीचे क्षेत्र', te: 'వ్యవసాయ పరిమాణం', ta: 'பண்ணை அளவு' },
    cropsText: { en: 'Crops', hi: 'फसलें', mr: 'पिके', te: 'పంటలు', ta: 'பயிர்கள்' },
    weatherWidgetTitle: { en: 'Weather Advisory', hi: 'मौसम सलाहकार', mr: 'हवामान सल्लागार', te: 'వాతావरण సలహా', ta: 'வானிலை ஆலோசனை' },
    weatherHumidity: { en: 'Humidity', hi: 'आर्द्रता (नमी)', mr: 'दमटपणा', te: 'తేమ', ta: 'ஈரப்பதம்' },
    weatherWind: { en: 'Wind Speed', hi: 'हवा की गति', mr: 'वाऱ्याचा वेग', te: 'గాలి వేగం', ta: 'காற்றின் வேகம்' },
    mandiWidgetTitle: { en: 'Market Price Watch', hi: 'मंडी भाव लाइव', mr: 'मंडी भाव थेट', te: 'మండి ధరల పరిశీలన', ta: 'மண்டி விலை கண்காணிப்பு' },
    mandiChange: { en: 'Daily Change', hi: 'दैनिक परिवर्तन', mr: 'दैनिक बदल', te: 'రోజువारी మార్పు', ta: 'தினசரி மாற்றம்' },
    recentDiagTitle: { en: 'Crop Diagnosis History', hi: 'फसल निदान इतिहास', mr: 'पीक रोग इतिहास', te: 'పంట వ్యాధి నిర్ధారణ చరిత్ర', ta: 'பயிர் நோய் கண்டறிதல் வரலாறு' },
    viewAll: { en: 'View All', hi: 'सभी देखें', mr: 'सर्व पहा', te: 'అన్నీ చూడు', ta: 'அனைத்தையும் பார்' },
    guestWarning: {
      en: 'You are using Guest Mode. Login to save your diagnostics timeline, track crop histories, and receive direct field alerts.',
      hi: 'आप अतिथि मोड का उपयोग कर रहे हैं। अपने फसल इतिहास को सहेजने और सीधे अलर्ट प्राप्त करने के लिए लॉगिन करें।',
      mr: 'आपण अतिथी मोड वापरत आहात. आपला इतिहास जतन करण्यासाठी आणि थेट अलर्ट मिळवण्यासाठी लॉगिन करा.',
      te: 'మీరు గెస్ట్ మోడ్‌ను ఉపయోగిస్తున్నారు. మీ పంట చరిత్రను సేవ్ చేయడానికి మరియు అలర్ట్‌లను పొందడానికి లాగిన్ అవ్వండి.',
      ta: 'நீங்கள் விருந்தினர் பயன்முறையை பயன்படுத்துகிறீர்கள். வரலாற்றை சேமிக்க மற்றும் விழிப்பூட்டல்களைப் பெற உள்நுழையவும்.'
    }
  };

  const t = (key: string) => {
    return dashboardDict[key]?.[language] || dashboardDict[key]?.['en'] || key;
  };

  // Fetch weather based on user location state or default
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        let lat = '28.6139'; // Delhi default
        let lon = '77.2090';

        // Check if user has specific state coordinates (mock mapping for Indian States)
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

        if (user && user.state && stateCoordinates[user.state]) {
          lat = stateCoordinates[user.state].lat;
          lon = stateCoordinates[user.state].lon;
        }

        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (res.ok) {
          const data = await res.json();
          setWeather(data);
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [user]);

  // Fetch Mandi market summaries
  useEffect(() => {
    const fetchMandi = async () => {
      try {
        const res = await fetch('/api/mandi');
        if (res.ok) {
          const data = await res.json();
          // Take first 3 records for summary
          setMandiPrices(data.records.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch mandi:', err);
      } finally {
        setMandiLoading(false);
      }
    };

    fetchMandi();
  }, []);

  // Fetch crop health history (if logged in)
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) {
        setHistoryLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.slice(0, 3)); // show top 3 on dashboard
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  return (
    <div className="space-y-6">
      
      {/* Guest Mode Alert Banner */}
      {!user && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex gap-3.5 items-center leading-relaxed">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1">
            {t('guestWarning')}
          </div>
          <Link href="/auth/signup" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition duration-150 flex-shrink-0 text-center">
            Sign Up
          </Link>
        </div>
      )}

      {/* Main Grid: Weather, Mandi, Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weather Widget */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2 border border-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-emerald-400" />
              {t('weatherWidgetTitle')}
            </h3>
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              {user?.state || 'New Delhi, DL'}
            </span>
          </div>

          {weatherLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : weather?.current ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tighter">
                    {weather.current.temp}°C
                  </span>
                  <span className="block text-sm text-emerald-400 font-bold mt-1.5">
                    {weather.current.condition}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-xs text-slate-400">
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-500">{t('weatherHumidity')}</span>
                    <span className="font-bold text-slate-300">{weather.current.humidity}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-500">{t('weatherWind')}</span>
                    <span className="font-bold text-slate-300">{weather.current.windSpeed} km/h</span>
                  </div>
                </div>
              </div>

              {/* Weather-based Crop Advisories */}
              {weather.warnings.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Agricultural Bulletins
                  </p>
                  <div className="space-y-2">
                    {weather.warnings.map((w, idx) => (
                      <div key={idx} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-200/90 leading-relaxed flex gap-2">
                        <span className="text-amber-500">•</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">Unable to load weather warnings.</p>
          )}
        </div>

        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-900 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2 pb-4 border-b border-slate-800/80 mb-5">
              <User className="w-5 h-5 text-emerald-400" />
              {t('profileCard')}
            </h3>

            {user ? (
              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-slate-500">Farmer Name</span>
                  <span className="text-sm font-bold text-slate-200">{user.name}</span>
                </div>
                
                {user.farmSize && (
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-500">{t('farmSizeText')}</span>
                    <span className="text-sm font-bold text-slate-200">{user.farmSize} Hectares</span>
                  </div>
                )}

                {user.cropTypes && user.cropTypes.length > 0 && (
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">{t('cropsText')}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.cropTypes.map(c => (
                        <span key={c} className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold rounded-md">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 mb-4">No farmer profile logged in.</p>
                <Link href="/auth/signup" className="w-full inline-flex justify-center items-center gap-1.5 py-2.5 px-4 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 text-xs font-bold rounded-xl transition duration-150">
                  Register Account <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
          
          {user && (
            <div className="pt-4 border-t border-slate-800/50 mt-4 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-emerald-500" /> Account Active</span>
              <span>ID: #{user.id}</span>
            </div>
          )}
        </div>

      </div>

      {/* Grid: Mandi prices overview and Recent Diagnosis list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Mandi Price Watch widget */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              {t('mandiWidgetTitle')}
            </h3>
            <Link href="/market" className="text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline flex items-center gap-0.5">
              {t('viewAll')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {mandiLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : mandiPrices.length > 0 ? (
            <div className="divide-y divide-slate-800/40">
              {mandiPrices.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <span className="font-bold text-sm text-slate-200 block">{item.crop}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{item.market} ({item.state})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-slate-100 block flex items-center justify-end gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400" /> {item.modalPrice} <span className="text-[10px] font-normal text-slate-400">/Qtl</span>
                    </span>
                    <span className={`text-[10px] font-bold block mt-0.5 ${item.dailyChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.dailyChange > 0 ? '+' : ''}{item.dailyChange}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">No market price records found.</p>
          )}
        </div>

        {/* Diagnosis History Widget */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              {t('recentDiagTitle')}
            </h3>
            <Link href="/disease-detection" className="text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline flex items-center gap-0.5">
              New Diagnosis <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {!user ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertOctagon className="w-8 h-8 text-slate-600 mb-2.5" />
              <p className="text-xs text-slate-500 leading-normal max-w-xs">
                History tracking is disabled in Guest Mode. Please sign in to log crop diagnostics and alerts.
              </p>
            </div>
          ) : historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history.length > 0 ? (
            <div className="divide-y divide-slate-800/40">
              {history.map(item => (
                <div key={item.id} className="py-3 flex items-center gap-4 first:pt-0 last:pb-0">
                  
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.cropName} 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800/50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 flex-shrink-0">
                      <Sprout className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-200 truncate">{item.cropName}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        item.healthStatus === 'Healthy' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.healthStatus === 'Healthy' ? 'Healthy' : item.diseaseName || 'Diseased'}
                      </span>
                      <span className="text-[10px] text-slate-400">Confidence: {item.confidence}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">No crop diagnostics recorded yet. Go to 'Disease Scan' to perform your first diagnosis.</p>
          )}
        </div>

      </div>

    </div>
  );
}
