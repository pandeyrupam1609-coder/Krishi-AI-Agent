'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/ClientLayout';
import { 
  TrendingUp, 
  Search, 
  MapPin, 
  IndianRupee, 
  HelpCircle, 
  Info,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface MandiRecord {
  id: string;
  crop: string;
  state: string;
  district: string;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  dailyChange: number;
  trendData: number[];
}

export default function MarketPricesPage() {
  const { language } = useApp();
  const [records, setRecords] = useState<MandiRecord[]>([]);
  const [statesList, setStatesList] = useState<string[]>([]);
  const [cropsList, setCropsList] = useState<string[]>([]);
  
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch prices from mandi API
  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (selectedState) query.set('state', selectedState);
        if (selectedCrop) query.set('crop', selectedCrop);

        const res = await fetch(`/api/mandi?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records);
          setStatesList(data.filters.states);
          setCropsList(data.filters.crops);
        }
      } catch (err) {
        console.error('Failed to load mandi prices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [search, selectedState, selectedCrop]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedState('');
    setSelectedCrop('');
  };

  // Helper function to render a custom SVG sparkline chart
  const renderSparkline = (dataPoints: number[], colorClass: string) => {
    if (!dataPoints || dataPoints.length === 0) return null;

    const width = 180;
    const height = 45;
    const padding = 5;

    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = max - min || 1;

    // Map each data point to coordinate coordinates
    const points = dataPoints.map((val, idx) => {
      const x = padding + (idx / (dataPoints.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return { x, y };
    });

    // Build the SVG path string
    let pathString = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathString += ` L ${points[i].x} ${points[i].y}`;
    }

    // Build fill/area path underneath the line
    const fillPathString = `${pathString} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    const strokeColor = colorClass === 'emerald' ? '#10b981' : '#f43f5e';
    const fillColor = colorClass === 'emerald' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)';

    return (
      <svg width={width} height={height} className="overflow-visible">
        {/* Shaded Area */}
        <path d={fillPathString} fill={fillColor} stroke="none" />
        {/* Trend Line */}
        <path d={pathString} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Draw circle at final value point */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3.5" fill={strokeColor} />
      </svg>
    );
  };

  const marketDict: Record<string, Record<string, string>> = {
    searchPlaceholder: {
      en: 'Search crop, state or market index...',
      hi: 'फसल, राज्य या मंडी खोजें...',
      mr: 'पीक, राज्य किंवा बाजारपेठ शोधा...',
      te: 'పంట, రాష్ట్రం లేదా మార్కెట్ పేరు వెతకండి...',
      ta: 'பயிர், மாநிலம் அல்லது சந்தையை தேடுங்கள்...'
    },
    stateSelect: { en: 'Filter State', hi: 'राज्य चुनें', mr: 'राज्य निवडा', te: 'రాష్ట్ర వడపోత', ta: 'மாநில வடிகட்டி' },
    cropSelect: { en: 'Filter Crop', hi: 'फसल चुनें', mr: 'पीक निवडा', te: 'పంట వడపోత', ta: 'பயிர் வடிகட்டி' },
    noResults: {
      en: 'No Mandi price indices match your filter options. Try resetting filter settings.',
      hi: 'आपके फ़िल्टर विकल्पों से मेल खाने वाला कोई मंडी भाव नहीं मिला। फ़िल्टर रीसेट करें।',
      mr: 'निवडलेल्या निकषांनुसार बाजार भाव उपलब्ध नाहीत. कृपया फिल्टर बदला.',
      te: 'ఎలాంటి మండి ధరల సమాచారం లభించలేదు. వడపోతలను రీసెట్ చేయండి.',
      ta: 'விலை விவரங்கள் எதுவும் கிடைக்கவில்லை. வடிகட்டிகளை மீட்டமைக்கவும்.'
    }
  };

  const t = (key: string) => {
    return marketDict[key]?.[language] || marketDict[key]?.['en'] || key;
  };

  return (
    <div className="space-y-6">
      
      {/* Filters Card */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-900">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full md:flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pl-11 w-full p-3 bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-emerald-500 rounded-xl text-xs text-slate-200"
            />
          </div>

          {/* State Filter Dropdown */}
          <div className="relative w-full md:w-48 flex-shrink-0">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full p-3 bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-emerald-500 rounded-xl text-xs text-slate-200 appearance-none"
            >
              <option value="">{t('stateSelect')} (All)</option>
              {statesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Crop Filter Dropdown */}
          <div className="relative w-full md:w-48 flex-shrink-0">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full p-3 bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-emerald-500 rounded-xl text-xs text-slate-200 appearance-none"
            >
              <option value="">{t('cropSelect')} (All)</option>
              {cropsList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {(search || selectedState || selectedCrop) && (
            <button 
              onClick={handleResetFilters}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline py-2 px-1 flex-shrink-0"
            >
              Reset Filters
            </button>
          )}

        </div>
      </div>

      {/* Mandi Prices Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-900 flex flex-col items-center justify-center">
          <HelpCircle className="w-10 h-10 text-slate-700 mb-3" />
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            {t('noResults')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {records.map(item => {
            const isChangePositive = item.dailyChange >= 0;
            const colorClass = isChangePositive ? 'emerald' : 'rose';
            
            return (
              <div 
                key={item.id}
                className="glass-panel p-5 rounded-3xl border border-slate-900 flex flex-col justify-between gap-5 relative overflow-hidden group"
              >
                
                {/* Header: Crop name and Location */}
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-slate-100 text-base truncate group-hover:text-emerald-400 transition">
                      {item.crop}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                      isChangePositive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isChangePositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isChangePositive ? '+' : ''}{item.dailyChange}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    {item.market} Mandi, {item.district}, {item.state}
                  </p>
                </div>

                {/* Body: Price stats and inline trend sparkline */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/40">
                  
                  {/* Prices */}
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-500">Avg Market Price</span>
                    <span className="block text-2xl font-black text-slate-100 mt-0.5 tracking-tight flex items-center gap-0.5">
                      <IndianRupee className="w-4 h-4 text-slate-400" />
                      {item.modalPrice}
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">
                      Range: ₹{item.minPrice} - ₹{item.maxPrice}
                    </span>
                  </div>

                  {/* Sparkline chart */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="block text-[9px] uppercase font-bold text-slate-500">6-Month Trend</span>
                    {renderSparkline(item.trendData, colorClass)}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Advisory footnote */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-[10px] text-slate-500 flex gap-2.5 items-center leading-normal max-w-2xl">
        <Info className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
        <p>
          Note: Market prices are updated twice daily from district marketing committees and national agricultural portals. The modal price represents the average bid price across the active morning and afternoon bidding sessions.
        </p>
      </div>

    </div>
  );
}
