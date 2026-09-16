'use client';

import React, { useMemo, useState } from 'react';

interface ProteinItem {
  name: string;
  qty: number;
  price?: number;
}

interface ProcessedDish {
  slot: string;
  category: string;
  name: string;
  liters?: number;
  proteins?: ProteinItem[];
  swallow?: string;
  swallowPrice?: number;
  price?: number;
  subItems?: { name: string; qty: number; price?: number; note?: string }[];
  unit?: string;
}

interface BookingItem {
  id: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  phone?: string;
  phoneNumber?: string;
  customerPhone?: string;
  guestCount?: number;
  totalNights?: number;
  guestInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    guestCount?: number;
  };
  dailyMealSelections?: any;
  meals?: any;
  soups?: any;
  addons?: any;
  servicesTotal?: number;
  servicesCut?: number;
  kitchenTotal?: number;
  mealTotal?: number;
  mealsPrice?: number;
  foodTotal?: number;
  kitchenRevenue?: number;
  mealsRevenue?: number;
  user?: {
    email?: string;
    name?: string;
  } | null;
  [key: string]: any;
}

interface KitchenScheduleProps {
  bookings: BookingItem[];
  showAddons?: boolean;
}

const safeParseJson = (data: any): any => {
  if (!data) return {};
  if (typeof data === 'object') return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const extractNumber = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : num;
};

const formatItemName = (id: string): string => {
  if (!id) return '';
  return String(id)
    .replace(/^(sp_|rc_|pr_|p_|s_|sw_|dn_|bf_)/gi, '')
    .replace(/_/g, ' ')
    .trim()
    .toUpperCase();
};

