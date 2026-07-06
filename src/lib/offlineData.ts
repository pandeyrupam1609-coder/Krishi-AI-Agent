export const offlineWeatherData = {
  current: {
    temp: 28,
    humidity: 72,
    windSpeed: 12,
    precipitation: 0.4,
    condition: 'Partly cloudy',
    weatherCode: 2
  },
  daily: {
    dates: ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'],
    tempMax: [30, 31, 29, 28, 30],
    tempMin: [24, 23, 22, 21, 23],
    rainProb: [20, 40, 65, 75, 30],
    rainSum: [0, 1.2, 7.5, 11.2, 0.5],
    weatherCodes: [2, 3, 51, 61, 3]
  },
  warnings: [
    'Offline mode is active. Weather updates will use the last saved agro-advisory until connectivity returns.',
    'Humidity is moderate. Keep leaves dry and monitor fungal risk on tender crops.'
  ]
};

export const offlineMandiData = [
  {
    id: 'offline-1',
    crop: 'Tomato (Desi)',
    state: 'Maharashtra',
    district: 'Pune',
    market: 'Manchar',
    minPrice: 2200,
    maxPrice: 3200,
    modalPrice: 2700,
    unit: '₹/Quintal',
    dailyChange: 8.7,
    trendData: [1500, 1800, 2100, 2200, 2500, 2700]
  },
  {
    id: 'offline-2',
    crop: 'Wheat (Kanak)',
    state: 'Punjab',
    district: 'Ludhiana',
    market: 'Khanna',
    minPrice: 2275,
    maxPrice: 2420,
    modalPrice: 2350,
    unit: '₹/Quintal',
    dailyChange: 0.8,
    trendData: [2100, 2180, 2220, 2280, 2310, 2350]
  },
  {
    id: 'offline-3',
    crop: 'Paddy (Basmati)',
    state: 'Haryana',
    district: 'Karnal',
    market: 'Gharaunda',
    minPrice: 3800,
    maxPrice: 4300,
    modalPrice: 4100,
    unit: '₹/Quintal',
    dailyChange: 2.1,
    trendData: [3700, 3850, 3920, 4000, 4050, 4100]
  }
];

export const offlineSchemesData = [
  {
    id: 'pm-kisan',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    authority: 'Ministry of Agriculture and Farmers Welfare, Govt of India',
    benefits: 'Direct financial assistance of ₹6,000 per year in three equal installments.',
    criteria: 'Eligible for landholding farmer families who cultivate land and hold valid records.',
    overview: 'This offline-ready overview keeps subsidy guidance available even when live connectivity is unavailable.',
    requiredDocuments: ['Aadhaar Card', 'Land Ownership Records', 'Bank Account Details']
  },
  {
    id: 'pmfby',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    authority: 'Ministry of Agriculture and Farmers Welfare, Govt of India',
    benefits: 'Crop insurance for losses due to drought, flood, pests, and disease.',
    criteria: 'Open to notified farmers growing covered crops in notified areas.',
    overview: 'The scheme details remain accessible offline for planning and application preparation.',
    requiredDocuments: ['Land Record', 'Sowing Certificate', 'Bank Passbook']
  }
];

export const offlineNotificationsData = [
  {
    id: 'offline-1',
    title: 'Offline Mode Enabled',
    message: 'Krishi AI Agent will keep core farm tools available while you are disconnected.',
    type: 'system' as const,
    isRead: false,
    createdAt: new Date().toISOString()
  }
];
