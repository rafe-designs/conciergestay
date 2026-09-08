'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import KitchenSchedule from './KitchenSchedule';

// --- SUPABASE CLIENT SETUP ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- TYPES ---
export interface Booking {
  id?: string;
  reference?: string;
  paymentReference?: string;
  listingId?: string;
  checkIn?: string;
  checkOut?: string;
  createdAt?: string;
  status?: string;
  customerName?: string;
  guestName?: string;
  phone?: string;
  phoneNumber?: string;
  guests?: number;
  totalNights?: number;
  pricePerNight?: number;
  totalAmount?: number;
  grandTotal?: number;
  kitchenTotal?: number;
  mealTotal?: number;
  dailyMealSelections?: any;
  meals?: any;
  addons?: any;
  user?: { name?: string; email?: string } | null;
  departmentalBreakdown?: any;
  [key: string]: any;
}

export type DepartmentKey = 'kitchen' | 'housekeeping' | 'chauffeur' | 'airport' | 'security' | 'laundry' | 'beddings' | 'shopper';
export type TabKey = 'overview' | 'apartments' | DepartmentKey;

interface DeptConfig {
  id: DepartmentKey;
  label: string;
  name: string;
  color: string;
  barBg: string;
  keywords: string[];
}

// --- CONFIGURATION ---
const DEPARTMENT_CONFIGS: DeptConfig[] = [
  { id: 'kitchen', label: '🍳 Kitchen & Food', name: 'Kitchen & Dining', color: 'text-amber-400', barBg: 'bg-amber-500', keywords: ['kitchen', 'food', 'meal'] },
  { id: 'housekeeping', label: '🧹 Housekeeping', name: 'Housekeeping', color: 'text-yellow-400', barBg: 'bg-yellow-500', keywords: ['housekeeping', 'cleaning'] },
  { id: 'chauffeur', label: '🚘 Chauffeur', name: 'Chauffeur Service', color: 'text-blue-400', barBg: 'bg-blue-500', keywords: ['chauffeur'] },
  { id: 'airport', label: '✈️ Airport Transfer', name: 'Airport Transfer', color: 'text-sky-400', barBg: 'bg-sky-500', keywords: ['airport'] },
  { id: 'security', label: '🛡️ Security', name: 'Security Detail', color: 'text-red-400', barBg: 'bg-red-500', keywords: ['security'] },
  { id: 'laundry', label: '🧺 Laundry', name: 'Laundry & Drycleaning', color: 'text-purple-400', barBg: 'bg-purple-500', keywords: ['laundry'] },
  { id: 'beddings', label: '🛏️ Beddings & Linen', name: 'Beddings & Linen', color: 'text-emerald-400', barBg: 'bg-emerald-500', keywords: ['bedding', 'linen'] },
  { id: 'shopper', label: '🛒 Personal Shopper', name: 'Personal Shopper', color: 'text-pink-400', barBg: 'bg-pink-500', keywords: ['shopper'] }
];

// --- UTILITY FUNCTIONS ---
const parseJson = (data: any): any => {
  if (!data) return {};
  if (typeof data === 'object') return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch { return {}; }
  }
  return {};
};

const extractNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const clean = val.replace(/[^0-9.-]+/g, '');
    return Number(clean) || 0;
  }
  return 0;
};

