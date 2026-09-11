'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  guestCount?: number;
  totalNights?: number;
  pricePerNight?: number;
  totalAmount?: number;
  grandTotal?: number;
  kitchenTotal?: number;
  mealTotal?: number;
  dailyMealSelections?: any;
  meals?: any;
  soups?: any;
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

const getProteinUnitPrice = (proteinName: string): number => {
  const p = proteinName.toLowerCase();
  if (p.includes('beef')) return 6000;
  if (p.includes('goat')) return 8000;
  if (p.includes('chicken')) return 10000;
  if (p.includes('turkey')) return 12000;
  if (p.includes('assorted')) return 9000;
  if (p.includes('fresh fish')) return 14000;
  if (p.includes('catfish')) return 16000;
  if (p.includes('croaker')) return 16000;
  if (p.includes('stockfish')) return 12000;
  if (p.includes('snail')) return 16000;
  if (p.includes('cow leg')) return 8000;
  if (p.includes('cow tail')) return 10000;
  if (p.includes('shaki') || p.includes('tripe')) return 7000;
  return 5000;
};

const getDishUnitPrice = (dishName: string): number => {
  const d = dishName.toLowerCase();
  if (d.includes('jollof')) return 50000;
  if (d.includes('fried rice')) return 50000;
  if (d.includes('coconut rice')) return 50000;
  if (d.includes('native rice')) return 45000;
  if (d.includes('ofada')) return 55000;
  if (d.includes('asaro') || d.includes('yam')) return 40000;
  if (d.includes('beans')) return 40000;
  if (d.includes('nkwobi')) return 45000;
  if (d.includes('efo') || d.includes('egusi') || d.includes('ogbono') || d.includes('soup')) return 45000;
  if (d.includes('pasta') || d.includes('spaghetti')) return 40000;
  if (d.includes('ukodo')) return 40000;
  return 45000;
};

