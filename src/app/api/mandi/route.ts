import { NextRequest, NextResponse } from 'next/server';
import { offlineMandiData } from '@/lib/offlineData';

interface MandiRecord {
  id: string;
  crop: string;
  state: string;
  district: string;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number; // Avg price
  unit: string;
  dailyChange: number; // Percent
  trendData: number[]; // Last 6 months modal prices
}

export const mandiPricesData: MandiRecord[] = [
  {
    id: '1',
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
    id: '2',
    crop: 'Wheat (Lokwan)',
    state: 'Madhya Pradesh',
    district: 'Indore',
    market: 'Indore Mandi',
    minPrice: 2400,
    maxPrice: 2750,
    modalPrice: 2580,
    unit: '₹/Quintal',
    dailyChange: -1.2,
    trendData: [2380, 2420, 2480, 2500, 2620, 2580]
  },
  {
    id: '3',
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
  },
  {
    id: '4',
    crop: 'Rice (Common)',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    market: 'Varanasi Mandi',
    minPrice: 2150,
    maxPrice: 2300,
    modalPrice: 2220,
    unit: '₹/Quintal',
    dailyChange: 0.5,
    trendData: [2050, 2100, 2120, 2180, 2200, 2220]
  },
  {
    id: '5',
    crop: 'Onion (Kanda)',
    state: 'Maharashtra',
    district: 'Nashik',
    market: 'Lasalgaon',
    minPrice: 1800,
    maxPrice: 2400,
    modalPrice: 2100,
    unit: '₹/Quintal',
    dailyChange: 5.4,
    trendData: [1400, 1550, 1600, 1750, 1900, 2100]
  },
  {
    id: '6',
    crop: 'Onion (Red)',
    state: 'Karnataka',
    district: 'Chikmagalur',
    market: 'Yeshwanthpur',
    minPrice: 1900,
    maxPrice: 2500,
    modalPrice: 2200,
    unit: '₹/Quintal',
    dailyChange: 3.2,
    trendData: [1600, 1700, 1850, 2000, 2100, 2200]
  },
  {
    id: '7',
    crop: 'Potato (Jyoti)',
    state: 'West Bengal',
    district: 'Hooghly',
    market: 'Sheoraphuly',
    minPrice: 1400,
    maxPrice: 1680,
    modalPrice: 1550,
    unit: '₹/Quintal',
    dailyChange: -0.8,
    trendData: [1700, 1650, 1620, 1590, 1570, 1550]
  },
  {
    id: '8',
    crop: 'Potato (Desi)',
    state: 'Uttar Pradesh',
    district: 'Agra',
    market: 'Fatehabad',
    minPrice: 1300,
    maxPrice: 1550,
    modalPrice: 1420,
    unit: '₹/Quintal',
    dailyChange: 0.2,
    trendData: [1500, 1490, 1460, 1430, 1410, 1420]
  },
  {
    id: '9',
    crop: 'Cotton (Kapass)',
    state: 'Gujarat',
    district: 'Rajkot',
    market: 'Gondal',
    minPrice: 6500,
    maxPrice: 7400,
    modalPrice: 7100,
    unit: '₹/Quintal',
    dailyChange: 1.5,
    trendData: [6800, 6900, 6950, 7050, 7000, 7100]
  },
  {
    id: '10',
    crop: 'Soyabean (Yellow)',
    state: 'Madhya Pradesh',
    district: 'Ujjain',
    market: 'Ujjain Mandi',
    minPrice: 4200,
    maxPrice: 4750,
    modalPrice: 4500,
    unit: '₹/Quintal',
    dailyChange: -2.3,
    trendData: [4800, 4750, 4680, 4610, 4550, 4500]
  },
  {
    id: '11',
    crop: 'Mustard (Sarson)',
    state: 'Rajasthan',
    district: 'Alwar',
    market: 'Alwar Mandi',
    minPrice: 5100,
    maxPrice: 5600,
    modalPrice: 5350,
    unit: '₹/Quintal',
    dailyChange: 0.9,
    trendData: [5000, 5150, 5200, 5280, 5300, 5350]
  },
  {
    id: '12',
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
  }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const state = searchParams.get('state')?.toLowerCase() || '';
    const crop = searchParams.get('crop')?.toLowerCase() || '';

    // Filter results
    let filteredData = [...mandiPricesData];

    if (search) {
      filteredData = filteredData.filter(
        item =>
          item.crop.toLowerCase().includes(search) ||
          item.state.toLowerCase().includes(search) ||
          item.market.toLowerCase().includes(search) ||
          item.district.toLowerCase().includes(search)
      );
    }

    if (state) {
      filteredData = filteredData.filter(
        item => item.state.toLowerCase() === state
      );
    }

    if (crop) {
      filteredData = filteredData.filter(
        item => item.crop.toLowerCase().includes(crop)
      );
    }

    // Generate unique list of states and crops for frontend filters
    const states = Array.from(new Set(mandiPricesData.map(item => item.state)));
    const crops = Array.from(new Set(mandiPricesData.map(item => item.crop)));

    return NextResponse.json({
      records: filteredData,
      filters: {
        states,
        crops
      }
    });

  } catch (error) {
    console.error('Error in mandi price endpoint:', error);
    return NextResponse.json({
      records: offlineMandiData,
      filters: {
        states: Array.from(new Set(offlineMandiData.map(item => item.state))),
        crops: Array.from(new Set(offlineMandiData.map(item => item.crop)))
      }
    });
  }
}