const parseKitchenDetailsAndCost = (booking: Booking): { names: string[]; totalCost: number } => {
  const addons = parseJson(booking?.addons);
  const mealsObj = parseJson(booking?.dailyMealSelections || booking?.meals || addons?.kitchen || addons?.food || addons?.meals);

  const explicitTotal = extractNumber(
    booking?.kitchenTotal ||
    booking?.mealTotal ||
    booking?.mealsPrice ||
    booking?.foodTotal ||
    mealsObj?.totalPrice ||
    mealsObj?.grandTotal ||
    mealsObj?.total ||
    mealsObj?.calculatedTotal ||
    addons?.kitchenTotal ||
    addons?.mealTotal ||
    addons?.kitchen?.total
  );

  const itemNames: string[] = [];
  let calculatedCost = 0;

  if (!mealsObj || typeof mealsObj !== 'object' || Object.keys(mealsObj).length === 0) {
    return { names: [], totalCost: explicitTotal };
  }

  const processDishNode = (key: string, dishNode: any) => {
    if (!dishNode || typeof dishNode !== 'object') return;

    const rawName = dishNode.name || dishNode.title || key;
    if (!rawName || ['serviceMode', 'prepMode', 'prepModes', 'totalPrice', 'grandTotal'].includes(rawName)) return;

    const dishName = String(rawName)
      .replace(/^(rc_|sp_|pr_|sw_|p_|s_)/gi, '')
      .replace(/_/g, ' ')
      .trim();

    const liters = dishNode.liters ? Number(dishNode.liters) : undefined;
    
    const dishPrice = extractNumber(
      dishNode.price || dishNode.amount || dishNode.cost || dishNode.totalPrice || dishNode.total || dishNode.basePrice
    );
    calculatedCost += dishPrice;

    let dishLabel = dishName.toUpperCase();
    if (liters) dishLabel += ` (${liters}L)`;
    if (dishPrice > 0) dishLabel += ` - ₦${dishPrice.toLocaleString()}`;
    itemNames.push(dishLabel);

    // Swallows
    const swallow = dishNode.swallow || dishNode.swallows || dishNode.swallowId;
    if (swallow) {
      if (typeof swallow === 'string') {
        const cleanSwallow = swallow.replace(/^sw_/, '').replace(/_/g, ' ').trim().toUpperCase();
        itemNames.push(`SWALLOW: ${cleanSwallow}`);
      } else if (Array.isArray(swallow)) {
        swallow.forEach((s) => {
          if (typeof s === 'string') {
            itemNames.push(`SWALLOW: ${s.replace(/^sw_/, '').replace(/_/g, ' ').trim().toUpperCase()}`);
          } else if (typeof s === 'object' && s !== null) {
            const sName = String(s.name || s.title || s.id || 'swallow').replace(/^sw_/, '').replace(/_/g, ' ').trim().toUpperCase();
            const sPrice = extractNumber(s.price || s.amount || s.cost);
            if (sPrice > 0) calculatedCost += sPrice;
            itemNames.push(`SWALLOW: ${sName}${sPrice > 0 ? ` (₦${sPrice.toLocaleString()})` : ''}`);
          }
        });
      } else if (typeof swallow === 'object' && swallow !== null) {
        const sName = String(swallow.name || swallow.title || swallow.id || 'swallow').replace(/^sw_/, '').replace(/_/g, ' ').trim().toUpperCase();
        const sPrice = extractNumber(swallow.price || swallow.amount || swallow.cost);
        if (sPrice > 0) calculatedCost += sPrice;
        itemNames.push(`SWALLOW: ${sName}${sPrice > 0 ? ` (₦${sPrice.toLocaleString()})` : ''}`);
      }
    }

    // Proteins & Add-ons
    const rawProteins = dishNode.proteinAddons || dishNode.proteins || dishNode.proteinIds || dishNode.selectedProteins || dishNode.protein;
    if (rawProteins) {
      if (Array.isArray(rawProteins)) {
        const proteinCounts: Record<string, { qty: number; price: number }> = {};

        rawProteins.forEach((p) => {
          if (typeof p === 'string') {
            const cleanP = p.replace(/^pr_/, '').replace(/_/g, ' ').trim().toUpperCase();
            if (!proteinCounts[cleanP]) proteinCounts[cleanP] = { qty: 0, price: 0 };
            proteinCounts[cleanP].qty += 1;
          } else if (typeof p === 'object' && p !== null) {
            const cleanP = String(p.name || p.id || p.title || 'protein').replace(/^pr_/, '').replace(/_/g, ' ').trim().toUpperCase();
            const qty = extractNumber(p.qty || p.quantity || p.count || 1);
            const price = extractNumber(p.price || p.amount || p.total || p.cost);
            if (!proteinCounts[cleanP]) proteinCounts[cleanP] = { qty: 0, price: 0 };
            proteinCounts[cleanP].qty += qty;
            proteinCounts[cleanP].price += price;
          }
        });

        Object.entries(proteinCounts).forEach(([pName, info]) => {
          calculatedCost += info.price;
          const priceLabel = info.price > 0 ? ` - ₦${info.price.toLocaleString()}` : '';
          itemNames.push(`+ ${pName} (${info.qty} pcs)${priceLabel}`);
        });
      } else if (typeof rawProteins === 'object') {
        Object.entries(rawProteins).forEach(([pKey, pVal]: [string, any]) => {
          const cleanP = pKey.replace(/^pr_/, '').replace(/_/g, ' ').trim().toUpperCase();
          let qty = 1;
          let price = 0;
          if (typeof pVal === 'number') {
            price = pVal;
          } else if (typeof pVal === 'object' && pVal !== null) {
            qty = extractNumber(pVal.qty || pVal.quantity || pVal.count || 1);
            price = extractNumber(pVal.price || pVal.amount || pVal.total || pVal.cost);
          }
          calculatedCost += price;
          const priceLabel = price > 0 ? ` - ₦${price.toLocaleString()}` : '';
          itemNames.push(`+ ${cleanP} (${qty} pcs)${priceLabel}`);
        });
      }
    }
  };

  const traverse = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item) => traverse(item));
      return;
    }

    Object.entries(node).forEach(([key, val]) => {
      if (['prepModes', 'prep_modes', 'serviceMode', 'totalPrice', 'grandTotal'].includes(key)) return;

      const parsedVal = parseJson(val);
      if (typeof parsedVal === 'object' && parsedVal !== null) {
        const isDish =
          parsedVal.name ||
          parsedVal.title ||
          parsedVal.price !== undefined ||
          parsedVal.amount !== undefined ||
          parsedVal.cost !== undefined ||
          parsedVal.proteinIds ||
          parsedVal.proteinAddons ||
          parsedVal.proteins ||
          parsedVal.liters ||
          parsedVal.swallow ||
          parsedVal.swallows;

        if (isDish) {
          processDishNode(key, parsedVal);
        } else {
          traverse(parsedVal);
        }
      }
    });
  };

  traverse(mealsObj);

  const finalTotal = explicitTotal > 0 ? explicitTotal : calculatedCost;
  return { names: Array.from(new Set(itemNames)), totalCost: finalTotal };
};