const parseKitchenDetailsAndCost = (booking: Booking): { names: string[]; totalCost: number } => {
  const addons = parseJson(booking?.addons);
  
  const mealsObj = parseJson(
    booking?.dailyMealSelections || 
    booking?.meals || 
    addons?.kitchen || 
    addons?.food || 
    addons?.kitchenSelections ||
    booking?.kitchenSelections
  );
  const soupsObj = parseJson(booking?.soups || addons?.soups);

  const explicitTotal = extractNumber(
    booking?.kitchenTotal || booking?.mealTotal || booking?.mealsPrice || booking?.foodTotal ||
    mealsObj?.totalPrice || mealsObj?.grandTotal || mealsObj?.total || addons?.kitchenTotal || addons?.foodTotal ||
    booking?.kitchenRevenue || booking?.mealsRevenue
  );

  const itemNames: string[] = [];
  let calculatedCost = 0;

  const processDishNode = (dishNode: any, fallbackKey?: string): { subtotal: number; labelLines: string[] } => {
    if (!dishNode) return { subtotal: 0, labelLines: [] };
    
    if (typeof dishNode === 'number') {
      return { subtotal: dishNode, labelLines: [`Kitchen Package - ₦${dishNode.toLocaleString()}`] };
    }
    
    if (typeof dishNode !== 'object') {
      const p = extractNumber(dishNode);
      const name = String(fallbackKey || 'Meal Item').replace(/^(rc_|sp_|pr_|sw_|p_|s_)/gi, '').replace(/_/g, ' ').trim();
      const price = p > 0 ? p : getDishUnitPrice(name);
      return { subtotal: price, labelLines: [`${name.toUpperCase()} - ₦${price.toLocaleString()}`] };
    }
    
    const rawName = dishNode.foodName || dishNode.mealName || dishNode.name || dishNode.title || dishNode.item || fallbackKey;
    const baseDishPrice = extractNumber(dishNode.price ?? dishNode.unitPrice ?? dishNode.amount ?? dishNode.cost ?? dishNode.totalPrice ?? dishNode.total);

    const dishName = rawName && !['false', 'no', 'none', '0', ''].includes(String(rawName).toLowerCase())
      ? String(rawName).replace(/^(rc_|sp_|pr_|sw_|p_|s_)/gi, '').replace(/_/g, ' ').trim()
      : 'Kitchen Meal Selection';

    const finalDishPrice = baseDishPrice > 0 ? baseDishPrice : getDishUnitPrice(dishName);

    const liters = dishNode.liters ? Number(dishNode.liters) : (dishNode.quantity ? Number(dishNode.quantity) : (dishNode.qty ? Number(dishNode.qty) : 1));
    let baseDishSubtotal = finalDishPrice * (liters > 0 ? liters : 1);

    let proteinSubtotal = 0;
    const proteinLines: string[] = [];
    const rawProteins = dishNode.proteinAddons || dishNode.proteins || dishNode.proteinIds || dishNode.selectedProteins || dishNode.protein;

    if (rawProteins) {
      const processProteinItem = (pName: string, qty: number, unitPrice: number, priceOverride?: number) => {
        if (!pName || ['false', 'no', 'none'].includes(pName.toLowerCase())) return;
        const price = priceOverride && priceOverride > 0 ? priceOverride : (qty * (unitPrice > 0 ? unitPrice : getProteinUnitPrice(pName)));
        proteinSubtotal += price;
        proteinLines.push(`    + protein add-on: ${pName} (${qty} pcs) - ₦${Number(price || 0).toLocaleString()}`);
      };

      if (Array.isArray(rawProteins)) {
        rawProteins.forEach((p) => {
          if (typeof p === 'string') {
            const cleanP = p.replace(/^(pr_|p_)/gi, '').replace(/_/g, ' ').toUpperCase();
            const uPrice = getProteinUnitPrice(cleanP);
            processProteinItem(cleanP, 1, uPrice, uPrice);
          } else if (p && typeof p === 'object') {
            const pName = String(p.name || p.id || p.title || p.foodName || p.proteinName || '').replace(/^(pr_|p_)/gi, '').replace(/_/g, ' ').toUpperCase();
            const qty = extractNumber(p.qty || p.quantity || 1);
            const uPrice = extractNumber(p.unitPrice || p.price || p.cost || 0);
            const finalUPrice = uPrice > 0 ? uPrice : getProteinUnitPrice(pName);
            processProteinItem(pName, qty, finalUPrice, finalUPrice * qty);
          }
        });
      } else if (typeof rawProteins === 'object') {
        Object.entries(rawProteins).forEach(([pKey, pVal]: [string, any]) => {
          const cleanP = pKey.replace(/^(pr_|p_)/gi, '').replace(/_/g, ' ').toUpperCase();
          if (typeof pVal === 'number' && pVal > 0) {
            processProteinItem(cleanP, 1, pVal, pVal);
          } else if (pVal && typeof pVal === 'object') {
            const qty = extractNumber(pVal.qty || pVal.quantity || 1);
            const uPrice = extractNumber(pVal.unitPrice || pVal.price || pVal.cost || pVal.total || 0);
            const finalUPrice = uPrice > 0 ? uPrice : getProteinUnitPrice(cleanP);
            processProteinItem(cleanP, qty, finalUPrice, finalUPrice > 0 ? finalUPrice * qty : getProteinUnitPrice(cleanP) * qty);
          } else if (pVal === true || pVal === 'true' || pVal === 1) {
            const uPrice = getProteinUnitPrice(cleanP);
            processProteinItem(cleanP, 1, uPrice, uPrice);
          }
        });
      }
    }

    let swallowText = '';
    if (dishNode.swallow) {
      const swallowName = typeof dishNode.swallow === 'string' ? dishNode.swallow : (dishNode.swallow.name || '');
      if (swallowName && !['false', 'no', 'none', ''].includes(swallowName.toLowerCase())) {
        swallowText = `    🥣 Swallow: ${swallowName.toUpperCase()} (Free Accompaniment)`;
      }
    }

    const currentDishSubtotal = baseDishSubtotal + proteinSubtotal;
    const dishLabel = `${dishName.toUpperCase()} (${liters}L) - ₦${baseDishSubtotal.toLocaleString()}`;
    const mealTotalLine = `    ↳ meal total: ₦${currentDishSubtotal.toLocaleString()}`;

    return { 
      subtotal: currentDishSubtotal, 
      labelLines: [dishLabel, ...proteinLines, ...(swallowText ? [swallowText] : []), mealTotalLine] 
    };
  };

  const traverseAndCollect = (sourceObj: any) => {
    if (!sourceObj) return;
    if (typeof sourceObj === 'number') {
      calculatedCost += sourceObj;
      itemNames.push(`Kitchen Package - ₦${sourceObj.toLocaleString()}`);
      return;
    }
    if (typeof sourceObj !== 'object') return;
    
    Object.entries(sourceObj).forEach(([dateKey, dateVal]) => {
      if (['serviceMode', 'prepMode', 'totalPrice', 'totalCost', 'active', 'enabled'].includes(dateKey)) return;
      
      const parsedDateVal = parseJson(dateVal);
      if (!parsedDateVal) return;

      let dateSubtotal = 0;
      const dateLines: string[] = [];

      if (typeof parsedDateVal === 'object' && !Array.isArray(parsedDateVal)) {
        Object.entries(parsedDateVal).forEach(([subKey, subVal]) => {
          if (['serviceMode', 'prepMode', 'totalPrice'].includes(subKey)) return;
          const parsedSub = parseJson(subVal);

          const isDish = parsedSub && typeof parsedSub === 'object' && (parsedSub.foodName || parsedSub.mealName || parsedSub.name || parsedSub.title || parsedSub.item || parsedSub.price !== undefined || parsedSub.unitPrice !== undefined || parsedSub.proteins || parsedSub.proteinAddons || parsedSub.liters !== undefined || parsedSub.swallow !== undefined);

          if (isDish) {
            const res = processDishNode(parsedSub, subKey);
            if (res.subtotal > 0 || res.labelLines.length > 0) {
              dateSubtotal += res.subtotal;
              res.labelLines.forEach(l => dateLines.push(`  ${l}`));
            }
          } else if (parsedSub && typeof parsedSub === 'object') {
            dateLines.push(`  📂 ${subKey.toUpperCase()}:`);
            Object.entries(parsedSub).forEach(([dishKey, dishVal]) => {
              const res = processDishNode(dishVal, dishKey);
              if (res.subtotal > 0 || res.labelLines.length > 0) {
                dateSubtotal += res.subtotal;
                res.labelLines.forEach(l => dateLines.push(`    ${l}`));
              }
            });
          }
        });
      }

      if (dateSubtotal > 0 || dateLines.length > 0) {
        itemNames.push(`📅 ${dateKey.toUpperCase()}:`);
        dateLines.forEach(l => itemNames.push(l));
        itemNames.push(`  ↳ day total: ₦${dateSubtotal.toLocaleString()}`);
        calculatedCost += dateSubtotal;
      }
    });
  };

  traverseAndCollect(mealsObj);
  traverseAndCollect(soupsObj);
  
  if (addons?.kitchen && mealsObj !== addons.kitchen) {
    traverseAndCollect(addons?.kitchen);
  }

  const finalTotalCost = explicitTotal > 0 ? explicitTotal : (calculatedCost > 0 ? calculatedCost : 0);

  if (itemNames.length === 0 && finalTotalCost > 0) {
    itemNames.push(`Kitchen Package / Order - ₦${finalTotalCost.toLocaleString()}`);
  }

  return { names: Array.from(new Set(itemNames)), totalCost: finalTotalCost };
};

