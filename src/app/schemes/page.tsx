'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/ClientLayout';
import { 
  Award, 
  User, 
  MapPin, 
  Landmark, 
  Sprout, 
  ShieldCheck, 
  ArrowRight, 
  FileText, 
  CheckCircle,
  HelpCircle,
  Activity,
  AlertCircle,
  Scale,
  RefreshCw
} from 'lucide-react';


interface Scheme {
  id: string;
  name: string;
  authority: string;
  benefits: string;
  criteria: string;
  overview: string;
  requiredDocuments: string[];
}

interface EvaluationResult {
  status: 'Eligible' | 'Potentially Eligible' | 'Ineligible';
  confidence: number;
  explanation: string;
  requiredSteps: string[];
}

export default function SchemesPage() {
  const { user, language } = useApp();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  // Form states for profile evaluator
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [cropInput, setCropInput] = useState('');
  
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [evalError, setEvalError] = useState('');

  // Load user profile details if present
  useEffect(() => {
    if (user) {
      setName(user.name);
      setState(user.state || '');
      setFarmSize(user.farmSize || '');
      setCropInput(user.cropTypes?.join(', ') || '');
    }
  }, [user]);

  // Load schemes from API
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await fetch('/api/schemes');
        if (res.ok) {
          const data = await res.json();
          setSchemes(data);
          if (data.length > 0) {
            setSelectedScheme(data[0]); // default select first scheme
          }
        }
      } catch (err) {
        console.error('Failed to fetch schemes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, []);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheme) return;

    setEvalError('');
    setResult(null);
    setEvaluating(true);

    const cropList = cropInput 
      ? cropInput.split(',').map(c => c.trim()).filter(c => c.length > 0) 
      : [];

    try {
      const res = await fetch('/api/schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: selectedScheme.id,
          farmerProfile: {
            name,
            state,
            farmSize,
            cropTypes: cropList
          }
        })
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setEvalError(data.error || 'Evaluation failed. Please try again.');
      }
    } catch (err) {
      setEvalError('Connection error. Check network and submit again.');
    } finally {
      setEvaluating(false);
    }
  };

  const selectSchemeItem = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setResult(null); // Clear evaluation results when switching schemes
    setEvalError('');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* Schemes Explorer Panel (Left Col - Take up 2 panels) */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Horizontal tabs */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {schemes.map(s => {
              const isSelected = selectedScheme?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => selectSchemeItem(s)}
                  className={`p-3.5 rounded-2xl border text-xs font-bold leading-normal transition text-left cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-br from-emerald-600/35 to-teal-600/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Award className={`w-4 h-4 mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="block truncate">{s.name.split('(')[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Scheme Details Card */}
        {selectedScheme && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-900 space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Authority: {selectedScheme.authority}</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 mt-1 glow-text-emerald">
                {selectedScheme.name}
              </h2>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                {selectedScheme.overview}
              </p>
            </div>

            {/* Scheme Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-800/40">
              {/* Benefits */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Key Benefits
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {selectedScheme.benefits}
                </p>
              </div>

              {/* Eligibility Criteria */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-teal-500" /> Eligibility Criteria
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {selectedScheme.criteria}
                </p>
              </div>
            </div>

            {/* Document Checklist */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3.5 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-emerald-500" /> Mandatory Registration Papers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedScheme.requiredDocuments.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-400 leading-normal">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* AI Eligibility Evaluator widget (Right Col - 1 column) */}
      <div className="xl:col-span-1 space-y-6">
        <div className="glass-panel p-5 rounded-3xl border border-slate-900 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-sm font-bold text-slate-200 pb-3 border-b border-slate-800/80 mb-4 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-emerald-400" />
              AI Eligibility Checker
            </h3>

            {/* Evaluation Form */}
            <form onSubmit={handleEvaluate} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Farmer Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Vijay Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 w-full p-2.5 bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-emerald-500 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  State / Region
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="pl-9 w-full p-2.5 bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-emerald-500 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Farm Size (Hectares)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="E.g. 2.5"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="pl-9 w-full p-2.5 bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-emerald-500 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Crops Grown (Comma-separated)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="E.g. Tomato, Wheat"
                    value={cropInput}
                    onChange={(e) => setCropInput(e.target.value)}
                    className="pl-9 w-full p-2.5 bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-emerald-500 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              {evalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-300 leading-normal">
                  {evalError}
                </div>
              )}

              <button
                type="submit"
                disabled={evaluating || !selectedScheme}
                className="w-full flex items-center justify-center gap-1.5 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-[0_4px_15px_rgba(16,185,129,0.15)] transition disabled:opacity-50 cursor-pointer"
              >
                {evaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Eligibility...
                  </>
                ) : (
                  <>
                    Check Eligibility <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {/* Evaluation Results display */}
            {result && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3.5">
                
                {/* Result Title */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Eligibility Status</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                    result.status === 'Eligible' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : result.status === 'Potentially Eligible' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {result.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-1">
                    <span>AI Confidence</span>
                    <span>{result.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.status === 'Eligible' 
                          ? 'bg-emerald-500' 
                          : result.status === 'Potentially Eligible' 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  {result.explanation}
                </p>

                {/* Required Steps */}
                {result.requiredSteps.length > 0 && (
                  <div className="space-y-1.5 pt-2.5 border-t border-slate-900/60">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Recommended Next Steps</span>
                    {result.requiredSteps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-[10px] text-slate-400 leading-normal font-semibold">
                        <span className="text-emerald-500 text-xs leading-none">•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>

          <div className="p-3 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-[9px] text-slate-500 flex gap-2 items-center leading-normal mt-5 flex-shrink-0">
            <AlertCircle className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
            <p>This checker uses artificial intelligence models to inspect farmer profile metrics. Double-check official schemes portals for registration constraints.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
