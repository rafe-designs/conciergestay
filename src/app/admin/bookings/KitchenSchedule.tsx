'use client';

import React from 'react';

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
}

interface ProcessedDish {
  slot: string;
  category: string;
  name: string;
  liters?: number;
  proteins?: ProteinItem[];
  swallow?: string;
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
    .replace(/^p_/, '')
    .replace(/^s_/, '')
    .replace(/^pr_/, '')
    .replace(/^rc_/, '')
    .replace(/_/g, ' ')
    .toUpperCase();
};

const parseProteinsWithQty = (rawProteins: any): ProteinItem[] => {
  if (!rawProteins) return [];
  const proteinMap: Record<string, number> = {};

  if (Array.isArray(rawProteins)) {
    rawProteins.forEach((p) => {
      if (typeof p === 'string') {
        const key = formatItemName(p);
        proteinMap[key] = (proteinMap[key] || 0) + 1;
      } else if (typeof p === 'object' && p !== null) {
        const name = formatItemName(p.name || p.id || p.title || 'Protein');
        const qty = Number(p.qty || p.quantity || p.count || 1);
        proteinMap[name] = (proteinMap[name] || 0) + qty;
      }
    });
  } else if (typeof rawProteins === 'object') {
    Object.entries(rawProteins).forEach(([key, val]) => {
      const name = formatItemName(key);
      const qty = typeof val === 'number' ? val : Number((val as any)?.qty || (val as any)?.count || 1);
      proteinMap[name] = (proteinMap[name] || 0) + qty;
    });
  }

  return Object.entries(proteinMap).map(([name, qty]) => ({ name, qty }));
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
    'prepmodes',
    'prepmode',
    'prep_modes',
    'prep_mode',
    'diningpreference',
    'dining_preference',
    'diningoption',
    'dining_option',
    'chefoption',
    'chef_option',
    'deliveryoption',
    'delivery_option',
    'dining',
    'chefservice',
    'fulfillment',
    'servicetype',
    'deliverytype',
    'cheftype',
    'mode',
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

export default function KitchenSchedule({ bookings, showAddons = true }: KitchenScheduleProps) {
  if (!bookings || bookings.length === 0) {
    return <div className="text-gray-400 p-4">No active schedule logs available.</div>;
  }

  return (
    <div className="space-y-8">
      {bookings.map((booking, bIdx) => {
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

        // Non-recursive, stack-based parser to safe-guard against circular dependencies
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
            groupedMeals[targetDate].push({
              slot: formatItemName(currentCategory || 'Main Meal'),
              category: 'Food',
              name: formatItemName(parsed),
            });
            continue;
          }

          if (Array.isArray(parsed)) {
            parsed.forEach((item) => workStack.push({ node: item, currentCategory, dateContext }));
            continue;
          }

          if (typeof parsed === 'object' && parsed !== null) {
            Object.entries(parsed).forEach(([key, val]) => {
              if (key === 'prepModes' || key === 'prep_modes') return;

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

                groupedMeals[targetDate].push({
                  slot: formatItemName(nextCategory || key || 'Dish'),
                  category: 'Food',
                  name: formatItemName(innerParsed.name || innerParsed.title || key),
                  liters: innerParsed.liters ? Number(innerParsed.liters) : undefined,
                  proteins: proteinList,
                  swallow: innerParsed.swallow ? formatItemName(innerParsed.swallow) : undefined,
                });
              } else {
                workStack.push({ node: val, currentCategory: nextCategory, dateContext: nextDate });
              }
            });
          }
        }

        const normalizedMealEntries = Object.entries(groupedMeals).filter(
          ([, dishes]) => dishes.length > 0
        );

        const validAddons =
          addonData && typeof addonData === 'object'
            ? Object.entries(addonData).filter(([key, val]: [string, any]) => {
                const lowerKey = key.toLowerCase();

                if (
                  [
                    'guestcount',
                    'totalguests',
                    'numberofguests',
                    'guestname',
                    'dailymealselections',
                    'mealselections',
                    'dailymeals',
                    'prepmodes',
                    'prep_modes',
                  ].includes(lowerKey)
                ) {
                  return false;
                }

                if (
                  val === null ||
                  val === undefined ||
                  val === false ||
                  val === 'false' ||
                  val === 'none' ||
                  val === 'NONE' ||
                  val === 'no' ||
                  val === 'NO' ||
                  val === '0' ||
                  val === 0 ||
                  val === 'no_pickup' ||
                  val === 'none_selected'
                ) {
                  return false;
                }

                return true;
              })
            : [];

        const cardKey = booking.id || `kschedule-${bIdx}`;

        return (
          <div
            key={cardKey}
            className="p-6 rounded-xl bg-gray-950 border border-gray-800 space-y-6 shadow-md"
          >
            <div className="flex justify-between items-start border-b border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold text-white">{guestName}</h3>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                    👤 {totalGuests} {Number(totalGuests) === 1 ? 'Guest' : 'Guests'}
                  </span>

                  {diningPref ? (
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                        diningPref === 'In-House Chef'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                          : 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                      }`}
                    >
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
                <p className="text-xs text-gray-400 mt-1">
                  Check-in: {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'} | Check-out:{' '}
                  {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {booking.status}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-cyan-400 tracking-wider uppercase mb-3">
                Daily Meal Selections, Swallows & Protein Add-ons
              </h4>

              {normalizedMealEntries.length === 0 ? (
                <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                  <p className="text-xs text-amber-400 font-medium">
                    No meal selections saved for this booking.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {normalizedMealEntries.map(([dayLabel, dishes], idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-gray-900/70 border border-gray-800 space-y-2">
                      <span className="text-xs font-bold text-amber-400 block mb-2">
                        📅 {dayLabel}:
                      </span>
                      <div className="space-y-2">
                        {dishes.map((dish, dIdx) => (
                          <div key={dIdx} className="text-xs space-y-1 bg-black/40 p-3 rounded-lg border border-white/5">
                            <div className="flex items-center justify-between text-gray-200 font-semibold">
                              <span>
                                <span className="text-cyan-400">{dish.slot}: </span>
                                {dish.name}
                              </span>
                              {dish.liters && (
                                <span className="text-xs font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                                  {dish.liters} Liters
                                </span>
                              )}
                            </div>

                            {dish.swallow && (
                              <div className="pl-3 border-l-2 border-cyan-500/60 text-[11px] text-cyan-300 font-medium mt-1">
                                🥣 Swallow: {dish.swallow}
                              </div>
                            )}

                            {dish.proteins && dish.proteins.length > 0 && (
                              <div className="pl-3 border-l-2 border-amber-500/60 text-[11px] text-amber-200 space-y-1 mt-2">
                                <span className="text-gray-400 font-medium">Selected Protein Add-ons:</span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {dish.proteins.map((p, pIdx) => (
                                    <span key={pIdx} className="bg-amber-950/40 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] font-mono">
                                      + {p.name} <strong className="text-white">({p.qty} pcs)</strong>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showAddons && (
              <div>
                <h4 className="text-xs font-bold text-cyan-400 tracking-wider uppercase mb-3">
                  Selected Add-ons & Services
                </h4>

                {validAddons.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No additional services selected.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {validAddons.map(([key, val]: [string, any], i) => {
                      const displayVal =
                        typeof val === 'object' && val !== null
                          ? val.price
                            ? `₦${Number(val.price).toLocaleString()}`
                            : 'Selected'
                          : String(val);

                      return (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-gray-900/50 border border-gray-800 text-xs text-gray-200 flex justify-between items-center"
                        >
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-cyan-400 font-mono capitalize">{displayVal}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}