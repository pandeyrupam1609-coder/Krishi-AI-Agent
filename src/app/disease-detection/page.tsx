'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/ClientLayout';
import { 
  Sprout, 
  Upload, 
  Camera, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  Droplet, 
  Activity, 
  IndianRupee, 
  Heart,
  FileText,
  Clock,
  Sparkles,
  CloudSun,
  Award,
  AlertOctagon,
  Info,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface DiagnosisReport {
  id?: string;
  cropName: string;
  healthStatus: 'Healthy' | 'Diseased';
  diseaseName?: string;
  confidence: number;
  symptoms?: string;
  organicRemedies?: string;
  chemicalRemedies?: string;
  fertilizerRecommendations?: string;
  irrigationRecommendations?: string;
  imageUrl?: string;
  createdAt?: string;

  // New fields
  growthStage?: string;
  weatherSummary?: string;
  riskAlerts?: string;
  recommendedMedicine?: string;
  marketPrices?: string;
  governmentSchemes?: string;
  preventiveTips?: string;
  nextRecommendedAction?: string;
}

export default function DiseaseDetectionPage() {
  const { user, token, language } = useApp();
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<DiagnosisReport | null>(null);
  const [history, setHistory] = useState<DiagnosisReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: string | null; lon: string | null }>({ lat: null, lon: null });

  // Get geolocation coordinates on page mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude.toString(),
            lon: position.coords.longitude.toString()
          });
        },
        (err) => {
          console.warn('Browser Geolocation failed or denied:', err);
        }
      );
    }
  }, []);

  // Load history on mount if user logged in
  useEffect(() => {
    fetchHistory();
  }, [token]);

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
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load history list:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Convert File object to Base64 data URI
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG).');
      return;
    }

    setError('');
    setMimeType(file.type);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setReport(null); // Clear previous analysis
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image || !mimeType) {
      setError('Please upload or capture a crop photo first.');
      return;
    }

    setError('');
    setLoading(true);
    setReport(null);

    // Extract base64 payload from data URI
    const base64Data = image.split(',')[1];

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          image: base64Data,
          mimeType: mimeType,
          lat: coords.lat,
          lon: coords.lon,
          state: user?.state
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReport(data);
        fetchHistory(); // Refresh history timeline to include the new scan
      } else {
        setError(data.error || 'Crop analysis failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error occurred. Check internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setMimeType(null);
    setReport(null);
    setError('');
  };

  const selectHistoryItem = (item: DiagnosisReport) => {
    setReport(item);
    setImage(item.imageUrl || null);
    setError('');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      
      {/* Crop Scanner and Diagnosis Display (Left Col - Take up 3 panels on large screens) */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* Upload and Scanner Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-900">
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            Scan New Crop Leaf / Plant
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Uploader Box */}
            <div className="flex flex-col items-center justify-center">
              {!image ? (
                <label className="w-full h-64 border-2 border-dashed border-slate-800 hover:border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer bg-slate-950/20 hover:bg-slate-950/40 transition duration-200">
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 mb-3">
                    <Upload className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-semibold text-slate-200">Upload Crop Photo</span>
                  <span className="text-xs text-slate-500 mt-1.5 text-center">Supports JPG, PNG (Max 5MB) or Click to capture</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                </label>
              ) : (
                <div className="w-full relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 scanner-container">
                  {/* Scanner line runs while loading */}
                  {loading && <div className="scanner-line"></div>}
                  <img 
                    src={image} 
                    alt="Uploaded Crop" 
                    className="w-full h-64 object-contain"
                  />
                  {/* Action buttons on image */}
                  {!loading && (
                    <button 
                      onClick={handleClear}
                      className="absolute top-3 right-3 p-2 bg-slate-950/80 hover:bg-slate-950 text-slate-300 rounded-xl border border-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Analysis State and Trigger Actions */}
            <div className="flex flex-col justify-between py-2">
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  For the best diagnosis, take a clear, close-up photograph of the affected crop leaf, stem, or fruit in daylight. Ensure the symptoms (spots, mould, discoloration) are in focus. Geolocation will fetch weather and mandi prices near you.
                </p>

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-rose-300 font-semibold leading-relaxed">{error}</span>
                  </div>
                )}

                {loading && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Analyzing Crop Health...</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Connecting with AI Pathologist. Scanning visual structures, estimating growth stage, fetching current local weather, matching mandi rates, and evaluating eligible schemes.
                    </p>
                  </div>
                )}

                {report && !loading && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">Analysis Complete</span>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                        We have identified the crop as <span className="text-slate-200 font-bold">{report.cropName}</span> ({report.growthStage || 'Vegetative Stage'}) with a confidence of {report.confidence}%. Review the detailed advisory report below.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !image}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-sm font-bold shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.3)] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      Diagnosing Plant...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5 text-emerald-300" />
                      Start AI Diagnosis
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Diagnosis Results Display */}
        {report && (
          <div className="space-y-6">
            
            {/* Primary Health Status Summary Card */}
            <div className={`glass-panel p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start gap-6 ${
              report.healthStatus === 'Healthy' 
                ? 'border-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.08)]' 
                : 'border-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.08)]'
            }`}>
              <div className="space-y-3 flex-grow">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Sprout className="w-4 h-4 text-emerald-400" /> Crop: {report.cropName}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-semibold text-slate-300">Stage: {report.growthStage || 'Vegetative Stage'}</span>
                  <span className="text-slate-600">•</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    report.healthStatus === 'Healthy' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {report.healthStatus === 'Healthy' ? 'Healthy Plant' : 'Diseased'}
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-100">
                  {report.healthStatus === 'Healthy' ? 'Healthy and Vigorous Leaf Structure' : report.diseaseName}
                </h2>

                {report.symptoms && (
                  <p className="text-xs text-slate-300 leading-relaxed pt-2">
                    <span className="font-bold text-slate-400 block mb-1">Visual Symptoms & Findings:</span>
                    {report.symptoms}
                  </p>
                )}
              </div>

              <div className="text-left md:text-right flex-shrink-0 self-start md:self-center border-l md:border-l-0 md:border-r border-slate-800 pl-4 md:pl-0 pr-0 md:pr-6">
                <span className="block text-[10px] uppercase font-bold text-slate-500">AI Confidence</span>
                <span className={`text-4xl font-black ${report.healthStatus === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {report.confidence}%
                </span>
                <span className="block text-[10px] text-slate-500 mt-1">Diagnosis Accuracy</span>
              </div>
            </div>

            {/* Weather advisory widget */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-900 bg-gradient-to-br from-slate-900/60 to-slate-950/40">
              <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-sky-400" />
                Live Weather & Agro-Meteorological Advisory
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Environmental Summary</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.weatherSummary || 'Fetching weather data...'}
                  </p>
                </div>
                <div className="border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 pl-0 md:pl-6">
                  <span className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400" /> Weather Risk Alerts
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    {report.riskAlerts || 'No weather warnings present.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Remedies Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Medicine & Treatment */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-900">
                <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-rose-400" />
                  Recommended Medicine & Chemical Treatment
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.recommendedMedicine || report.chemicalRemedies || 'No chemical remedies required.'}
                </p>
              </div>

              {/* Organic Treatments */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-900">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Heart className="w-4.5 h-4.5 text-emerald-400" />
                  Organic & Biological Remedies
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.organicRemedies || 'No specific organic treatments required.'}
                </p>
              </div>

              {/* Fertilizer & Soil Nutrition */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-900">
                <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-teal-400" />
                  Fertilizer Recommendation
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.fertilizerRecommendations || 'Maintain standard balanced fertilizing rates.'}
                </p>
              </div>

              {/* Irrigation Guidelines */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-900">
                <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Droplet className="w-4.5 h-4.5 text-sky-400" />
                  Irrigation Advice
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.irrigationRecommendations || 'Maintain regular crop watering schedules.'}
                </p>
              </div>

            </div>

            {/* Financial Support, Schemes, and Mandi Price Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Market Prices & Mandi Analysis */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-900 bg-slate-950/20">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <IndianRupee className="w-4.5 h-4.5 text-amber-400" />
                  Market Prices & Selling Advisory
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.marketPrices || 'Searching matching mandi prices...'}
                </p>
              </div>

              {/* Government Schemes & Subsidies */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-900 bg-slate-950/20">
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-purple-400" />
                  Government Schemes & Subsidies
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.governmentSchemes || 'Scanning schemes eligibility...'}
                </p>
              </div>

            </div>

            {/* Prevention & Next Steps */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-900 bg-gradient-to-r from-slate-950/40 to-slate-900/40">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-emerald-400" />
                Preventive Tips & Next Steps
              </h3>
              <div className="space-y-4">
                {report.preventiveTips && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sustainable Management Practices</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {report.preventiveTips}
                    </p>
                  </div>
                )}
                
                {report.nextRecommendedAction && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" /> Next Recommended Action
                      </span>
                      <p className="text-xs text-slate-100 font-bold leading-normal">
                        {report.nextRecommendedAction}
                      </p>
                    </div>
                    {report.healthStatus === 'Diseased' && (
                      <button 
                        onClick={() => window.location.href = '/chatbot'}
                        className="flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 rounded-xl transition cursor-pointer self-stretch sm:self-auto justify-center"
                      >
                        Ask Krishi Mitra <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* History Timeline Sidebar (Right Col - Take up 1 panel) */}
      <div className="xl:col-span-1 space-y-6">
        <div className="glass-panel p-5 rounded-3xl border border-slate-900 h-full flex flex-col max-h-[85vh]">
          <h3 className="text-sm font-bold text-slate-200 pb-3.5 border-b border-slate-800/80 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Saved Diagnostic Scans
          </h3>

          {!user ? (
            <div className="text-center py-10 px-2 flex-grow flex flex-col items-center justify-center">
              <Sprout className="w-8 h-8 text-slate-700 mb-2.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Persistent scan histories are only saved for registered accounts. Create a free farmer profile to review past diagnoses.
              </p>
            </div>
          ) : historyLoading ? (
            <div className="flex justify-center py-12 flex-grow">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 px-2 flex-grow flex flex-col items-center justify-center">
              <Sprout className="w-8 h-8 text-slate-700 mb-2.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                You haven't run any diagnostic scans yet. Upload a crop leaf photo above.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-0.5">
              {history.map(item => (
                <div 
                  key={item.id}
                  onClick={() => selectHistoryItem(item)}
                  className={`p-3 rounded-xl border bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition duration-150 cursor-pointer flex gap-3 items-center ${
                    report?.id === item.id 
                      ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_12px_rgba(16,185,129,0.05)]' 
                      : 'border-slate-800/80'
                  }`}
                >
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.cropName} 
                      className="w-10 h-10 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center text-slate-700 flex-shrink-0">
                      <Sprout className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-200 truncate">{item.cropName}</span>
                      <span className="text-[9px] text-slate-500 flex-shrink-0">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <span className={`text-[9px] font-semibold block mt-0.5 ${
                      item.healthStatus === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {item.healthStatus === 'Healthy' ? 'Healthy' : item.diseaseName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