const calculateSingleBookingDeptRevenue = (b: Booking, config: DeptConfig): number => {
  const directRev = Number(b[`${config.id}Revenue`]);
  if (!isNaN(directRev) && directRev > 0) return directRev;
  if (b.departmentalBreakdown && typeof b.departmentalBreakdown[config.id] === 'number' && b.departmentalBreakdown[config.id] > 0) {
    return b.departmentalBreakdown[config.id];
  }

  if (config.id === 'kitchen') {
    const { totalCost } = parseKitchenDetailsAndCost(b);
    return totalCost;
  }

  let fallbackRev = 0;
  const addons = parseJson(b?.addons);
  const nights = Math.max(1, Number(b?.totalNights) || 1);

  if (config.id === 'chauffeur') {
    const c = addons?.chauffeur || addons?.chauffeurService;
    if (c && !['None', 'false'].includes(String(c))) {
      const rate = extractNumber(c?.baseRate || c?.price || c?.amount);
      fallbackRev = rate > 0 ? rate * nights : 0;
    }
  } else if (config.id === 'airport') {
    const a = addons?.airport || addons?.airportTransfer;
    if (a && !['None', 'false'].includes(String(a))) {
      const rate = extractNumber(a?.baseRate || a?.price || a?.amount);
      const mult = String(a?.tripType || a?.direction).toLowerCase().includes('round') ? 2 : 1;
      fallbackRev = rate > 0 ? rate * mult : 0;
    }
  } else if (config.id === 'security' || config.id === 'shopper') {
    const s = addons?.[config.id] || addons?.[`${config.id}Service`] || addons?.personalShopper || addons?.securityType;
    if (s && !['None', 'No Additional Security', 'false'].includes(String(s))) {
      const rate = extractNumber(s?.baseRate || s?.price || s?.amount);
      const count = extractNumber(s?.count || s?.guards || s?.shoppers || 1);
      fallbackRev = rate > 0 ? rate * count * nights : 0;
    }
  }

  return fallbackRev;
};

