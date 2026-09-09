'use client';

import React, { useMemo } from 'react';

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
  guestInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    guestCount?: number;
  };
  dailyMealSelections?: any;
  addons?: any;
  user?: {
    email?: string;
    name?: string;
  } | null;
  [key: string]: any;
}

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

const formatItemName = (id: string): string => {
  if (!id) return '';
  return String(id)
    .replace(/^(sp_|rc_|pr_|p_|s_|sw_)/gi, '')
    .replace(/_/g, ' ')
    .trim()
    .toUpperCase();
};

// Dynamic Meal Unit Price Lookup Helper
const getMealUnitPrice = (mealName: string): number => {
  const name = mealName.toLowerCase();
  if (name.includes('jollof')) return 50000;
  if (name.includes('fried rice')) return 50000;
  if (name.includes('coconut rice')) return 50000;
  if (name.includes('native rice')) return 45000;
  if (name.includes('ofada')) return 55000;
  if (name.includes('efo') || name.includes('egusi') || name.includes('ogbono') || name.includes('soup')) return 45000;
  if (name.includes('pasta') || name.includes('spaghetti')) return 40000;
  return 45000; // default base price per liter
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
  if (!rawProteins) return [];
  const proteinMap: Record<string, { qty: number; price: number }> = {};

  if (Array.isArray(rawProteins)) {
    rawProteins.forEach((p) => {
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
  } else if (typeof rawProteins === 'object') {
    Object.entries(rawProteins).forEach(([key, val]) => {
      const name = formatItemName(key);
      const unitPrice = getProteinUnitPrice(name);
      const qty = typeof val === 'number' ? 1 : Number((val as any)?.qty || (val as any)?.quantity || (val as any)?.count || 1);
      const price = (typeof val === 'number' ? val : Number((val as any)?.price || (val as any)?.amount || (val as any)?.cost || 0)) || (qty * unitPrice);
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

const deepFindKey = (obj: any, targetKeys: string[]): any => {
  if (!obj || typeof obj !== 'object') return null;
  const stack = [obj];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;

    for (const key of Object.keys(current)) {
      const lower = key.toLowerCase();
      if (targetKeys.includes(lower)) {
        const val = current[key];
        if (val !== null && val !== undefined && val !== '' && val !== false) {
          return val;
        }
      }
      if (typeof current[key] === 'object' && current[key] !== null) {
        stack.push(current[key]);
      }
    }
  }
  return null;
};

const extractDiningPreference = (booking: BookingItem): string | null => {
  const parsedAddons = safeParseJson(booking.addons);
  const parsedMeals = safeParseJson(booking.dailyMealSelections);
  const parsedBooking = safeParseJson(booking);

  if (parsedMeals?.prepModes && typeof parsedMeals.prepModes === 'object') {
    const modes = Object.values(parsedMeals.prepModes).map((m) => String(m).toLowerCase());
    if (modes.some((m) => m.includes('in_house') || m.includes('inhouse') || m.includes('chef'))) {
      return 'In-House Chef';
    }
    if (modes.some((m) => m.includes('delivery') || m.includes('dropoff'))) {
      return 'Delivery';
    }
  }

  const searchTargets = [
    'prepmodes', 'prepmode', 'prep_modes', 'prep_mode', 'diningpreference',
    'dining_preference', 'diningoption', 'dining_option', 'chefoption', 'chef_option',
    'deliveryoption', 'delivery_option', 'dining', 'chefservice', 'fulfillment',
    'servicetype', 'deliverytype', 'cheftype', 'mode',
  ];

  let rawPref =
    deepFindKey(parsedMeals, searchTargets) ||
    deepFindKey(parsedAddons, searchTargets) ||
    deepFindKey(parsedBooking, searchTargets);

  if (!rawPref) {
    const combinedJsonStr = JSON.stringify({ booking }).toLowerCase();
    if (
      combinedJsonStr.includes('"in_house"') ||
      combinedJsonStr.includes('in-house chef') ||
      combinedJsonStr.includes('inhouse chef')
    ) {
      return 'In-House Chef';
    }
    if (combinedJsonStr.includes('food delivery') || combinedJsonStr.includes('delivery')) {
      return 'Delivery';
    }
    return null;
  }

  if (typeof rawPref === 'object') {
    rawPref =
      rawPref.type ||
      rawPref.value ||
      rawPref.option ||
      rawPref.name ||
      rawPref.label ||
      JSON.stringify(rawPref);
  }

  const str = String(rawPref).toLowerCase().trim();
  if (!str || str === 'none' || str === 'false') return null;

  if (str.includes('chef') || str.includes('inhouse') || str.includes('in_house') || str.includes('cook')) {
    return 'In-House Chef';
  }
  if (str.includes('delivery') || str.includes('dispatch') || str.includes('dropoff') || str.includes('drop_off')) {
    return 'Delivery';
  }

  return formatItemName(str);
};

const isTruthyService = (val: any): boolean => {
  if (val === null || val === undefined || val === false) return false;
  const str = String(val).trim().toLowerCase();
  return !['false', 'none', 'no', '0', 'no_pickup', 'none_selected', 'null', 'undefined', ''].includes(str);
};

const extractKitchenTotalCost = (booking: BookingItem, dishesList: ProcessedDish[]): number => {
  const explicitTotal =
    booking.kitchenTotal ||
    booking.mealTotal ||
    booking.mealsPrice ||
    booking.foodTotal ||
    booking.dailyMealSelections?.totalPrice ||
    booking.dailyMealSelections?.totalCost ||
    booking.addons?.mealTotal ||
    booking.addons?.kitchenTotal;

  if (explicitTotal && !isNaN(Number(explicitTotal)) && Number(explicitTotal) > 0) {
    return Number(explicitTotal);
  }

  let calculatedSum = 0;
  dishesList.forEach((dish) => {
    if (dish.price) calculatedSum += Number(dish.price);
    if (dish.swallowPrice) calculatedSum += Number(dish.swallowPrice);
    dish.proteins?.forEach((p) => {
      if (p.price) calculatedSum += Number(p.price);
    });
  });

  return calculatedSum;
};

export default function KitchenSchedule({ bookings, showAddons = true }: KitchenScheduleProps) {
  const activeKitchenBookings = useMemo(() => {
    return (bookings || []).filter((booking) => {
      const rawAddons = safeParseJson(booking.addons);
      const addonData = rawAddons?.addons || rawAddons;
      const mealData = safeParseJson(booking.dailyMealSelections || addonData?.dailyMealSelections);
      
      const hasMeals = mealData && typeof mealData === 'object' && Object.keys(mealData).length > 0;
      const kitchenCost = Number(booking.kitchenTotal || booking.mealTotal || booking.foodTotal || 0);
      
      return hasMeals || kitchenCost > 0;
    });
  }, [bookings]);

  if (!activeKitchenBookings || activeKitchenBookings.length === 0) {
    return <div className="text-gray-400 p-4 text-xs italic">No active kitchen schedule logs available.</div>;
  }

  return (
    <div className="space-y-8">
      {activeKitchenBookings.map((booking, bIdx) => {
        const rawAddons = safeParseJson(booking.addons);
        const addonData = rawAddons?.addons || rawAddons;
        const mealData = safeParseJson(booking.dailyMealSelections || addonData?.dailyMealSelections);

        const guestName =
          booking.customerName ||
          booking.guestInfo?.fullName ||
          booking.user?.name ||
          'Guest / N/A';

        const guestPhone =
          booking.phone ||
          booking.phoneNumber ||
          booking.customerPhone ||
          booking.guestInfo?.phone ||
          'N/A';

        const totalGuests = booking.guestCount || booking.guestInfo?.guestCount || 1;
        const diningPref = extractDiningPreference(booking);

        const groupedMeals: Record<string, ProcessedDish[]> = {};
        const allParsedDishes: ProcessedDish[] = [];

        const workStack: Array<{ node: any; currentCategory: string; dateContext: string }> = [
          { node: mealData, currentCategory: '', dateContext: '' }
        ];

        while (workStack.length > 0) {
          const { node, currentCategory, dateContext } = workStack.pop()!;
          if (!node) continue;

          const parsed = safeParseJson(node);

          if (typeof parsed === 'string') {
            const targetDate = dateContext || 'General Schedule';
            if (!groupedMeals[targetDate]) groupedMeals[targetDate] = [];
            const dishName = formatItemName(parsed);
            const liters = 1;
            const unitPrice = getMealUnitPrice(dishName);
            const dishObj: ProcessedDish = {
              slot: formatItemName(currentCategory || 'Main Meal'),
              category: 'Food',
              name: dishName,
              liters,
              price: unitPrice * liters,
            };
            groupedMeals[targetDate].push(dishObj);
            allParsedDishes.push(dishObj);
            continue;
          }

          if (Array.isArray(parsed)) {
            parsed.forEach((item) => workStack.push({ node: item, currentCategory, dateContext }));
            continue;
          }

          if (typeof parsed === 'object' && parsed !== null) {
            Object.entries(parsed).forEach(([key, val]) => {
              if (key === 'prepModes' || key === 'prep_modes' || key === 'totalPrice' || key === 'grandTotal') return;

              const isDatePattern = /^\d{4}-\d{2}-\d{2}/.test(key) || key.toLowerCase().includes('day');
              const nextDate = isDatePattern ? key : dateContext;
              const nextCategory = !isDatePattern ? key : currentCategory;

              const innerParsed = safeParseJson(val);

              const isDishNode =
                typeof innerParsed === 'object' &&
                innerParsed !== null &&
                !Array.isArray(innerParsed) &&
                (innerParsed.name ||
                  innerParsed.title ||
                  innerParsed.price !== undefined ||
                  innerParsed.amount !== undefined ||
                  innerParsed.cost !== undefined ||
                  innerParsed.proteinIds ||
                  innerParsed.proteins ||
                  innerParsed.protein ||
                  innerParsed.liters ||
                  innerParsed.swallow);

              if (isDishNode) {
                const targetDate = nextDate || 'General Schedule';
                if (!groupedMeals[targetDate]) groupedMeals[targetDate] = [];

                const proteinList = parseProteinsWithQty(
                  innerParsed.proteinIds || innerParsed.proteins || innerParsed.protein
                );

                let swallowName: string | undefined = undefined;
                let swallowCost: number | undefined = undefined;

                if (innerParsed.swallow) {
                  if (typeof innerParsed.swallow === 'string') {
                    swallowName = formatItemName(innerParsed.swallow);
                  } else if (typeof innerParsed.swallow === 'object') {
                    swallowName = formatItemName(innerParsed.swallow.name || innerParsed.swallow.title || innerParsed.swallow.id || 'Swallow');
                    swallowCost = Number(innerParsed.swallow.price || innerParsed.swallow.amount || innerParsed.swallow.cost || 0);
                  }
                }

                const dishName = formatItemName(innerParsed.name || innerParsed.title || key);
                const liters = innerParsed.liters ? Number(innerParsed.liters) : 1;
                const basePrice = Number(innerParsed.price || innerParsed.amount || innerParsed.cost || 0) || getMealUnitPrice(dishName);
                const computedDishPrice = basePrice * liters;

                const dishObj: ProcessedDish = {
                  slot: formatItemName(nextCategory || key || 'Dish'),
                  category: 'Food',
                  name: dishName,
                  liters,
                  proteins: proteinList,
                  swallow: swallowName,
                  swallowPrice: swallowCost,
                  price: computedDishPrice,
                };

                groupedMeals[targetDate].push(dishObj);
                allParsedDishes.push(dishObj);
              } else {
                workStack.push({ node: val, currentCategory: nextCategory, dateContext: nextDate });
              }
            });
          }
        }

        const normalizedMealEntries = Object.entries(groupedMeals).filter(
          ([, dishes]) => dishes.length > 0
        );

        const totalKitchenCost = extractKitchenTotalCost(booking, allParsedDishes);

        const isSecurityActive = isTruthyService(addonData?.security || addonData?.securityType);
        const isAirportActive = isTruthyService(addonData?.airport || addonData?.airportTransfer);
        const isHousekeepingActive = isTruthyService(addonData?.housekeeping);
        const isChauffeurActive = isTruthyService(addonData?.chauffeur);

        const validAddons =
          addonData && typeof addonData === 'object'
            ? Object.entries(addonData).filter(([key, val]: [string, any]) => {
                const lowerKey = key.toLowerCase();
                const ignoredKeys = [
                  'guestcount', 'totalguests', 'numberofguests', 'guestname',
                  'dailymealselections', 'mealselections', 'dailymeals', 'prepmodes', 'addons',
                ];
                if (ignoredKeys.includes(lowerKey)) return false;
                if (!isTruthyService(val)) return false;
                return true;
              })
            : [];

        const cardKey = booking.id || `kschedule-${bIdx}`;

        return (
          <div key={cardKey} className="p-6 rounded-xl bg-gray-950 border border-gray-800 space-y-6 shadow-md">
            <div className="flex justify-between items-start border-b border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold text-white">{guestName}</h3>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                    👤 {totalGuests} {Number(totalGuests) === 1 ? 'Guest' : 'Guests'}
                  </span>
                  {diningPref ? (
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${diningPref === 'In-House Chef' ? 'bg-amber-950/80 text-amber-300 border-amber-700' : 'bg-cyan-950/80 text-cyan-300 border-cyan-700'}`}>
                      {diningPref === 'In-House Chef' ? '👨‍🍳 In-House Chef' : '🚚 Delivery'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-900 text-gray-400 border border-gray-800">
                      🍽️ Option Unspecified
                    </span>
                  )}
                </div>
                <p className="text-sm text-cyan-400 font-medium mt-0.5">{booking.listingId}</p>
                <p className="text-xs text-amber-400 font-mono mt-1">📞 {guestPhone}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {booking.status}
                </span>
                {totalKitchenCost > 0 && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-950/90 text-amber-300 border border-amber-700 font-mono">
                    💰 Food Order Total: ₦{totalKitchenCost.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-cyan-400 tracking-wider uppercase mb-3">
                Daily Meal Selections, Swallows & Protein Add-ons
              </h4>
              {normalizedMealEntries.length === 0 ? (
                <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                  <p className="text-xs text-amber-400 font-medium">No meal selections saved for this booking.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {normalizedMealEntries.map(([dayLabel, dishes], dayIdx) => (
                    <div key={`day-${dayIdx}`} className="p-4 rounded-lg bg-gray-900/70 border border-gray-800 space-y-2">
                      <span className="text-xs font-bold text-amber-400 block mb-2">📅 {dayLabel}:</span>
                      <div className="space-y-2">
                        {dishes.map((dish, dIdx) => {
                          const dishLineTotal = (dish.price || 0) + (dish.swallowPrice || 0) + (dish.proteins?.reduce((sum, p) => sum + (p.price || 0), 0) || 0);
                          return (
                            <div key={`dish-${dIdx}`} className="text-xs space-y-1 bg-black/40 p-3 rounded-lg border border-white/5">
                              <div className="flex items-center justify-between text-gray-200 font-semibold">
                                <span>
                                  {dish.slot && dish.slot.toUpperCase() !== dish.name.toUpperCase() && (
                                    <span className="text-cyan-400">{dish.slot}: </span>
                                  )}
                                  {dish.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  {dish.liters && (
                                    <span className="text-xs font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                                      {dish.liters} {dish.liters === 1 ? 'Liter' : 'Liters'}
                                    </span>
                                  )}
                                  {dish.price && dish.price > 0 && (
                                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                                      ₦{dish.price.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {dish.swallow && (
                                <div className="flex justify-between items-center pl-3 border-l-2 border-cyan-500/60 text-[11px] text-cyan-300 font-medium mt-1">
                                  <span>🥣 Swallow: {dish.swallow}</span>
                                  {dish.swallowPrice && dish.swallowPrice > 0 && (
                                    <span className="font-mono text-emerald-400">₦{dish.swallowPrice.toLocaleString()}</span>
                                  )}
                                </div>
                              )}

                              {dish.proteins && dish.proteins.length > 0 && (
                                <div className="pl-3 border-l-2 border-amber-500/60 text-[11px] text-amber-200 space-y-1 mt-2">
                                  <span className="text-gray-400 font-medium">Selected Protein Add-ons:</span>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {dish.proteins.map((p, pIdx) => (
                                      <span key={`protein-${pIdx}`} className="bg-amber-950/40 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] font-mono">
                                        + {p.name} <strong className="text-white">({p.qty} pcs)</strong>
                                        {p.price && p.price > 0 ? ` - ₦${p.price.toLocaleString()}` : ''}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {dishLineTotal > 0 && (
                                <div className="pt-2 mt-2 border-t border-gray-800/80 flex justify-between items-center text-[11px] font-mono">
                                  <span className="text-gray-400">Dish Subtotal:</span>
                                  <span className="text-amber-300 font-bold">₦{dishLineTotal.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}