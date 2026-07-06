'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sprout, 
  LayoutDashboard, 
  Bot, 
  TrendingUp, 
  Award, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  Languages, 
  Menu, 
  X,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

// Definitions
export interface FarmerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  state?: string;
  farmSize?: string;
  cropTypes?: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'weather' | 'disease' | 'price' | 'system';
  isRead: boolean;
  createdAt: string;
}

interface AppContextType {
  user: FarmerProfile | null;
  token: string | null;
  language: string;
  notifications: NotificationItem[];
  unreadCount: number;
  login: (token: string, user: FarmerProfile) => void;
  logout: () => void;
  setLanguage: (lang: string) => void;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isOffline: boolean;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

// Dictionary for multilingual navigation elements
const navDict: Record<string, Record<string, string>> = {
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड', te: 'డాష్‌బోర్డ్', ta: 'டாஷ்போர்டு' },
  detection: { en: 'Disease Scan', hi: 'रोग पहचान', mr: 'रोग ओळख', te: 'వ్యాధి నిర్ధారణ', ta: 'நோய் கண்டறிதல்' },
  chatbot: { en: 'Krishi Chatbot', hi: 'कृषि चैटबॉट', mr: 'कृषी चॅटबॉट', te: 'కృషి చాట్‌బాట్', ta: 'கிருஷி அரட்டை' },
  market: { en: 'Mandi Prices', hi: 'मंडी भाव', mr: 'मंडी भाव', te: 'మండి ధరలు', ta: 'மண்டி விலைகள்' },
  schemes: { en: 'Schemes', hi: 'सरकारी योजनाएं', mr: 'शासकीय योजना', te: 'పథకాలు', ta: 'திட்டங்கள்' },
  login: { en: 'Login', hi: 'लॉगिन', mr: 'लॉगिन', te: 'లాగిన్', ta: 'உள்நுழை' },
  logout: { en: 'Logout', hi: 'लॉगआउट', mr: 'लॉगआउट', te: 'లాగౌట్', ta: 'வெளியேறு' }
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FarmerProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [language, setLanguageState] = useState<string>('en');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const pathname = usePathname();
  const router = useRouter();


  // Load state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('krishi_token');
    const savedUser = localStorage.getItem('krishi_user');
    const savedLang = localStorage.getItem('krishi_lang');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    if (savedLang) {
      setLanguageState(savedLang);
    }

    // Register Service Worker for offline PWA capabilities
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('ServiceWorker registered with scope:', reg.scope))
        .catch(err => console.error('ServiceWorker registration failed:', err));
    }

    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    setMounted(true);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);



  const login = (newToken: string, newUser: FarmerProfile) => {
    localStorage.setItem('krishi_token', newToken);
    localStorage.setItem('krishi_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('krishi_token');
    localStorage.removeItem('krishi_user');
    setToken(null);
    setUser(null);
    setNotifications([]);
    router.push('/');
  };

  const setLanguage = (lang: string) => {
    localStorage.setItem('krishi_lang', lang);
    setLanguageState(lang);
  };

  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [token]);

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ markAll: true })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Poll notifications
  useEffect(() => {
    if (token) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 30000); // 30s
      return () => clearInterval(interval);
    }
  }, [token, refreshNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { name: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'detection', path: '/disease-detection', icon: Sprout },
    { name: 'chatbot', path: '/chatbot', icon: Bot },
    { name: 'market', path: '/market', icon: TrendingUp },
    { name: 'schemes', path: '/schemes', icon: Award },
  ];

  const t = (key: string) => {
    return navDict[key]?.[language] || navDict[key]?.['en'] || key;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#04080f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      user, token, language, notifications, unreadCount,
      login, logout, setLanguage, refreshNotifications, markAsRead, markAllAsRead,
      isOffline
    }}>

      <div className="min-h-screen flex flex-col md:flex-row bg-[#04080f] text-slate-100">
        
        {/* Navigation Sidebar for Desktop */}
        <aside className="hidden md:flex flex-col w-72 bg-[#081225]/90 border-r border-emerald-500/10 p-6 flex-shrink-0 backdrop-blur-md">
          {/* App Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Sprout className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent glow-text-emerald">
                  Krishi AI
                </h1>
                <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">Farmer Agent</p>
              </div>
            </div>
            {/* Connection Status Badge */}
            <div className="mt-3.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold border tracking-wide transition duration-300 ${
                isOffline 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                {isOffline ? 'Offline Mode (Local Active)' : 'Online Mode'}
              </span>
            </div>
          </div>


          {/* User Profile Info */}
          {user ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-sm text-slate-200 truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.state || 'India'}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 mb-6">
              <p className="text-xs text-slate-400 text-center mb-3">Join Krishi AI to track field history and alerts</p>
              <Link href="/auth/login" className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors duration-200">
                <LogIn className="w-4 h-4" /> {t('login')}
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              // Guest check: Allow accessing landing page and basic modules, restrict dashboard/history alerts if not logged in
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/10 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                      : 'text-slate-300 hover:bg-slate-900/60 hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {t(item.name)}
                </Link>
              );
            })}
          </nav>

          {/* Languages & Logout Footer */}
          <div className="border-t border-slate-800 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Languages className="w-4 h-4 text-emerald-500" />
                <span>Language</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#0b0f17] text-slate-300 text-xs border border-slate-800 rounded-lg p-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>

            {user && (
              <button
                onClick={logout}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                {t('logout')}
              </button>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#081225]/90 border-b border-emerald-500/10 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Sprout className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-lg text-emerald-400 glow-text-emerald">Krishi AI</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection dot for mobile */}
            <div className="flex items-center mr-1" title={isOffline ? 'Offline Mode (Local Active)' : 'Online Mode'}>
              <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            </div>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#0b0f17] text-slate-200 text-xs border border-slate-800 rounded-lg p-1 focus:outline-none focus:border-emerald-500"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="mr">MR</option>
              <option value="te">TE</option>
              <option value="ta">TA</option>
            </select>


            {/* Notification Bell */}
            {user && (
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-1.5 text-slate-300 hover:text-slate-100 bg-slate-900/60 border border-slate-800 rounded-lg"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Menu Trigger */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-300 hover:text-slate-100 bg-slate-900/60 border border-slate-800 rounded-lg"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/85 backdrop-blur-sm flex flex-col justify-end pt-20">
            <div className="bg-[#081225] border-t border-emerald-500/10 p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-bold text-slate-300">Menu</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 bg-slate-900 border border-slate-800 rounded-md">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {user && (
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.state || 'India'}</p>
                  </div>
                </div>
              )}

              <nav className="flex flex-col gap-2">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium ${
                        isActive 
                          ? 'bg-gradient-to-r from-emerald-600/25 to-teal-600/10 text-emerald-400 border-l-4 border-emerald-500' 
                          : 'text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-emerald-400" />
                      {t(item.name)}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-800 pt-4 mt-2">
                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-xl text-sm font-semibold transition"
                  >
                    <LogOut className="w-5 h-5" /> {t('logout')}
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
                  >
                    <LogIn className="w-4 h-4" /> {t('login')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Pane */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Desktop Top Header Bar (Includes Notifications Panel) */}
          <header className="hidden md:flex items-center justify-between p-6 bg-[#04080f] border-b border-slate-900/60 sticky top-0 z-30 backdrop-blur-md">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Krishi Agent Platform</p>
              <h2 className="text-xl font-bold text-slate-100">
                {pathname === '/' && 'Welcome Farmer'}
                {pathname === '/dashboard' && 'Dashboard Overview'}
                {pathname === '/disease-detection' && 'AI Disease Detection'}
                {pathname === '/chatbot' && 'Chat with Krishi Mitra'}
                {pathname === '/market' && 'Real-Time Mandi Markets'}
                {pathname === '/schemes' && 'Government Agricultural Schemes'}
              </h2>
            </div>

            {user && (
              <div className="flex items-center gap-4 relative">
                {/* Desktop Notification Bell */}
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2.5 text-slate-300 hover:text-slate-100 hover:border-emerald-500/40 bg-slate-900/60 border border-slate-800/80 rounded-xl transition duration-200"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </header>

          {/* Notification Drawer Modal */}
          {isNotifOpen && (
            <div className="absolute right-6 top-20 z-50 w-96 bg-[#0b1426] border border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col max-h-[500px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Alert Center</span>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1 py-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No alerts or messages at this time.</p>
                ) : (
                  notifications.map(notif => {
                    let Icon = Info;
                    let color = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                    if (notif.type === 'disease') {
                      Icon = AlertTriangle;
                      color = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                    } else if (notif.type === 'weather') {
                      Icon = AlertTriangle;
                      color = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                    } else if (notif.type === 'system') {
                      Icon = CheckCircle2;
                      color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                    }

                    return (
                      <div 
                        key={notif.id} 
                        onClick={() => markAsRead(notif.id)}
                        className={`p-3 rounded-xl border flex gap-3 cursor-pointer transition duration-150 relative ${
                          notif.isRead 
                            ? 'bg-slate-900/30 border-slate-800/50 opacity-60 hover:opacity-90' 
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {!notif.isRead && (
                          <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-emerald-400 rounded-full"></span>
                        )}
                        <div className={`p-1.5 rounded-lg border flex-shrink-0 self-start ${color}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="pr-4">
                          <p className="text-xs font-semibold text-slate-200">{notif.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-[9px] text-slate-500 mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-800/80 pt-2.5 mt-2 flex justify-center">
                <button 
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-300 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Main Module Content */}
          <div className="flex-grow p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto">
            {children}
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#081225]/95 border-t border-emerald-500/10 backdrop-blur-md flex items-center justify-around py-2.5 px-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-5.5 h-5.5" />
                  <span>{t(item.name)}</span>
                </Link>
              );
            })}
          </nav>
        </main>
      </div>
    </AppContext.Provider>
  );
}