const getBookingGrandTotal = (b: Booking): number => {
  const directTotal = Number(b?.grandTotal || b?.totalAmount || b?.total);
  if (!isNaN(directTotal) && directTotal > 0) return directTotal;

  const baseTotal = (Math.max(1, Number(b?.totalNights) || 1)) * Number(b?.pricePerNight || b?.listing?.pricePerNight || 0);
  const addonsRev = DEPARTMENT_CONFIGS.reduce((sum, config) => sum + calculateSingleBookingDeptRevenue(b, config), 0);
  return baseTotal + addonsRev;
};

const getBookingApartmentRevenue = (b: Booking): number => {
  const directApt = Number(b?.apartmentRevenue || b?.baseRentTotal || b?.apartmentTotal || 0);
  if (directApt > 0) return directApt;

  const nights = Math.max(1, Number(b?.totalNights) || 1);
  const pricePerNight = Number(b?.pricePerNight || b?.listing?.pricePerNight || 0);
  if (pricePerNight > 0) return nights * pricePerNight;

  const addonsRev = DEPARTMENT_CONFIGS.reduce((sum, config) => sum + calculateSingleBookingDeptRevenue(b, config), 0);
  return Math.max(0, getBookingGrandTotal(b) - addonsRev);
};

// --- MAIN COMPONENT ---
export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Operational States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setBookings([]);
  };

  const fetchBookings = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }

      const data = await res.json();
      setBookings(Array.isArray(data) ? data : data?.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchBookings();
  }, [session]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (selectedDate) {
        const targetTime = new Date(`${selectedDate}T00:00:00`).getTime();
        const checkInRaw = b?.checkIn || b?.createdAt || b?.date;
        const checkOutRaw = b?.checkOut || checkInRaw;
        
        if (!checkInRaw) return false;

        const checkInTime = new Date(checkInRaw).setHours(0, 0, 0, 0);
        const checkOutTime = new Date(checkOutRaw).setHours(23, 59, 59, 999);

        if (targetTime < checkInTime || targetTime > checkOutTime) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const ref = String(b?.paymentReference || b?.id || b?.reference).toLowerCase();
      const name = String(b?.customerName || b?.guestName).toLowerCase();
      return ref.includes(q) || name.includes(q);
    });
  }, [bookings, selectedDate, searchQuery]);

  const departmentRevenues = useMemo(() => {
    const revs = {} as Record<DepartmentKey, number>;
    DEPARTMENT_CONFIGS.forEach((c) => { revs[c.id] = filteredBookings.reduce((acc, b) => acc + calculateSingleBookingDeptRevenue(b, c), 0); });
    return revs;
  }, [filteredBookings]);

  const apartmentsRevenue = useMemo(() => filteredBookings.reduce((acc, b) => acc + getBookingApartmentRevenue(b), 0), [filteredBookings]);
  const totalRevenue = apartmentsRevenue + Object.values(departmentRevenues).reduce((a, b) => a + b, 0);

  const departmentData = useMemo(() => [
    { name: 'Apartments & Suites', revenue: apartmentsRevenue, color: 'text-cyan-400', barBg: 'bg-cyan-500' },
    ...DEPARTMENT_CONFIGS.map(c => ({ name: c.name, revenue: departmentRevenues[c.id], color: c.color, barBg: c.barBg }))
  ], [apartmentsRevenue, departmentRevenues]);

  const activeDeptConfig = DEPARTMENT_CONFIGS.find((d) => d.id === activeTab);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-mono text-sm">
        Authenticating Session...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-extrabold text-white tracking-wider">ADMIN ACCESS</h1>
          </div>

          {loginError && (
            <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs p-3 rounded-lg text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@domain.com"
                className="w-full px-4 py-2.5 text-xs bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 text-xs bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 text-xs font-bold rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black transition cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoggingIn ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div>
            <h1 className="text-sm font-extrabold tracking-wider text-cyan-400">ADMIN OPERATIONS</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Suite & Service Command Center</p>
          </div>
          <nav className="space-y-1.5 flex flex-wrap md:flex-col gap-1">
            <TabButton label="📊 Overview & Analytics" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <TabButton label="🏠 Apartments" isActive={activeTab === 'apartments'} onClick={() => setActiveTab('apartments')} />
            {DEPARTMENT_CONFIGS.map(tab => (
              <TabButton key={tab.id} label={tab.label} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
            ))}
          </nav>
        </div>
        <div className="pt-6 border-t border-gray-900 mt-6 md:mt-0 space-y-2">
          <button onClick={fetchBookings} disabled={loading} className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-gray-900 border border-gray-700 hover:bg-gray-800 transition text-cyan-300 cursor-pointer disabled:opacity-50">
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
          <button onClick={handleLogout} className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-red-950/40 border border-red-900 hover:bg-red-900/50 transition text-red-400 cursor-pointer">
            🔒 Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
          <span className="text-xs text-gray-400">{selectedDate ? `Filtering for: ${selectedDate}` : 'All Bookings View'}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400">Select Date:</span>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-900 border border-gray-700 text-cyan-300 focus:outline-none focus:border-cyan-500" />
            {selectedDate && <button onClick={() => setSelectedDate('')} className="px-2 py-1 text-[11px] bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-400 rounded-md cursor-pointer">Clear</button>}
          </div>
        </div>

        {activeTab === 'overview' && (
          <OverviewTab 
            filteredBookings={filteredBookings} 
            selectedDate={selectedDate} 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            totalRevenue={totalRevenue} 
            departmentData={departmentData} 
          />
        )}
        
        {activeTab === 'apartments' && (
          <ApartmentsTab 
            filteredBookings={filteredBookings} 
            apartmentsRevenue={apartmentsRevenue} 
          />
        )}
        
        {activeDeptConfig && (
          <DepartmentSection 
            config={activeDeptConfig} 
            bookings={filteredBookings} 
            revenue={departmentRevenues[activeDeptConfig.id]} 
          />
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---
const TabButton = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-between ${isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-lg shadow-cyan-950/40' : 'text-gray-400 hover:bg-gray-900 hover:text-white border border-transparent'}`}>
    <span>{label}</span>
  </button>
);

function OverviewTab({ filteredBookings, selectedDate, searchQuery, setSearchQuery, totalRevenue, departmentData }: any) {
  const topListings = Object.entries(filteredBookings.reduce((acc: any, b: any) => {
    const l = b?.listingId || 'Standard Suite';
    acc[l] = (acc[l] || 0) + 1;
    return acc;
  }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Operations Overview & Analytics</h2>
          <p className="text-xs text-gray-400 mt-0.5">Showing data for <span className="text-cyan-400 font-bold">{selectedDate || 'All Time'}</span></p>
        </div>
        <input type="text" placeholder="🔍 Search Ref No. or Guest..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-72 px-3.5 py-2 text-xs rounded-lg bg-gray-900 border border-gray-700 text-white focus:border-cyan-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" icon="📅" value={filteredBookings.length} desc="Active fulfillment stream" />
        <StatCard title="Total Active Units" icon="🏠" value={topListings.length} desc="High demand properties" />
        <StatCard title="Total Est. Guests" icon="👥" value={filteredBookings.reduce((acc: any, b: any) => acc + (Number(b?.guests) || 1), 0)} desc="Verified guest logs" />
        <StatCard title="Total Revenue" icon="💰" value={`₦${totalRevenue.toLocaleString()}`} desc="Aggregate earnings" />
      </div>

      <div className="p-6 rounded-xl bg-gray-950 border border-gray-800 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b border-gray-800 pb-3">Departmental Revenue Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {departmentData.map((dept: any) => (
            <div key={`dept-card-${dept.name}`} className="p-3.5 rounded-lg bg-gray-900 border border-gray-800">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-gray-400 font-semibold">{dept.name}</span>
                <span className={`font-mono font-bold ${dept.color}`}>₦{dept.revenue.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${dept.barBg}`} style={{ width: `${totalRevenue > 0 ? (dept.revenue / totalRevenue) * 100 : 0}%` }}></div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="pt-4 border-t border-gray-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">Kitchen & Operational Schedule</h3>
        <KitchenSchedule bookings={filteredBookings} showAddons={true} />
      </div>
    </div>
  );
}

const StatCard = ({ title, icon, value, desc }: any) => (
  <div className="p-5 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
    <div className="flex justify-between items-center text-gray-400 text-xs"><span>{title}</span><span className="p-2 rounded-lg bg-gray-900">{icon}</span></div>
    <div className="text-2xl font-extrabold text-white">{value.toLocaleString()}</div>
    <p className="text-[11px] text-emerald-400 font-medium">↑ {desc}</p>
  </div>
);

function ApartmentsTab({ filteredBookings, apartmentsRevenue }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-950 p-4 rounded-xl border border-gray-800">
        <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Active Apartments Schedule</h2>
        <div className="text-right">
          <span className="text-[11px] text-gray-400 block">Total Apartment Revenue</span>
          <span className="text-base font-extrabold text-cyan-400 font-mono">₦{apartmentsRevenue.toLocaleString()}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredBookings.map((b: Booking, idx: number) => {
          const bookingKey = b.id || b.reference || `apt-${idx}`;
          return (
            <div key={bookingKey} className="p-5 rounded-xl bg-gray-950 border border-gray-800 space-y-3">
              <div className="flex justify-between items-center"><span className="px-2.5 py-1 text-xs font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-800">{b?.listingId || 'N/A'}</span><span className="text-xs text-emerald-400 font-semibold">{b?.status || 'Confirmed'}</span></div>
              <div>
                <h3 className="text-sm font-bold text-white">{b?.customerName || 'Guest'}</h3>
                <p className="text-xs text-amber-400 font-mono mt-1">📞 {b?.phone || b?.phoneNumber || 'N/A'}</p>
                <p className="text-xs text-gray-400 mt-1">📅 {b?.checkIn ? new Date(b.checkIn).toLocaleDateString() : 'N/A'} - {b?.checkOut ? new Date(b.checkOut).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="pt-2 border-t border-gray-900 flex justify-between text-xs text-gray-400">
                <span>Nights: {Math.max(1, Number(b?.totalNights) || 1)}</span>
                <span className="text-cyan-400 font-mono font-bold">₦{getBookingApartmentRevenue(b).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DepartmentSection({ config, bookings, revenue }: { config: DeptConfig; bookings: Booking[]; revenue: number }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-950 p-4 rounded-xl border border-gray-800">
        <h2 className={`text-sm font-bold uppercase tracking-wider ${config.color}`}>{config.name} Logs</h2>
        <div className="text-right">
          <span className="text-[11px] text-gray-400 block">Department Revenue</span>
          <span className={`text-base font-extrabold font-mono ${config.color}`}>₦{revenue.toLocaleString()}</span>
        </div>
      </div>
      <div className="space-y-4">
        {bookings.map((b: Booking, idx: number) => {
          const addons = parseJson(b?.addons);
          const deptTotal = calculateSingleBookingDeptRevenue(b, config);
          const bookingKey = b.id || b.reference || `dept-${config.id}-${idx}`;

          return (
            <div key={bookingKey} className="p-5 rounded-xl bg-gray-950 border border-gray-800 flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <span className="px-2 py-0.5 text-[10px] uppercase font-mono rounded bg-gray-900 text-cyan-300 border border-gray-800">{b?.listingId || 'Suite'}</span>
                <h3 className="text-sm font-bold text-white mt-2">{b?.customerName || 'Guest'}</h3>
                <p className="text-xs text-amber-400 font-mono mt-1">📞 {b?.phone || b?.phoneNumber || 'N/A'}</p>
                <p className="text-xs text-gray-400 mt-1">Stay: {b?.checkIn ? new Date(b.checkIn).toLocaleDateString() : 'N/A'} - {b?.checkOut ? new Date(b.checkOut).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 min-w-[320px] space-y-3">
                <span className={`text-xs font-bold block uppercase border-b border-gray-800 pb-1 ${config.color}`}>{config.name} Details</span>
                <RenderDepartmentDetails configId={config.id} booking={b} addons={addons} />
                <div className="pt-2 border-t border-gray-800 flex justify-between font-bold text-xs">
                  <span className="text-gray-400 text-[11px]">Department Total:</span>
                  <span className={`font-mono font-extrabold text-sm ${config.color}`}>₦{deptTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RenderDepartmentDetails({ configId, booking, addons }: { configId: DepartmentKey; booking: Booking; addons: any }) {
  const deptTotal = calculateSingleBookingDeptRevenue(booking, DEPARTMENT_CONFIGS.find(c => c.id === configId)!);
  const durationStr = `${booking?.totalNights || 1} Nights`;

  const Row = ({ label, val }: any) => (
    <div className="flex justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-cyan-300">{val}</span>
    </div>
  );

  const EmptyMsg = ({ msg }: { msg: string }) => (
    <span className="text-xs text-gray-500 italic block">{msg}</span>
  );

  if (configId === 'kitchen') {
    const { names, totalCost } = parseKitchenDetailsAndCost(booking);

    return (
      <div className="text-xs text-gray-300 space-y-1">
        <span className="text-gray-400 block mb-1 font-medium">Found Items & Breakdown:</span>
        {names.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-cyan-300 max-h-36 overflow-y-auto">
            {names.map((m, i) => (
              <li key={`item-${i}`}>{m}</li>
            ))}
          </ul>
        ) : (
          <EmptyMsg msg={totalCost > 0 ? `Kitchen Allocation (₦${totalCost.toLocaleString()})` : 'No meal selections saved for this booking.'} />
        )}
      </div>
    );
  }

  if (configId === 'housekeeping') {
    const hk = addons?.housekeeping || addons?.housekeepingService;
    const isNone = !hk || ['None', 'No Housekeeping Service', 'false'].includes(String(hk));
    if (isNone && deptTotal === 0) return <EmptyMsg msg="No housekeeping service selected." />;

    const freq = typeof hk === 'object' ? (hk.frequency || hk.schedule) : (addons?.housekeepingSchedule || 'Daily');
    return (
      <div className="space-y-1.5 text-xs">
        <Row label="Service:" val={typeof hk === 'string' ? hk : 'Housekeeping Requested'} />
        <Row label="Frequency:" val={freq} />
        <Row label="Stay:" val={durationStr} />
        <Row label="Fee Allocated:" val={`₦${deptTotal.toLocaleString()}`} />
      </div>
    );
  }

  if (configId === 'chauffeur') {
    const c = addons?.chauffeur || addons?.chauffeurService;
    const isNone = !c || ['None', 'No Chauffeur Service', 'false'].includes(String(c));
    if (isNone && deptTotal === 0) return <EmptyMsg msg="No chauffeur service selected." />;

    const vehicle = typeof c === 'object' ? (c.car || c.vehicle || 'Luxury Sedan') : String(c);
    return (
      <div className="space-y-1.5 text-xs">
        <Row label="Vehicle:" val={vehicle} />
        <Row label="Stay:" val={durationStr} />
        <Row label="Fee Allocated:" val={`₦${deptTotal.toLocaleString()}`} />
      </div>
    );
  }

  if (configId === 'airport') {
    const a = addons?.airport || addons?.airportTransfer;
    const isNone = !a || ['None', 'No Airport Transfer', 'false'].includes(String(a));
    if (isNone && deptTotal === 0) return <EmptyMsg msg="No airport transfer selected." />;

    const car = typeof a === 'object' ? (a.car || 'Executive SUV') : 'Executive SUV';
    const dir = typeof a === 'object' ? (a.direction || a.tripType) : (addons?.airportDirection || 'One-Way');
    return (
      <div className="space-y-1.5 text-xs">
        <Row label="Car:" val={car} />
        <Row label="Direction:" val={String(dir).replace(/_/g, ' ')} />
        <Row label="Fee Allocated:" val={`₦${deptTotal.toLocaleString()}`} />
      </div>
    );
  }

  if (configId === 'security') {
    const s = addons?.security || addons?.securityService || addons?.securityType;
    const isNone = !s || ['None', 'No Additional Security', 'false'].includes(String(s));
    if (isNone && deptTotal === 0) return <EmptyMsg msg="No additional security selected." />;

    const count = typeof s === 'object' ? (s.count || s.guards || 1) : (addons?.securityCount || 1);
    return (
      <div className="space-y-1.5 text-xs">
        <Row label="Detail:" val={typeof s === 'string' ? s : 'Dedicated Guard'} />
        <Row label="Personnel:" val={`${Number(count)} Guard(s)`} />
        <Row label="Stay:" val={durationStr} />
        <Row label="Fee Allocated:" val={`₦${deptTotal.toLocaleString()}`} />
      </div>
    );
  }

  if (configId === 'laundry') {
    const l = addons?.laundry || addons?.drycleaning;
    const adult = Number(l?.adult || 0);
    const kid = Number(l?.kid || 0);
    const suit = Number(l?.suit || 0);
    if (adult === 0 && kid === 0 && suit === 0 && deptTotal === 0) return <EmptyMsg msg="No laundry service selected." />;

    return (
      <div className="space-y-1.5 text-xs">
        <Row label="Adult Pcs:" val={adult} />
        <Row label="Kid Pcs:" val={kid} />
        <Row label="Suit Pcs:" val={suit} />
        <Row label="Fee Allocated:" val={`₦${deptTotal.toLocaleString()}`} />
      </div>
    );
  }

  if (configId === 'beddings') {
    const b = addons?.beddings || addons?.linen;
    const sel = typeof b === 'object' ? (b.selection || b.type) : b;
    const isNone = !b || ['None', 'Standard (No Daily Change)', 'false'].includes(String(sel));
    if (isNone && deptTotal === 0) return <EmptyMsg msg="Standard Beddings (No extra change)." />;

    return (
      <div className="space-y-1.5 text-xs">
        <Row label="Selection:" val={String(sel)} />
        <Row label="Stay:" val={durationStr} />
        <Row label="Fee Allocated:" val={`₦${deptTotal.toLocaleString()}`} />
      </div>
    );
  }

  if (configId === 'shopper') {
    const sh = addons?.shopper || addons?.personalShopper;
    const isNone = !sh || ['None', 'false'].includes(String(sh));
    if (isNone && deptTotal === 0) return <EmptyMsg msg="No personal shopper selected." />;

    const count = typeof sh === 'object' ? (sh.count || sh.shoppers || 1) : 1;
    return (
      <div className="space-y-1.5 text-xs">
        <Row label="Shoppers:" val={Number(count)} />
        <Row label="Stay:" val={durationStr} />
        <Row label="Fee Allocated:" val={`₦${deptTotal.toLocaleString()}`} />
      </div>
    );
  }

  return <EmptyMsg msg="No extra services recorded." />;
}