// --- CONCIERGE ADD-ON LIBRARY ---
const CONCIERGE_CATALOGUE: Record<DepartmentKey, { baseRate: number; calculate: (booking: Booking, addons: any, nights: number) => { cost: number; lines: string[] } }> = {
  kitchen: {
    baseRate: 0,
    calculate: (booking: Booking) => {
      const { totalCost } = parseKitchenDetailsAndCost(booking);
      return { 
        cost: totalCost, 
        lines: totalCost > 0 ? [`Kitchen & Dining Service Total - ₦${totalCost.toLocaleString()}`] : [] 
      };
    }
  },
  housekeeping: {
    baseRate: 25000,
    calculate: (booking: Booking, addons: any, nights: number) => {
      const hkObj = addons?.housekeeping || addons?.housekeepingService || booking?.housekeeping;
      
      if (hkObj === 'no' || hkObj === false || hkObj === 'false') {
        return { cost: 0, lines: [] };
      }

      const explicit = extractNumber(typeof hkObj === 'object' ? (hkObj.total || hkObj.price || hkObj.amount) : hkObj);
      const isDaily = typeof hkObj === 'string' && hkObj.toLowerCase() === 'yes';
      const scheduleType = booking.housekeepingSchedule || addons?.housekeepingSchedule || (isDaily ? 'daily' : 'standard');
      
      const cost = explicit > 0 ? explicit : 25000 * nights;
      return { cost, lines: [`Housekeeping Service (${scheduleType} schedule, ${nights} Night(s)) - ₦${cost.toLocaleString()}`] };
    }
  },
  chauffeur: {
    baseRate: 25000,
    calculate: (booking: Booking, addons: any, nights: number) => {
      const cObj = addons?.chauffeur || addons?.chauffeurService || booking?.chauffeur;
      if (!cObj || cObj === 'no' || cObj === false) return { cost: 0, lines: [] };

      const cStr = typeof cObj === 'string' ? cObj : (cObj.car || cObj.vehicle || cObj.type || '');
      const isLuxury = cStr.toLowerCase().includes('luxury');
      const rate = isLuxury ? 350000 : 25000;
      const cost = rate * nights;
      return { cost, lines: [`Chauffeur: ${cStr.toUpperCase()} (${nights} Day(s)) - ₦${cost.toLocaleString()}`] };
    }
  },
  airport: {
    baseRate: 45000,
    calculate: (booking: Booking, addons: any) => {
      const aObj = addons?.airport || addons?.airportTransfer || booking?.airport;
      if (!aObj || aObj === 'no' || aObj === false) return { cost: 0, lines: [] };

      const aStr = typeof aObj === 'string' ? aObj : (aObj.name || aObj.title || '');
      const isRound = aStr.toLowerCase().includes('round') || addons?.airportDirection === 'round_trip' || booking?.airportDirection === 'round_trip';
      const isLuxury = aStr.toLowerCase().includes('luxury');
      
      const basePrice = isLuxury ? 85000 : 45000;
      const cost = isRound ? basePrice * 2 : basePrice;

      return { cost, lines: [`Airport Transfer: ${aStr} - ₦${cost.toLocaleString()}`] };
    }
  },
  security: {
    baseRate: 80000,
    calculate: (booking: Booking, addons: any, nights: number) => {
      const sObj = addons?.security || addons?.securityService || booking?.security;
      if (!sObj || sObj === 'no' || sObj === 'false') return { cost: 0, lines: [] };

      const sStr = typeof sObj === 'string' ? sObj : (sObj.type || sObj.name || '');
      const isExecutive = sStr.toLowerCase().includes('executive') || sStr.toLowerCase().includes('tactical');
      const rate = isExecutive ? 120000 : 80000;
      const cost = rate * nights;
      return { cost, lines: [`Security Detail: ${sStr} (${nights} Nights) - ₦${cost.toLocaleString()}`] };
    }
  },
  laundry: {
    baseRate: 15000,
    calculate: (booking: Booking, addons: any) => {
      const lObj = addons?.laundry || booking?.laundry;
      if (!lObj || typeof lObj !== 'object') return { cost: 0, lines: [] };

      const adult = Number(lObj.adult || 0);
      const kid = Number(lObj.kid || 0);
      const suit = Number(lObj.suit || 0);
      
      const cost = (adult * 1500) + (kid * 1000) + (suit * 3000);
      const lines = [];
      if (adult > 0) lines.push(`  + Adult Laundry: ${adult} pcs (₦${(adult * 1500).toLocaleString()})`);
      if (kid > 0) lines.push(`  + Kid Laundry: ${kid} pcs (₦${(kid * 1000).toLocaleString()})`);
      if (suit > 0) lines.push(`  + Suit Drycleaning: ${suit} pcs (₦${(suit * 3000).toLocaleString()})`);
      
      return { cost, lines };
    }
  },
  beddings: {
    baseRate: 13000,
    calculate: (booking: Booking, addons: any, nights: number) => {
      const bObj = addons?.beddings || booking?.beddings;
      if (!bObj || typeof bObj !== 'object') return { cost: 0, lines: [] };

      const hasBedding = bObj.beddings === 'yes';
      const hasTowels = bObj.towels === 'yes';
      const selection = bObj.selection || 'Standard';

      let cost = 0;
      const lines = [];
      if (hasBedding) {
        const sub = 10000 * nights;
        cost += sub;
        lines.push(`${selection} Beddings Package (${nights} Nights) - ₦${sub.toLocaleString()}`);
      }
      if (hasTowels) {
        const sub = 3000 * nights;
        cost += sub;
        lines.push(`Towels Package (${nights} Nights) - ₦${sub.toLocaleString()}`);
      }
      return { cost, lines };
    }
  },
  shopper: {
    baseRate: 15000,
    calculate: (booking: Booking, addons: any, nights: number) => {
      const count = Number(addons?.shoppersCount || booking?.shoppersCount || 0);
      if (count <= 0) return { cost: 0, lines: [] };

      const cost = 15000 * count * nights;
      return { cost, lines: [`Personal Shopper Assignment (${count} Shopper(s) × ${nights} Days) - ₦${cost.toLocaleString()}`] };
    }
  }
};

