'use client';

import React, { useState, useEffect, useMemo } from 'react';
import KitchenSchedule from './KitchenSchedule';

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

const calculateKitchenItemCost = (itemObj: any): number => {
  let itemCost = 5000;
  if (itemObj && typeof itemObj === 'object') {
    const explicitPrice = itemObj.price || itemObj.amount || itemObj.cost;
    if (explicitPrice !== undefined) {
      itemCost = extractNumber(explicitPrice);
    } else {
      const proteinRaw = Array.isArray(itemObj.proteinIds) ? itemObj.proteinIds : [];
      const swallowRaw = Array.isArray(itemObj.swallowIds) ? itemObj.swallowIds : [];
      itemCost += (proteinRaw.length + swallowRaw.length) * 1000;
    }
  }
  return itemCost;
};

const deepSum = (obj: any): number => {
  let sum = 0;
  if (!obj || typeof obj !== 'object') return sum;
  if (Array.isArray(obj)) {
    obj.forEach((item) => { sum += deepSum(item); });
  } else {
    const p = obj.price || obj.amount || obj.cost || obj.total;
    if (p !== undefined) {
      const qty = extractNumber(obj.qty || obj.quantity || obj.count || 1);
      sum += extractNumber(p) * (qty > 0 ? qty : 1);
    } else {
      if (obj.proteinIds || obj.swallowIds || obj.liters || obj.prepMode || obj.serviceMode || obj.protein || obj.swallow) {
        sum += calculateKitchenItemCost(obj);
      }
      Object.entries(obj).forEach(([key, val]) => {
        if (!['proteinIds', 'swallowIds'].includes(key)) {
          sum += deepSum(val);
        }
      });
    }
  }
  return sum;
};

const deepExtractMealNames = (obj: any): string[] => {
  let names: string[] = [];
  if (!obj || typeof obj !== 'object') return names;
  
  if (Array.isArray(obj)) {
    obj.forEach((item) => names.push(...deepExtractMealNames(item)));
  } else {
    for (const [key, val] of Object.entries(obj)) {
      if (key.match(/^\d{4}-\d{2}-\d{2}$/) || ['meals', 'soups', 'prepModes', 'serviceMode'].includes(key)) {
        if (key === 'serviceMode') {
          names.push(`Service Mode: ${String(val).replace(/_/g, ' ')}`);
        } else {
          names.push(...deepExtractMealNames(val));
        }
      } else if (typeof val === 'object' && val !== null) {
        const formattedName = key.replace(/_/g, ' ').replace(/^(rc|sp)\s*/i, '');
        
        const proteinRaw = Array.isArray((val as any).proteinIds) ? (val as any).proteinIds : [];
        const proteinCounts: Record<string, number> = {};
        proteinRaw.forEach((p: string) => {
          const cleanP = p.replace(/^pr_/, '').replace(/_/g, ' ');
          proteinCounts[cleanP] = (proteinCounts[cleanP] || 0) + 1;
        });
        const proteinParts = Object.entries(proteinCounts).map(([prot, count]) => count > 1 ? `${prot} - ${count}pcs` : `${prot} - 1pc`);

        const swallowRaw = Array.isArray((val as any).swallowIds) ? (val as any).swallowIds : [];
        const swallowCounts: Record<string, number> = {};
        swallowRaw.forEach((s: string) => {
          const cleanS = s.replace(/^sw_/, '').replace(/_/g, ' ');
          swallowCounts[cleanS] = (swallowCounts[cleanS] || 0) + 1;
        });
        const swallowParts = Object.entries(swallowCounts).map(([swal, count]) => count > 1 ? `${swal} - ${count} wraps` : `${swal} - 1 wrap`);

        let detail = formattedName;
        if ((val as any).liters) detail += ` (${(val as any).liters}L)`;
        if ((val as any).prepMode) detail += ` [Prep: ${String((val as any).prepMode).replace(/_/g, ' ')}]`;
        if ((val as any).serviceMode) detail += ` [Service: ${String((val as any).serviceMode).replace(/_/g, ' ')}]`;
        if (proteinParts.length > 0) detail += ` [Proteins: ${proteinParts.join(', ')}]`;
        if (swallowParts.length > 0) detail += ` [Swallow: ${swallowParts.join(', ')}]`;
        
        names.push(detail);
      } else if (typeof val === 'string' || typeof val === 'number') {
        if (key === 'serviceMode' || key === 'prepMode') {
          names.push(`${key.replace(/_/g, ' ')}: ${String(val).replace(/_/g, ' ')}`);
        } else if (!['in_house', 'delivery'].includes(String(val))) {
          names.push(`${key.replace(/_/g, ' ')}: ${val}`);
        } else {
          names.push(`Service Mode: ${String(val).replace(/_/g, ' ')}`);
        }
      }
    }
  }
  return names;
};

