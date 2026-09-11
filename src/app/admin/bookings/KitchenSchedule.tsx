'use client';

import React, { useMemo } from 'react';

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
  meals?: any;
  soups?: any;
  addons?: any;
  kitchenTotal?: number;
  mealTotal?: number;
  mealsPrice?: number;
  foodTotal?: number;
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
      const dailySelections = safeParseJson(booking.dailyMealSelections);
      const hasMeals = dailySelections.meals || dailySelections.soups || booking.meals || rawAddons?.meals || booking.soups || rawAddons?.soups || rawAddons?.kitchen;
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
        const dailySelections = safeParseJson(booking.dailyMealSelections);
        
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

              const isDish = parsedSub && typeof parsedSub === 'object' && (parsedSub.foodName || parsedSub.mealName || parsedSub.name || parsedSub.title || parsedSub.item || parsedSub.price !== undefined || parsedSub.unitPrice !== undefined || parsedSub.proteins || parsedSub.proteinAddons);

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
                let swallowCost: number | undefined = undefined;
                if (innerParsed.swallow) {
                  const swallowObj = safeParseJson(innerParsed.swallow);
                  swallowName = formatItemName(typeof innerParsed.swallow === 'string' ? innerParsed.swallow : swallowObj.name);
                  swallowCost = Number(swallowObj.price || 3000);
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
                  let swallowCost: number | undefined = undefined;
                  if (innerParsed.swallow) {
                    const swallowObj = safeParseJson(innerParsed.swallow);
                    swallowName = formatItemName(typeof innerParsed.swallow === 'string' ? innerParsed.swallow : swallowObj.name);
                    swallowCost = Number(swallowObj.price || 3000);
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

        const explicitTotal = Number(booking.kitchenTotal || booking.mealTotal || booking.foodTotal || 0);
        if (allParsedDishes.length === 0 && explicitTotal > 0) {
          const fallbackDish: ProcessedDish = {
            slot: 'Package',
            category: 'Package',
            name: 'Kitchen Service Package / Order',
            liters: 1,
            price: explicitTotal,
          };
          groupedMeals['KITCHEN ORDER DETAILS'] = [fallbackDish];
          allParsedDishes.push(fallbackDish);
        }

        const normalizedMealEntries = Object.entries(groupedMeals).filter(([, dishes]) => dishes.length > 0);
        const totalKitchenCost = extractKitchenTotalCost(booking, allParsedDishes);
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
                </div>
                <p className="text-sm text-cyan-400 font-medium mt-0.5">{booking.listingId}</p>
                <p className="text-xs text-amber-400 font-mono mt-1">📞 {guestPhone}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {booking.status || 'Confirmed'}
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
                Daily Meal Selections, Soups & Protein Add-ons
              </h4>
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
                              <span>{dish.name}</span>
                              <div className="flex items-center gap-2">
                                {dish.liters && dish.liters > 1 && (
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

                            {showAddons && dish.proteins && dish.proteins.length > 0 && (
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

                            <div className="pt-2 mt-2 border-t border-gray-800/80 flex justify-between items-center text-[11px] font-mono">
                              <span className="text-gray-400">Dish Subtotal:</span>
                              <span className="text-amber-300 font-bold">₦{dishLineTotal.toLocaleString()}</span>
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
  );
}