const isBookingActiveForDepartment = (b: Booking, deptId: DepartmentKey): boolean => {
  const directRev = Number(b[`${deptId}Revenue`] || b[`${deptId}Total`] || 0);
  if (!isNaN(directRev) && directRev > 0) return true;
  if (b.departmentalBreakdown && Number(b.departmentalBreakdown[deptId]) > 0) return true;

  const addons = parseJson(b?.addons);
  const nights = Math.max(1, Number(b?.totalNights) || 1);
  const catalogEntry = CONCIERGE_CATALOGUE[deptId];

  if (catalogEntry) {
    const result = catalogEntry.calculate(b, addons, nights);
    return result.cost > 0 || result.lines.length > 0;
  }
  return false;
};

const calculateSingleBookingDeptRevenue = (b: Booking, config: DeptConfig): number => {
  const addons = parseJson(b?.addons);
  const nights = Math.max(1, Number(b?.totalNights) || 1);
  const catalogEntry = CONCIERGE_CATALOGUE[config.id];

  if (catalogEntry) {
    const calculated = catalogEntry.calculate(b, addons, nights).cost;
    if (calculated > 0) return calculated;
  }

  const directRev = Number(b[`${config.id}Revenue`] || b[`${config.id}Total`] || 0);
  if (!isNaN(directRev) && directRev > 0) return directRev;
  if (b.departmentalBreakdown && typeof b.departmentalBreakdown[config.id] === 'number') {
    return b.departmentalBreakdown[config.id];
  }

  return 0;
};