const getMealUnitPrice = (mealName: string): number => {
  const name = mealName.toLowerCase();
  if (name.includes('jollof')) return 50000;
  if (name.includes('fried rice')) return 50000;
  if (name.includes('coconut rice')) return 50000;
  if (name.includes('native rice')) return 45000;
  if (name.includes('ofada')) return 55000;
  if (name.includes('efo') || name.includes('egusi') || name.includes('ogbono') || name.includes('soup')) return 45000;
  if (name.includes('pasta') || name.includes('spaghetti')) return 40000;
  return 45000;
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

const parseProteinsWithQty = (rawProteins: any): ProteinItem[] => {
  const parsedInput = safeParseJson(rawProteins);
  if (!parsedInput) return [];
  const proteinMap: Record<string, { qty: number; price: number }> = {};

  if (Array.isArray(parsedInput)) {
    parsedInput.forEach((p) => {
      if (typeof p === 'string') {
        const key = formatItemName(p);
        const unitPrice = getProteinUnitPrice(key);
        proteinMap[key] = {
          qty: (proteinMap[key]?.qty || 0) + 1,
          price: (proteinMap[key]?.price || 0) + unitPrice,
        };
      } else if (typeof p === 'object' && p !== null) {
        const name = formatItemName(p.name || p.id || p.title || 'Protein');
        const qty = Number(p.qty || p.quantity || p.count || 1);
        const unitPrice = Number(p.price || p.amount || p.cost || 0) || getProteinUnitPrice(name);
        const price = qty * unitPrice;
        proteinMap[name] = {
          qty: (proteinMap[name]?.qty || 0) + qty,
          price: (proteinMap[name]?.price || 0) + price,
        };
      }
    });
  } else if (typeof parsedInput === 'object') {
    Object.entries(parsedInput).forEach(([key, val]) => {
      const name = formatItemName(key);
      const unitPrice = getProteinUnitPrice(name);
      const valObj = safeParseJson(val);
      const qty = typeof valObj === 'number' ? 1 : Number(valObj?.qty || valObj?.quantity || valObj?.count || 1);
      const price = (typeof valObj === 'number' ? valObj : Number(valObj?.price || valObj?.amount || valObj?.cost || 0)) || (qty * unitPrice);
      proteinMap[name] = {
        qty: (proteinMap[name]?.qty || 0) + qty,
        price: (proteinMap[name]?.price || 0) + price,
      };
    });
  }

  return Object.entries(proteinMap).map(([name, data]) => ({
    name,
    qty: data.qty,
    price: data.price,
  }));
};

const parseAddonsIntoStructuredItems = (addons: any, nights: number = 1): ProcessedDish[] => {
  const parsed = safeParseJson(addons);
  if (!parsed || typeof parsed !== 'object') return [];

  const items: ProcessedDish[] = [];
  const stayDurationNote = `(${nights}night${nights > 1 ? 's' : ''}/${nights}day${nights > 1 ? 's' : ''})`;

  if (parsed.airport) {
    const isRound = String(parsed.airport).toLowerCase().includes('round') || parsed.airportDirection === 'round_trip';
    const isLuxury = String(parsed.airport).toLowerCase().includes('luxury');
    const basePrice = isLuxury ? 85000 : 45000;
    const price = isRound ? basePrice * 2 : basePrice;
    const tripTypeNote = isRound ? 'Round Trip (2x Fare)' : 'One Way';
    
    items.push({
      slot: 'Airport',
      category: 'Airport Transfer',
      name: isLuxury ? 'LUXURY SUV AIRPORT TRANSFER' : 'STANDARD AIRPORT TRANSFER',
      liters: isRound ? 2 : 1,
      unit: tripTypeNote,
      price,
      subItems: [{ name: `${String(parsed.airport)} - ${tripTypeNote}`, qty: 1, price, note: stayDurationNote }]
    });
  }

  if (parsed.laundry && typeof parsed.laundry === 'object') {
    const adult = Number(parsed.laundry.adult || 0);
    const kid = Number(parsed.laundry.kid || 0);
    const suit = Number(parsed.laundry.suit || 0);
    const totalLaundryPrice = (adult * 1500) + (kid * 1000) + (suit * 3000);

    const sub = [];
    if (adult > 0) sub.push({ name: 'Adult Laundry Pcs', qty: adult, price: adult * 1500, note: stayDurationNote });
    if (kid > 0) sub.push({ name: 'Kid Laundry Pcs', qty: kid, price: kid * 1000, note: stayDurationNote });
    if (suit > 0) sub.push({ name: 'Suit Drycleaning Pcs', qty: suit, price: suit * 3000, note: stayDurationNote });

    if (totalLaundryPrice > 0) {
      items.push({
        slot: 'Laundry',
        category: 'Laundry & Drycleaning',
        name: 'DRYCLEANING & LAUNDRY ORDER',
        liters: adult + kid + suit,
        unit: 'Pieces',
        price: totalLaundryPrice,
        subItems: sub
      });
    }
  }

  if (parsed.beddings && typeof parsed.beddings === 'object') {
    const hasBedding = parsed.beddings.beddings === 'yes';
    const hasTowels = parsed.beddings.towels === 'yes';
    const selection = parsed.beddings.selection || 'Standard';
    
    let beddingsPrice = hasBedding ? 10000 * nights : 0;
    let towelsPrice = hasTowels ? 3000 * nights : 0;
    let totalBeddingPrice = beddingsPrice + towelsPrice;

    const sub = [];
    if (hasBedding) sub.push({ name: `${selection} Bedding Package`, qty: nights, price: beddingsPrice, note: stayDurationNote });
    if (hasTowels) sub.push({ name: 'Towels Package', qty: nights, price: towelsPrice, note: stayDurationNote });

    if (totalBeddingPrice > 0) {
      items.push({
        slot: 'Beddings',
        category: 'Beddings & Linen',
        name: `LINEN SERVICE (${selection.toUpperCase()})`,
        liters: nights,
        unit: 'Nights',
        price: totalBeddingPrice,
        subItems: sub
      });
    }
  }

  if (parsed.security) {
    const secStr = String(parsed.security);
    const isExecutive = secStr.toLowerCase().includes('executive') || secStr.toLowerCase().includes('tactical');
    const rate = isExecutive ? 120000 : 80000;
    const price = rate * nights;

    items.push({
      slot: 'Security',
      category: 'Security Detail',
      name: secStr.toUpperCase(),
      liters: nights,
      unit: 'Nights',
      price,
      subItems: [{ name: 'Tactical Personnel Assignment', qty: 1, price, note: stayDurationNote }]
    });
  }

  if (parsed.chauffeur) {
    const chaufObj = safeParseJson(parsed.chauffeur);
    const chaufStr = typeof parsed.chauffeur === 'string' ? parsed.chauffeur : (chaufObj.car || chaufObj.vehicle || chaufObj.type || chaufObj.name || '');
    const cLower = chaufStr.toLowerCase();

    // Updated Chauffeur rates: Executive Commuter (#150,000), Executive Sedan (#250,000), Luxury Sedan (#350,000)
    let rate = 150000;
    if (cLower.includes('luxury')) {
      rate = 350000;
    } else if (cLower.includes('sedan') || cLower.includes('executive sedan')) {
      rate = 250000;
    } else if (cLower.includes('commuter') || cLower.includes('executive commuter')) {
      rate = 150000;
    }

    const explicitPrice = extractNumber(typeof chaufObj === 'object' ? (chaufObj.price || chaufObj.amount || chaufObj.cost || chaufObj.total) : 0);
    const unitRate = explicitPrice > 0 ? explicitPrice : rate;
    const price = unitRate * nights;

    items.push({
      slot: 'Chauffeur',
      category: 'Chauffeur Service',
      name: chaufStr ? chaufStr.toUpperCase() : 'EXECUTIVE COMMUTER',
      liters: nights,
      unit: 'Days',
      price,
      subItems: [{ name: 'Chauffeur & Vehicle Allocation', qty: nights, price, note: stayDurationNote }]
    });
  }

  if (parsed.housekeeping === 'yes' || parsed.housekeepingSchedule) {
    const price = 25000 * nights;
    const scheduleType = parsed.housekeepingSchedule || 'daily';
    items.push({
      slot: 'Housekeeping',
      category: 'Housekeeping',
      name: `HOUSEKEEPING SERVICE (${scheduleType.toUpperCase()} SCHEDULE)`,
      liters: nights,
      unit: 'Nights',
      price,
      subItems: [{ name: 'Full Unit Cleaning & Maintenance', qty: nights, price, note: stayDurationNote }]
    });
  }

  if (parsed.shoppersCount && Number(parsed.shoppersCount) > 0) {
    const count = Number(parsed.shoppersCount);
    const price = 15000 * count * nights;
    items.push({
      slot: 'Shopper',
      category: 'Personal Shopper',
      name: 'PERSONAL SHOPPER ASSIGNMENT',
      liters: count,
      unit: 'Shopper(s)',
      price,
      subItems: [{ name: 'Errand & Procurement Service', qty: count, price, note: stayDurationNote }]
    });
  }

  return items;
};

export default function KitchenSchedule({ bookings, showAddons = false }: KitchenScheduleProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const activeKitchenBookings = useMemo(() => {
    return (bookings || []).filter((booking) => {
      const rawAddons = safeParseJson(booking.addons);
      const dailySelections = safeParseJson(booking.dailyMealSelections);
      const hasMeals = dailySelections.meals || dailySelections.soups || booking.meals || rawAddons?.meals || booking.soups || rawAddons?.soups || rawAddons?.kitchen;
      const kitchenCost = extractNumber(booking.servicesTotal || booking.kitchenTotal || booking.mealTotal || booking.foodTotal || booking.servicesCut);
      return hasMeals || kitchenCost > 0;
    });
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (!searchTerm.trim()) return activeKitchenBookings;
    const query = searchTerm.toLowerCase();
    return activeKitchenBookings.filter((b) => {
      const guestName = (b.customerName || b.guestInfo?.fullName || b.user?.name || '').toLowerCase();
      const listing = (b.listingId || '').toLowerCase();
      const phone = (b.phone || b.phoneNumber || b.customerPhone || b.guestInfo?.phone || '').toLowerCase();
      return guestName.includes(query) || listing.includes(query) || phone.includes(query);
    });
  }, [activeKitchenBookings, searchTerm]);

  if (!activeKitchenBookings || activeKitchenBookings.length === 0) {
    return <div className="text-gray-400 p-4 text-xs italic">No active kitchen schedule logs available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Print */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-gray-900/80 p-4 rounded-xl border border-gray-800 print:hidden">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search by guest name, listing ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/60 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          🖨️ Print Schedule
        </button>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-gray-400 p-6 text-center text-xs italic bg-gray-950 rounded-xl border border-gray-800">
          No bookings match your search criteria.
        </div>
      ) : (
        <div className="space-y-8">
          {filteredBookings.map((booking, bIdx) => {
            const rawAddons = safeParseJson(booking.addons);
            const dailySelections = safeParseJson(booking.dailyMealSelections);
            const nights = Math.max(1, Number(booking.totalNights) || 1);
            
            const dbStoredTotal = extractNumber(
              booking.servicesTotal || 
              booking.servicesCut || 
              booking.kitchenTotal || 
              booking.mealTotal || 
              booking.mealsPrice || 
              booking.foodTotal ||
              booking.kitchenRevenue || 
              booking.mealsRevenue
            );

            const mealsObj = safeParseJson(
              dailySelections.meals || 
              booking.meals || 
              rawAddons?.meals || 
              rawAddons?.kitchen
            );
            const soupsObj = safeParseJson(
              dailySelections.soups || 
              booking.soups || 
              rawAddons?.soups
            );

            const guestName = booking.customerName || booking.guestInfo?.fullName || booking.user?.name || 'Guest / N/A';
            const guestPhone = booking.phone || booking.phoneNumber || booking.customerPhone || booking.guestInfo?.phone || 'N/A';
            const totalGuests = booking.guestCount || booking.guestInfo?.guestCount || 1;

            const groupedMeals: Record<string, ProcessedDish[]> = {};
            const allParsedDishes: ProcessedDish[] = [];

            const processSourceObj = (sourceData: any, categoryType: string) => {
              const parsedSource = safeParseJson(sourceData);
              if (!parsedSource || typeof parsedSource !== 'object') return;

              Object.entries(parsedSource).forEach(([dateKey, dateVal]) => {
                if (!dateKey || ['serviceMode', 'prepMode', 'totalPrice', 'totalCost', 'active', 'enabled'].includes(dateKey)) return;
                const targetDate = `${dateKey.toUpperCase()} (${categoryType})`;
                if (!groupedMeals[targetDate]) groupedMeals[targetDate] = [];

                const parsedDateVal = safeParseJson(dateVal);
                if (!parsedDateVal || typeof parsedDateVal !== 'object') return;

                Object.entries(parsedDateVal).forEach(([subKey, subVal]) => {
                  if (['totalPrice', 'serviceMode', 'prepMode'].includes(subKey)) return;
                  const parsedSub = safeParseJson(subVal);

                  const isDish = parsedSub && typeof parsedSub === 'object' && (parsedSub.foodName || parsedSub.mealName || parsedSub.name || parsedSub.title || parsedSub.item || parsedSub.price !== undefined || parsedSub.unitPrice !== undefined || parsedSub.proteins || parsedSub.proteinAddons || parsedSub.liters !== undefined);

                  if (isDish) {
                    const dishKey = subKey;
                    const innerParsed = parsedSub;

                    const rawDishKey = innerParsed.name || innerParsed.title || innerParsed.foodName || innerParsed.mealName || dishKey;
                    const dishName = formatItemName(rawDishKey);
                    const liters = innerParsed.liters ? Number(innerParsed.liters) : (innerParsed.quantity ? Number(innerParsed.quantity) : (innerParsed.qty ? Number(innerParsed.qty) : 1));
                    const basePrice = Number(innerParsed.price || innerParsed.unitPrice || innerParsed.amount || innerParsed.cost || 0) || getMealUnitPrice(dishName);
                    const computedDishPrice = basePrice * (liters > 0 ? liters : 1);

                    const proteinList = parseProteinsWithQty(
                      innerParsed.proteinIds || innerParsed.proteins || innerParsed.protein || innerParsed.proteinAddons
                    );

                    let swallowName: string | undefined = undefined;
                    let swallowCost = 0; 
                    if (innerParsed.swallow) {
                      const swallowObj = safeParseJson(innerParsed.swallow);
                      swallowName = formatItemName(typeof innerParsed.swallow === 'string' ? innerParsed.swallow : swallowObj.name);
                    }

                    const dishObj: ProcessedDish = {
                      slot: dishKey,
                      category: categoryType,
                      name: dishName,
                      liters,
                      proteins: proteinList,
                      swallow: swallowName,
                      swallowPrice: swallowCost,
                      price: computedDishPrice,
                    };

                    groupedMeals[targetDate].push(dishObj);
                    allParsedDishes.push(dishObj);
                  } else if (parsedSub && typeof parsedSub === 'object') {
                    Object.entries(parsedSub).forEach(([dishKey, dishVal]) => {
                      if (['totalPrice', 'serviceMode', 'prepMode'].includes(dishKey)) return;
                      const innerParsed = safeParseJson(dishVal);
                      if (!innerParsed || typeof innerParsed !== 'object') return;

                      const rawDishKey = innerParsed.name || innerParsed.title || innerParsed.foodName || innerParsed.mealName || dishKey;
                      const dishName = formatItemName(rawDishKey);
                      const liters = innerParsed.liters ? Number(innerParsed.liters) : (innerParsed.quantity ? Number(innerParsed.quantity) : (innerParsed.qty ? Number(innerParsed.qty) : 1));
                      const basePrice = Number(innerParsed.price || innerParsed.unitPrice || innerParsed.amount || innerParsed.cost || 0) || getMealUnitPrice(dishName);
                      const computedDishPrice = basePrice * (liters > 0 ? liters : 1);

                      const proteinList = parseProteinsWithQty(
                        innerParsed.proteinIds || innerParsed.proteins || innerParsed.protein || innerParsed.proteinAddons
                      );

                      let swallowName: string | undefined = undefined;
                      let swallowCost = 0;
                      if (innerParsed.swallow) {
                        const swallowObj = safeParseJson(innerParsed.swallow);
                        swallowName = formatItemName(typeof innerParsed.swallow === 'string' ? innerParsed.swallow : swallowObj.name);
                      }

                      const dishObj: ProcessedDish = {
                        slot: dishKey,
                        category: subKey,
                        name: dishName,
                        liters,
                        proteins: proteinList,
                        swallow: swallowName,
                        swallowPrice: swallowCost,
                        price: computedDishPrice,
                      };

                      groupedMeals[targetDate].push(dishObj);
                      allParsedDishes.push(dishObj);
                    });
                  }
                });
              });
            };

            processSourceObj(mealsObj, 'Meals');
            processSourceObj(soupsObj, 'Soups');

            if (showAddons && rawAddons) {
              const structuredAddons = parseAddonsIntoStructuredItems(rawAddons, nights);
              if (structuredAddons.length > 0) {
                groupedMeals['CONCIERGE & SERVICE ADD-ONS'] = structuredAddons;
                structuredAddons.forEach(addon => allParsedDishes.push(addon));
              }
            }

            const normalizedMealEntries = Object.entries(groupedMeals).filter(([, dishes]) => dishes.length > 0);
            
            const calculatedKitchenCost = allParsedDishes.reduce((sum, d) => sum + (d.price || 0) + (d.swallowPrice || 0) + (d.proteins?.reduce((pSum, p) => pSum + (p.price || 0), 0) || 0), 0);
            const totalKitchenCost = dbStoredTotal > 0 ? dbStoredTotal : calculatedKitchenCost;
            const cardKey = booking.id || `kschedule-${bIdx}`;

            return (
              <div key={cardKey} className="p-6 rounded-xl bg-gray-950 border border-gray-800 space-y-6 shadow-md print:bg-white print:text-black print:border-gray-300">
                <div className="flex justify-between items-start border-b border-gray-800 pb-4 print:border-gray-300">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-white print:text-black">{guestName}</h3>
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-950 text-purple-300 border border-purple-800 print:bg-purple-100 print:text-purple-800">
                        👤 {totalGuests} {Number(totalGuests) === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </div>
                    <p className="text-sm text-cyan-400 font-medium mt-0.5 print:text-cyan-700">{booking.listingId}</p>
                    <p className="text-xs text-amber-400 font-mono mt-1 print:text-amber-700">📞 {guestPhone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 print:bg-emerald-100 print:text-emerald-800">
                      {booking.status || 'Confirmed'}
                    </span>
                    {totalKitchenCost > 0 && (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-950/90 text-amber-300 border border-amber-700 font-mono print:bg-amber-100 print:text-amber-900">
                        💰 Kitchen & Dining Total: ₦{totalKitchenCost.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-cyan-400 tracking-wider uppercase mb-3 print:text-cyan-800">
                    Daily Meal Selections & Soups Schedule
                  </h4>
                  <div className="space-y-3">
                    {normalizedMealEntries.map(([dayLabel, dishes], dayIdx) => (
                      <div key={`day-${dayIdx}`} className="p-4 rounded-lg bg-gray-900/70 border border-gray-800 space-y-2 print:bg-gray-50 print:border-gray-200">
                        <span className="text-xs font-bold text-amber-400 block mb-2 print:text-amber-800">📅 {dayLabel}:</span>
                        <div className="space-y-2">
                          {dishes.map((dish, dIdx) => {
                            const dishLineTotal = (dish.price || 0) + (dish.swallowPrice || 0) + (dish.proteins?.reduce((sum, p) => sum + (p.price || 0), 0) || 0);
                            return (
                              <div key={`dish-${dIdx}`} className="text-xs space-y-1 bg-black/40 p-3 rounded-lg border border-white/5 print:bg-white print:border-gray-200">
                                <div className="flex items-center justify-between text-gray-200 font-semibold print:text-gray-900">
                                  <span>{dish.name}</span>
                                  <div className="flex items-center gap-2">
                                    {dish.liters && dish.liters > 0 && (
                                      <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800 print:bg-cyan-50 print:text-cyan-800">
                                        {dish.liters} {dish.unit || (dish.liters === 1 ? 'Unit' : 'Units')}
                                      </span>
                                    )}
                                    {dish.price && dish.price > 0 && (
                                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 print:bg-emerald-50 print:text-emerald-800">
                                        ₦{dish.price.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {dish.swallow && (
                                  <div className="flex justify-between items-center pl-3 border-l-2 border-cyan-500/60 text-[11px] text-cyan-300 font-medium mt-1 print:text-cyan-800">
                                    <span>🥣 Swallow: {dish.swallow} (Free Accompaniment)</span>
                                    <span className="font-mono text-emerald-400 print:text-emerald-700">₦0</span>
                                  </div>
                                )}

                                {dish.subItems && dish.subItems.length > 0 && (
                                  <div className="pl-3 border-l-2 border-amber-500/60 text-[11px] text-amber-200 space-y-1 mt-2 print:text-amber-900">
                                    <span className="text-gray-400 font-medium print:text-gray-700">Service Specifications:</span>
                                    <div className="flex flex-col gap-1 mt-1">
                                      {dish.subItems.map((sub, sIdx) => (
                                        <span key={`sub-${sIdx}`} className="bg-amber-950/40 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded text-[11px] font-mono flex justify-between items-center print:bg-amber-50 print:text-amber-900">
                                          <span>+ {sub.name} <strong className="text-white print:text-black">({sub.qty}x)</strong> {sub.note ? `- ${sub.note}` : ''}</span>
                                          {sub.price && sub.price > 0 ? <strong className="text-emerald-400 print:text-emerald-700">₦{sub.price.toLocaleString()}</strong> : ''}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {dish.proteins && dish.proteins.length > 0 && (
                                  <div className="pl-3 border-l-2 border-amber-500/60 text-[11px] text-amber-200 space-y-1 mt-2 print:text-amber-900">
                                    <span className="text-gray-400 font-medium print:text-gray-700">Selected Protein Add-ons:</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {dish.proteins.map((p, pIdx) => (
                                        <span key={`protein-${pIdx}`} className="bg-amber-950/40 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] font-mono print:bg-amber-50 print:text-amber-900">
                                          + {p.name} <strong className="text-white print:text-black">({p.qty} pcs)</strong>
                                          {p.price && p.price > 0 ? ` - ₦${p.price.toLocaleString()}` : ''}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-2 mt-2 border-t border-gray-800/80 flex justify-between items-center text-[11px] font-mono print:border-gray-200">
                                  <span className="text-gray-400 print:text-gray-600">Item Subtotal:</span>
                                  <span className="text-amber-300 font-bold print:text-amber-900">₦{dishLineTotal.toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}