const calculateSingleBookingDeptRevenue = (b: Booking, config: DeptConfig): number => {
  const directRev = Number(b[`${config.id}Revenue`]);
  if (!isNaN(directRev) && directRev > 0) return directRev;
  if (b.departmentalBreakdown && typeof b.departmentalBreakdown[config.id] === 'number' && b.departmentalBreakdown[config.id] > 0) {
    return b.departmentalBreakdown[config.id];
  }

  let fallbackRev = 0;
  const addons = parseJson(b?.addons);
  const mealsObj = parseJson(b?.dailyMealSelections || b?.meals);
  const nights = Math.max(1, Number(b?.totalNights) || 1);

  if (config.id === 'kitchen') {
    fallbackRev += deepSum(mealsObj);
    if (fallbackRev === 0) fallbackRev += deepSum(addons?.kitchen || addons?.food || addons?.meals);
    
    if (fallbackRev === 0 && Object.keys(mealsObj).length > 0) {
      const helperWalk = (node: any) => {
        let count = 0;
        if (!node || typeof node !== 'object') return 0;
        if (Array.isArray(node)) {
          node.forEach(item => count += helperWalk(item));
        } else {
          for (const [k, v] of Object.entries(node)) {
            if (k.match(/^\d{4}-\d{2}-\d{2}$/) || ['meals', 'soups', 'prepModes', 'serviceMode'].includes(k)) {
              count += helperWalk(v);
            } else if (v && typeof v === 'object') {
              count += calculateKitchenItemCost(v);
            }
          }
        }
        return count;
      };
      fallbackRev = helperWalk(mealsObj);
    }
  } else if (config.id === 'chauffeur') {
    const c = addons?.chauffeur || addons?.chauffeurService;
    if (c && !['None', 'false'].includes(String(c))) {
      const rate = extractNumber(c?.baseRate || c?.price || c?.amount);
      fallbackRev = rate > 0 ? rate * nights : deepSum(c);
    }
  } else if (config.id === 'airport') {
    const a = addons?.airport || addons?.airportTransfer;
    if (a && !['None', 'false'].includes(String(a))) {
      const rate = extractNumber(a?.baseRate || a?.price || a?.amount);
      const mult = String(a?.tripType || a?.direction).toLowerCase().includes('round') ? 2 : 1;
      fallbackRev = rate > 0 ? rate * mult : deepSum(a);
    }
  } else if (config.id === 'security' || config.id === 'shopper') {
    const s = addons?.[config.id] || addons?.[`${config.id}Service`] || addons?.personalShopper || addons?.securityType;
    if (s && !['None', 'No Additional Security', 'false'].includes(String(s))) {
      const rate = extractNumber(s?.baseRate || s?.price || s?.amount);
      const count = extractNumber(s?.count || s?.guards || s?.shoppers || 1);
      fallbackRev = rate > 0 ? rate * count * nights : deepSum(s);
    }
  } else {
    const targetAddon = addons?.[config.id] || addons?.[config.keywords[1]] || addons?.[config.keywords[0]];
    if (targetAddon && !['None', 'No Housekeeping Service', 'Standard (No Daily Change)', 'false'].includes(String(targetAddon))) {
      fallbackRev += deepSum(targetAddon);
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : data?.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (selectedDate) {
        const targetTime = new Date(selectedDate).setHours(0, 0, 0, 0);
        const checkInRaw = b?.checkIn || b?.createdAt || b?.date;
        const checkOutRaw = b?.checkOut || checkInRaw;
        
        if (!checkInRaw) return false;

        const checkInTime = new Date(checkInRaw).setHours(0, 0, 0, 0);
        const checkOutTime = new Date(checkOutRaw).setHours(0, 0, 0, 0);

        if (targetTime < checkInTime || targetTime > checkOutTime) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const ref = String(b?.paymentReference || b?.id).toLowerCase();
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
        <div className="pt-6 border-t border-gray-900 mt-6 md:mt-0">
          <button onClick={fetchBookings} disabled={loading} className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-gray-900 border border-gray-700 hover:bg-gray-800 transition text-cyan-300 cursor-pointer disabled:opacity-50">
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
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
        {activeTab === 'overview' && <OverviewTab filteredBookings={filteredBookings} selectedDate={selectedDate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} totalRevenue={totalRevenue} departmentData={departmentData} departmentRevenues={departmentRevenues} />}
        {activeTab === 'apartments' && <ApartmentsTab filteredBookings={filteredBookings} apartmentsRevenue={apartmentsRevenue} />}
        {activeDeptConfig && <DepartmentSection config={activeDeptConfig} bookings={filteredBookings} revenue={departmentRevenues[activeDeptConfig.id]} />}
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
          {departmentData.map((dept: any, i: number) => (
            <div key={i} className="p-3.5 rounded-lg bg-gray-900 border border-gray-800">
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
        {filteredBookings.map((b: Booking, idx: number) => (
          <div key={idx} className="p-5 rounded-xl bg-gray-950 border border-gray-800 space-y-3">
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
        ))}
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

          return (
            <div key={idx} className="p-5 rounded-xl bg-gray-950 border border-gray-800 flex flex-col md:flex-row justify-between items-start gap-4">
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
    const rawMeals = booking?.dailyMealSelections || booking?.meals || addons?.kitchen || addons?.food || addons?.meals;
    const meals = parseJson(rawMeals);
    const selectedMealList = Array.from(new Set(deepExtractMealNames(meals)));
    
    return (
      <div className="text-xs text-gray-300 space-y-1">
        <span className="text-gray-400 block mb-1 font-medium">Found Items:</span>
        {selectedMealList.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-cyan-300 max-h-32 overflow-y-auto">
            {selectedMealList.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        ) : (
          <EmptyMsg msg={deptTotal > 0 ? `Kitchen Allocation (₦${deptTotal.toLocaleString()})` : 'No meal selections saved for this booking.'} />
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