const getBookingApartmentRevenue = (b: Booking): number => {
  const directApt = Number(b?.apartmentRevenue || b?.baseRentTotal || b?.apartmentTotal || 0);
  if (directApt > 0) return directApt;

  const nights = Math.max(1, Number(b?.totalNights) || 1);
  const pricePerNight = Number(b?.pricePerNight || b?.listing?.pricePerNight || 0);
  if (pricePerNight > 0) return nights * pricePerNight;

  const directTotal = Number(b?.grandTotal || b?.totalAmount || b?.total);
  if (!isNaN(directTotal) && directTotal > 0) {
    const addonsRev = DEPARTMENT_CONFIGS.reduce((sum, config) => sum + calculateSingleBookingDeptRevenue(b, config), 0);
    return Math.max(0, directTotal - addonsRev);
  }

  return 0;
};

// --- MAIN COMPONENT ---
export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setBookings([]);
  };

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (session) {
      inactivityTimerRef.current = setTimeout(() => {
        handleLogout();
        alert('Session expired due to 60 minutes of inactivity.');
      }, 60 * 60 * 1000);
    }
  };

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

  useEffect(() => {
    if (!session) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleUserActivity = () => resetInactivityTimer();

    events.forEach(event => window.addEventListener(event, handleUserActivity));
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
    };
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchBookings = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
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
    DEPARTMENT_CONFIGS.forEach((c) => { 
      revs[c.id] = filteredBookings.reduce((acc, b) => acc + calculateSingleBookingDeptRevenue(b, c), 0); 
    });
    return revs;
  }, [filteredBookings]);

  const apartmentsRevenue = useMemo(() => filteredBookings.reduce((acc, b) => acc + getBookingApartmentRevenue(b), 0), [filteredBookings]);
  const totalRevenue = apartmentsRevenue + Object.values(departmentRevenues).reduce((a, b) => a + b, 0);

  const departmentData = useMemo(() => [
    { name: 'Apartments & Suites', revenue: apartmentsRevenue, color: 'text-cyan-400', barBg: 'bg-cyan-500' },
    ...DEPARTMENT_CONFIGS.map(c => ({ name: c.name, revenue: departmentRevenues[c.id], color: c.color, barBg: c.barBg }))
  ], [apartmentsRevenue, departmentRevenues]);

  const activeDeptConfig = DEPARTMENT_CONFIGS.find((d) => d.id === activeTab);
  const activeDeptBookings = useMemo(() => {
    if (!activeDeptConfig) return [];
    return filteredBookings.filter(b => isBookingActiveForDepartment(b, activeDeptConfig.id));
  }, [filteredBookings, activeDeptConfig]);

  if (isAuthChecking) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-mono text-sm">Authenticating Session...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2"><h1 className="text-xl font-extrabold text-white tracking-wider">ADMIN ACCESS</h1></div>
          {loginError && <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs p-3 rounded-lg text-center font-medium">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@domain.com" className="w-full px-4 py-2.5 text-xs bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full px-4 py-2.5 text-xs bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition" />
            </div>
            <button type="submit" disabled={isLoggingIn} className="w-full py-3 text-xs font-bold rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black transition cursor-pointer disabled:opacity-50 mt-2">
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
          <ApartmentsTab filteredBookings={filteredBookings} apartmentsRevenue={apartmentsRevenue} />
        )}
        
        {activeDeptConfig && (
          <DepartmentSection config={activeDeptConfig} bookings={activeDeptBookings} revenue={departmentRevenues[activeDeptConfig.id]} selectedDate={selectedDate} />
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
          <h2 className="text-xl font-extrabold text-white">Overview & Analytics</h2>
          <p className="text-xs text-gray-400 mt-0.5">Showing data for <span className="text-cyan-400 font-bold">{selectedDate || 'All Time'}</span></p>
        </div>
        <input type="text" placeholder="🔍 Search Ref No. or Guest..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-72 px-3.5 py-2 text-xs rounded-lg bg-gray-900 border border-gray-700 text-white focus:border-cyan-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" icon="📅" value={filteredBookings.length} desc="Active fulfillment stream" />
        <StatCard title="Total Active Units" icon="🏠" value={topListings.length} desc="High demand properties" />
        <StatCard title="Total Est. Guests" icon="👥" value={filteredBookings.reduce((acc: any, b: any) => acc + (Number(b?.guests || b?.guestCount) || 1), 0)} desc="Verified guest logs" />
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

function DepartmentSection({ config, bookings, revenue, selectedDate }: { config: DeptConfig; bookings: Booking[]; revenue: number; selectedDate: string }) {
  const handleDownloadSchedule = () => {
    let reportText = `========================================\n`;
    reportText += `DEPARTMENT SCHEDULE: ${config.name.toUpperCase()}\n`;
    reportText += `Generated For: ${selectedDate || 'All-Time / Active Shifts'}\n`;
    reportText += `Total Department Revenue: ₦${revenue.toLocaleString()}\n`;
    reportText += `========================================\n\n`;

    if (bookings.length === 0) {
      reportText += `No active bookings/tasks found for this department.\n`;
    } else {
      bookings.forEach((b, idx) => {
        const addons = parseJson(b?.addons);
        const nights = Math.max(1, Number(b?.totalNights) || 1);
        const catalogEntry = CONCIERGE_CATALOGUE[config.id];
        const deptTotal = calculateSingleBookingDeptRevenue(b, config);
        const refNo = b?.paymentReference || b?.reference || b?.id || 'N/A';

        reportText += `[${idx + 1}] Guest: ${b?.customerName || 'Guest'} (${b?.listingId || 'Suite'})\n`;
        reportText += `    - Ref No: ${refNo}\n`;
        reportText += `    - Phone: ${b?.phone || b?.phoneNumber || 'N/A'}\n`;
        reportText += `    - Stay: ${b?.checkIn ? new Date(b.checkIn).toLocaleDateString() : 'N/A'} to ${b?.checkOut ? new Date(b.checkOut).toLocaleDateString() : 'N/A'} (${nights} Nights)\n`;
        
        if (catalogEntry) {
          const { lines } = catalogEntry.calculate(b, addons, nights);
          reportText += `    - Task Details:\n`;
          if (lines.length > 0) {
            lines.forEach(l => reportText += `      * ${l}\n`);
          } else {
            reportText += `      * Standard Assignment\n`;
          }
        }
        reportText += `    - Subtotal Allocation: ₦${deptTotal.toLocaleString()}\n`;
        reportText += `----------------------------------------\n`;
      });
    }

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.id}_schedule_${selectedDate || 'all_time'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-950 p-4 rounded-xl border border-gray-800 gap-4">
        <div>
          <h2 className={`text-sm font-extrabold uppercase tracking-wider ${config.color}`}>{config.name} Logs & Schedule</h2>
          <p className="text-[11px] text-gray-400">Download or export operational assignments for department head distribution.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-gray-400 block">Department Revenue</span>
            <span className={`text-base font-extrabold font-mono ${config.color}`}>₦{revenue.toLocaleString()}</span>
          </div>
          <button 
            onClick={handleDownloadSchedule}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-cyan-950 border border-cyan-700 hover:bg-cyan-900 text-cyan-300 transition cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            📥 Download Schedule
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="p-6 rounded-xl bg-gray-950 border border-gray-800 text-center text-gray-500 text-xs italic">
            No active records found for {config.name}.
          </div>
        ) : (
          bookings.map((b: Booking, idx: number) => {
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
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 min-w-[340px] space-y-3">
                  <span className={`text-xs font-bold block uppercase border-b border-gray-800 pb-1 ${config.color}`}>{config.name} Details</span>
                  <RenderDepartmentDetails configId={config.id} booking={b} addons={addons} />
                  <div className="pt-2 border-t border-gray-800 flex justify-between font-bold text-xs">
                    <span className="text-gray-400 text-[11px]">Total Order:</span>
                    <span className={`font-mono font-extrabold text-sm ${config.color}`}>₦{deptTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RenderDepartmentDetails({ configId, booking, addons }: { configId: DepartmentKey; booking: Booking; addons: any }) {
  const nights = Math.max(1, Number(booking?.totalNights) || 1);
  const catalogEntry = CONCIERGE_CATALOGUE[configId];

  if (!catalogEntry) return <span className="text-xs text-gray-500 italic">No configuration found.</span>;

  const { lines, cost } = catalogEntry.calculate(booking, addons, nights);

  return (
    <div className="text-xs text-gray-300 space-y-1.5">
      {lines.length > 0 ? (
        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
          {lines.map((line, i) => (
            <div key={`line-${i}`} className="font-mono text-[11px] text-cyan-300">
              {line}
            </div>
          ))}
        </div>
      ) : (
        <span className="text-xs text-gray-500 italic">No selection details recorded.</span>
      )}
      <div className="pt-1 text-[11px] text-gray-400 font-mono border-t border-gray-800 mt-2 flex justify-between">
        <span>Calculated Subtotal:</span>
        <span className="text-cyan-400 font-bold">₦{cost.toLocaleString()}</span>
      </div>
    </div>
  );
}