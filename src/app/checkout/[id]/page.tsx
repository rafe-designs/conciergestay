'use client';

import React, { useState, useMemo, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LISTINGS,
  CULINARY_MEALS,
  SOUP_OPTIONS,
  SPICED_COMFORT_OPTIONS,
  PROTEIN_OPTIONS,
  SWALLOW_OPTIONS,
  MealItem,
} from '@/lib/cateringData';

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const listing = LISTINGS[resolvedParams.id] || LISTINGS['ikoyi-royal-villa'];

  // 1. Stay & Guest Info
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(1);

  // Active selected day tab for daily meal picker
  const [selectedDayTab, setSelectedDayTab] = useState<string>('');

  // 2. Per-Day Catering & Food State
  const [dailyPrepModes, setDailyPrepModes] = useState<Record<string, 'delivery' | 'in_house'>>({});

  // Menu Category Navigation
  const [activeTab, setActiveTab] = useState<'rice' | 'breakfast' | 'dinner' | 'soups' | 'spiced_comforts'>('rice');

  // Meal state keyed by Date -> MealId -> { liters, proteins: { id: string, qty: number }[] }
  const [dailyMeals, setDailyMeals] = useState<
    Record<string, Record<string, { liters: number; proteins: { id: string; qty: number }[] }>>
  >({});

  // Soup state keyed by Date -> SoupId -> { liters, swallow, proteins: { id: string, qty: number }[] }
  const [dailySoups, setDailySoups] = useState<
    Record<string, Record<string, { liters: number; swallow: string; proteins: { id: string; qty: number }[] }>>
  >({});

  // 3. Concierge Add-On States
  const [airportTransferType, setAirportTransferType] = useState('none');
  const [airportTripDirection, setAirportTripDirection] = useState<'one_way_pickup' | 'one_way_dropoff' | 'round_trip'>('one_way_pickup');
  
  const [chauffeurService, setChauffeurService] = useState('none');
  const [securityService, setSecurityService] = useState('none');
  const [securityCount, setSecurityCount] = useState(1);
  const [shoppersCount, setShoppersCount] = useState(0);

  // Laundry, Housekeeping & Bedding Dropdown States
  const [laundryAdult, setLaundryAdult] = useState('0');
  const [laundryKid, setLaundryKid] = useState('0');
  const [laundrySuit, setLaundrySuit] = useState('0');
  const [housekeepingActive, setHousekeepingActive] = useState('no');
  const [housekeepingSchedule, setHousekeepingSchedule] = useState('daily');
  const [beddingBeddings, setBeddingBeddings] = useState('no');
  const [beddingTowels, setBeddingTowels] = useState('no');

  // Generate Array of Stay Dates
  const stayDates = useMemo(() => {
    if (!checkInDate || !checkOutDate) return [];
    const dates: string[] = [];
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return [];
    }

    const current = new Date(start);
    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [checkInDate, checkOutDate]);

  const nights = stayDates.length;

  // Ensure active day tab points to a valid stay date
  const activeDay = useMemo(() => {
    if (stayDates.includes(selectedDayTab)) return selectedDayTab;
    return stayDates[0] || '';
  }, [stayDates, selectedDayTab]);

  // Load Paystack Inline Script Dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Combined options list for calculating total soup/spiced food prices
  const ALL_SOUP_AND_COMFORT_OPTIONS = useMemo(() => {
    return [...(SOUP_OPTIONS || []), ...(SPICED_COMFORT_OPTIONS || [])];
  }, []);

  // Dynamic Total Calculation Engine
  const totals = useMemo(() => {
    const accommodation = listing.pricePerNight * nights;
    let diningTotal = 0;

    stayDates.forEach((date) => {
      const dayMeals = dailyMeals[date] || {};
      const dayPrepMode = dailyPrepModes[date] || 'delivery';
      const chefSurcharge = dayPrepMode === 'in_house' ? 20000 : 0;

      Object.entries(dayMeals).forEach(([mealId, data]) => {
        let basePricePerLiter = 0;
        Object.values(CULINARY_MEALS).forEach((category) => {
          const found = category.find((m) => m.id === mealId);
          if (found) basePricePerLiter = found.basePrice;
        });

        const effectivePricePerLiter = basePricePerLiter + chefSurcharge;

        let proteinCost = 0;
        (data.proteins || []).forEach((item) => {
          const p = PROTEIN_OPTIONS.find((opt) => opt.id === item.id);
          if (p) proteinCost += p.price * item.qty;
        });

        const cappedLiters = Math.min(data.liters, 10);
        diningTotal += (effectivePricePerLiter * cappedLiters) + proteinCost;
      });

      const daySoups = dailySoups[date] || {};
      Object.entries(daySoups).forEach(([soupId, data]) => {
        const soup = ALL_SOUP_AND_COMFORT_OPTIONS.find((s) => s.id === soupId);
        if (soup) {
          const effectivePricePerLiter = soup.pricePerLiter + chefSurcharge;
          let proteinCost = 0;
          (data.proteins || []).forEach((item) => {
            const p = PROTEIN_OPTIONS.find((opt) => opt.id === item.id);
            if (p) proteinCost += p.price * item.qty;
          });

          const cappedLiters = Math.min(data.liters, 10);
          diningTotal += (effectivePricePerLiter * cappedLiters) + proteinCost;
        }
      });
    });

    let conciergeTotal = 0;

    if (airportTransferType !== 'none') {
      let baseTransferFee = 0;
      if (airportTransferType === 'sedan') baseTransferFee = 45000;
      if (airportTransferType === 'suv') baseTransferFee = 85000;

      if (airportTripDirection === 'round_trip') {
        conciergeTotal += baseTransferFee * 2;
      } else {
        conciergeTotal += baseTransferFee;
      }
    }

    if (chauffeurService === 'sedan') conciergeTotal += 250000 * nights;
    if (chauffeurService === 'luxury_sedan') conciergeTotal += 350000 * nights;
    if (chauffeurService === 'commuter') conciergeTotal += 150000 * nights;

    const cappedSec = Math.min(securityCount, 5);
    if (securityService === 'tactical') conciergeTotal += 80000 * cappedSec * nights;
    if (securityService === 'bodyguard') conciergeTotal += 120000 * cappedSec * nights;
    if (securityService === 'bouncer') conciergeTotal += 200000 * cappedSec * nights;

    const cappedShoppers = Math.min(shoppersCount, 5);
    conciergeTotal += cappedShoppers * 15000 * nights;

    const adultCount = parseInt(laundryAdult) || 0;
    const kidCount = parseInt(laundryKid) || 0;
    const suitCount = parseInt(laundrySuit) || 0;
    conciergeTotal += adultCount * 1500 + kidCount * 1000 + suitCount * 5000;

    if (housekeepingActive === 'yes') {
      if (housekeepingSchedule === 'daily') {
        conciergeTotal += 25000 * nights;
      } else {
        const cleaningSessions = Math.max(1, Math.ceil(nights / 2));
        conciergeTotal += 25000 * cleaningSessions;
      }
    }

    if (beddingBeddings === 'yes') conciergeTotal += 10000 * nights;
    if (beddingTowels === 'yes') conciergeTotal += 3000 * nights;

    return {
      accommodation,
      diningTotal,
      conciergeTotal,
      totalDue: accommodation + diningTotal + conciergeTotal,
    };
  }, [
    listing,
    nights,
    stayDates,
    dailyPrepModes,
    dailyMeals,
    dailySoups,
    ALL_SOUP_AND_COMFORT_OPTIONS,
    airportTransferType,
    airportTripDirection,
    chauffeurService,
    securityService,
    securityCount,
    shoppersCount,
    laundryAdult,
    laundryKid,
    laundrySuit,
    housekeepingActive,
    housekeepingSchedule,
    beddingBeddings,
    beddingTowels,
  ]);

  // Per-Day Meal Handlers
  const updateMealLiters = (date: string, id: string, liters: number) => {
    const dayMeals = dailyMeals[date] || {};
    const currentData = dayMeals[id] || { liters: 0, proteins: [] };
    const cappedLiters = Math.min(10, Math.max(0, liters));

    const updatedDayMeals = { ...dayMeals };
    if (cappedLiters === 0) {
      delete updatedDayMeals[id];
    } else {
      updatedDayMeals[id] = { ...currentData, liters: cappedLiters };
    }

    setDailyMeals({
      ...dailyMeals,
      [date]: updatedDayMeals,
    });
  };

  const toggleMealProtein = (date: string, mealId: string, proteinId: string) => {
    const dayMeals = dailyMeals[date] || {};
    const currentData = dayMeals[mealId];
    if (!currentData) return;

    const existingIndex = currentData.proteins.findIndex((p) => p.id === proteinId);
    let updatedProteins = [...currentData.proteins];

    if (existingIndex > -1) {
      updatedProteins = updatedProteins.filter((p) => p.id !== proteinId);
    } else {
      updatedProteins.push({ id: proteinId, qty: 1 });
    }

    setDailyMeals({
      ...dailyMeals,
      [date]: {
        ...dayMeals,
        [mealId]: { ...currentData, proteins: updatedProteins },
      },
    });
  };

  const updateMealProteinQty = (date: string, mealId: string, proteinId: string, qty: number) => {
    const dayMeals = dailyMeals[date] || {};
    const currentData = dayMeals[mealId];
    if (!currentData) return;

    const updatedProteins = currentData.proteins.map((p) =>
      p.id === proteinId ? { ...p, qty: Math.max(1, qty) } : p
    );

    setDailyMeals({
      ...dailyMeals,
      [date]: {
        ...dayMeals,
        [mealId]: { ...currentData, proteins: updatedProteins },
      },
    });
  };

  // Soup & Spiced Comfort Protein Toggle & Quantity Handlers
  const toggleSoupProtein = (date: string, soupId: string, proteinId: string) => {
    const daySoups = dailySoups[date] || {};
    const currentData = daySoups[soupId];
    if (!currentData) return;

    const currentProteins = currentData.proteins || [];
    const existingIndex = currentProteins.findIndex((p) => p.id === proteinId);
    let updatedProteins = [...currentProteins];

    if (existingIndex > -1) {
      updatedProteins = updatedProteins.filter((p) => p.id !== proteinId);
    } else {
      updatedProteins.push({ id: proteinId, qty: 1 });
    }

    setDailySoups({
      ...dailySoups,
      [date]: {
        ...daySoups,
        [soupId]: { ...currentData, proteins: updatedProteins },
      },
    });
  };

  const updateSoupProteinQty = (date: string, soupId: string, proteinId: string, qty: number) => {
    const daySoups = dailySoups[date] || {};
    const currentData = daySoups[soupId];
    if (!currentData) return;

    const updatedProteins = (currentData.proteins || []).map((p) =>
      p.id === proteinId ? { ...p, qty: Math.max(1, qty) } : p
    );

    setDailySoups({
      ...dailySoups,
      [date]: {
        ...daySoups,
        [soupId]: { ...currentData, proteins: updatedProteins },
      },
    });
  };

  const activePrepMode = dailyPrepModes[activeDay] || 'delivery';
  const chefSurcharge = activePrepMode === 'in_house' ? 20000 : 0;

  // Paystack Popup Handler
  const handlePaystackPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkInDate || !checkOutDate) {
      alert('Please select your check-in and check-out dates.');
      return;
    }

    if (!fullName || !email || !phone) {
      alert('Please fill in your Full Name, Email Address, and Phone Number before proceeding.');
      return;
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder';

    if (typeof window === 'undefined' || !(window as unknown as { PaystackPop?: any }).PaystackPop) {
      alert('Paystack SDK failed to load. Please check your internet connection.');
      return;
    }

    // Generate reference with the exact 'CS_' prefix matching your backend expectation
    const uniqueTxRef = 'CS_' + Math.floor(Math.random() * 1000000000 + 1);

    const handler = (window as unknown as { PaystackPop: any }).PaystackPop.setup({
      key: paystackKey,
      email: email,
      amount: totals.totalDue * 100,
      currency: 'NGN',
      ref: uniqueTxRef,
      metadata: {
        custom_fields: [
          { display_name: 'Full Name', variable_name: 'full_name', value: fullName },
          { display_name: 'Phone Number', variable_name: 'phone_number', value: phone },
          { display_name: 'Guests', variable_name: 'guests', value: guests },
          { display_name: 'Stay Duration', variable_name: 'stay_duration', value: `${nights} Nights (${checkInDate} to ${checkOutDate})` },
        ],
      },
      callback: async function (response: { reference: string }) {
        const finalRef = response.reference || uniqueTxRef;

        const payload = {
          transactionRef: finalRef,
          listingId: resolvedParams.id,
          apartmentTitle: listing.title,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalNights: nights,
          baseRentTotal: totals.accommodation,
          diningTotal: totals.diningTotal,
          conciergeTotal: totals.conciergeTotal,
          servicesTotal: totals.diningTotal + totals.conciergeTotal,
          grandTotal: totals.totalDue,
          apartmentCut: totals.accommodation,
          servicesCut: totals.diningTotal + totals.conciergeTotal,
          guestInfo: {
            fullName,
            email,
            phone,
            guests,
          },
          dailyMealSelections: {
            meals: dailyMeals,
            soups: dailySoups,
            prepModes: dailyPrepModes,
          },
          addons: {
            airportTransferType,
            airportTripDirection,
            chauffeurService,
            securityService,
            securityCount,
            shoppersCount,
            laundryAdult,
            laundryKid,
            laundrySuit,
            housekeepingActive,
            housekeepingSchedule,
            beddingBeddings,
            beddingTowels,
          },
        };

        localStorage.setItem('booking_confirmation_payload', JSON.stringify(payload));

        try {
          const res = await fetch('/api/bookings/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionRef: finalRef,
              bookingData: payload,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            console.error('Server error saving booking:', data);
            alert(`Payment successful, but saving booking failed: ${data.message || data.error}`);
            return;
          }

          router.push(`/booking-success?reference=${finalRef}&listing=${resolvedParams.id}`);
        } catch (err) {
          console.error('Network error during booking sync:', err);
          alert('Payment successful, but a network error occurred while recording your booking.');
        }
      },
      onClose: function () {
        alert('Transaction was closed.');
      },
    });

    handler.openIframe();
  };

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100 font-sans p-4 md:p-8">
      <Link
        href={`/listings/${resolvedParams.id}`}
        className="text-yellow-400 hover:text-cyan-300 text-sm flex items-center gap-2 mb-4 font-medium transition-colors"
      >
        ← Back to Resident Details
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-100">
          {listing.title}
        </h1>
        <p className="text-yellow-400 text-lg font-semibold mt-1">
          ₦{listing.pricePerNight.toLocaleString()}{' '}
          <span className="text-slate-400 text-sm font-normal">
            / Night {nights > 0 ? `(${nights} Night${nights > 1 ? 's' : ''})` : '(Select Dates)'}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. STAY DATES */}
          <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <h2 className="text-yellow-400 text-xs tracking-wider uppercase font-bold mb-4">
              📅 SELECT STAY DATES
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase font-semibold text-slate-400 block mb-2">
                  CHECK-IN DATE *
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-[#060b13] border border-slate-700/60 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs uppercase font-semibold text-slate-400 block mb-2">
                  CHECK-OUT DATE *
                </label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full bg-[#060b13] border border-slate-700/60 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* 2. DYNAMIC PER-DAY CULINARY FINE DINING MENU */}
          <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <h2 className="text-yellow-400 text-xs tracking-wider uppercase font-bold">
                🍽️ DAILY CULINARY SELECTION ({nights} DAY{nights > 1 ? 'S' : ''})
              </h2>

              <div className="flex gap-2 bg-[#060b13] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    setDailyPrepModes({ ...dailyPrepModes, [activeDay]: 'delivery' })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activePrepMode === 'delivery'
                      ? 'bg-yellow-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Meal Delivery
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDailyPrepModes({ ...dailyPrepModes, [activeDay]: 'in_house' })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activePrepMode === 'in_house'
                      ? 'bg-yellow-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  In-House Chef
                </button>
              </div>
            </div>

            {nights === 0 ? (
              <p className="text-xs text-amber-400 py-6 text-center">
                Please select your check-in and check-out dates above to configure daily meals.
              </p>
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-slate-800/80">
                  {stayDates.map((dateStr, idx) => {
                    const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                    const isSelected = activeDay === dateStr;
                    const hasOrders =
                      Object.keys(dailyMeals[dateStr] || {}).length > 0 ||
                      Object.keys(dailySoups[dateStr] || {}).length > 0;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDayTab(dateStr)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-yellow-500 text-yellow-950 shadow-md shadow-yellow-500/20'
                            : 'bg-[#060b13] text-yellow-300 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span>Day {idx + 1} ({formattedDate})</span>
                        {hasOrders && (
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-amber-400'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Updated Menu Navigation Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                  {[
                    { key: 'rice', label: '🍚 Rice Options' },
                    { key: 'breakfast', label: '🍳 Breakfast' },
                    { key: 'dinner', label: '🌙 Dinner' },
                    { key: 'soups', label: '🍲 Soups' },
                    { key: 'spiced_comforts', label: '🌶️ Spiced Comforts' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-3 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
                        activeTab === tab.key
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40'
                          : 'bg-[#060b13] text-slate-400 border border-slate-800/80'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                  {activeTab !== 'soups' && activeTab !== 'spiced_comforts' ? (
                    CULINARY_MEALS[activeTab]?.map((item: MealItem) => {
                      const currentData = dailyMeals[activeDay]?.[item.id] || { liters: 0, proteins: [] };
                      const isSelected = currentData.liters > 0;
                      const dynamicPrice = item.basePrice + chefSurcharge;

                      return (
                        <div
                          key={item.id}
                          className="bg-[#060b13] border border-slate-800/80 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-semibold text-slate-200">{item.name}</p>
                              <p className="text-xs text-amber-400 mt-1 font-semibold">
                                ₦{dynamicPrice.toLocaleString()} / Liter
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-slate-400 uppercase">Liters (Max 10)</label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={currentData.liters}
                                onChange={(e) => updateMealLiters(activeDay, item.id, parseInt(e.target.value) || 0)}
                                className="w-14 bg-[#0b121e] border border-slate-800 rounded-lg p-2 text-center text-xs text-amber-400 focus:outline-none font-semibold"
                              />
                            </div>
                          </div>

                          {isSelected && (
                            <div className="pt-3 border-t border-slate-800/60">
                              <span className="text-xs text-yellow-400 font-medium block mb-2">
                                Select Protein Add-ons & Quantity:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {PROTEIN_OPTIONS.map((p) => {
                                  const selectedProtein = (currentData.proteins || []).find((item) => item.id === p.id);
                                  const isChecked = !!selectedProtein;

                                  return (
                                    <div
                                      key={p.id}
                                      className="flex items-center justify-between bg-[#0b121e] p-2 rounded-lg border border-slate-800/60"
                                    >
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => toggleMealProtein(activeDay, item.id, p.id)}
                                          className="w-3 h-3 accent-cyan-400 rounded"
                                        />
                                        <span className="text-xs text-slate-300">
                                          {p.name}{' '}
                                          <span className="text-amber-400/80">(+₦{p.price.toLocaleString()})</span>
                                        </span>
                                      </label>

                                      {isChecked && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-slate-400 uppercase">Pcs:</span>
                                          <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={selectedProtein.qty}
                                            onChange={(e) =>
                                              updateMealProteinQty(
                                                activeDay,
                                                item.id,
                                                p.id,
                                                parseInt(e.target.value) || 1
                                              )
                                            }
                                            className="w-12 bg-[#060b13] border border-cyan-500/40 rounded p-1 text-center text-xs text-cyan-300 focus:outline-none"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    (activeTab === 'soups' ? SOUP_OPTIONS : SPICED_COMFORT_OPTIONS).map((soup) => {
                      const current = dailySoups[activeDay]?.[soup.id] || { liters: 0, swallow: 'Amala', proteins: [] };
                      const isSelected = current.liters > 0;
                      const dynamicPrice = soup.pricePerLiter + chefSurcharge;

                      return (
                        <div key={soup.id} className="bg-[#060b13] border border-slate-800/80 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-semibold text-slate-200">{soup.name}</p>
                              <p className="text-xs text-yellow-400 mt-1 font-semibold">
                                ₦{dynamicPrice.toLocaleString()} / Portion
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-slate-400 uppercase">Qty (Max 10)</label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={current.liters}
                                onChange={(e) => {
                                  const liters = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                                  const daySoups = dailySoups[activeDay] || {};
                                  const updatedDaySoups = { ...daySoups };

                                  if (liters === 0) {
                                    delete updatedDaySoups[soup.id];
                                  } else {
                                    updatedDaySoups[soup.id] = { ...current, liters, proteins: current.proteins || [] };
                                  }

                                  setDailySoups({
                                    ...dailySoups,
                                    [activeDay]: updatedDaySoups,
                                  });
                                }}
                                className="w-14 bg-[#0b121e] border border-slate-800 rounded-lg p-2 text-center text-xs text-amber-400 focus:outline-none font-semibold"
                              />
                            </div>
                          </div>

                          {isSelected && (
                            <div className="space-y-3 pt-2 border-t border-slate-800/60">
                              {activeTab === 'soups' && (
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-yellow-400 font-medium">Select Swallow Choice:</span>
                                  <select
                                    value={current.swallow}
                                    onChange={(e) => {
                                      const daySoups = dailySoups[activeDay] || {};
                                      setDailySoups({
                                        ...dailySoups,
                                        [activeDay]: {
                                          ...daySoups,
                                          [soup.id]: { ...current, swallow: e.target.value },
                                        },
                                      });
                                    }}
                                    className="bg-[#0b121e] border border-yellow-500/40 rounded-lg p-2 text-xs text-yellow-400 focus:outline-none"
                                  >
                                    {SWALLOW_OPTIONS.map((sw) => (
                                      <option key={sw} value={sw}>
                                        {sw}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div className="pt-2 border-t border-slate-800/40">
                                <span className="text-xs text-yellow-400 font-medium block mb-2">
                                  Select Protein Add-ons & Quantity:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {PROTEIN_OPTIONS.map((p) => {
                                    const selectedProtein = (current.proteins || []).find((item) => item.id === p.id);
                                    const isChecked = !!selectedProtein;

                                    return (
                                      <div
                                        key={p.id}
                                        className="flex items-center justify-between bg-[#0b121e] p-2 rounded-lg border border-slate-800/60"
                                      >
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleSoupProtein(activeDay, soup.id, p.id)}
                                            className="w-3 h-3 accent-yellow-400 rounded"
                                          />
                                          <span className="text-xs text-slate-300">
                                            {p.name}{' '}
                                            <span className="text-yellow-400/80">(+₦{p.price.toLocaleString()})</span>
                                          </span>
                                        </label>

                                        {isChecked && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-slate-400 uppercase">Pcs:</span>
                                            <input
                                              type="number"
                                              min="1"
                                              max="20"
                                              value={selectedProtein.qty}
                                              onChange={(e) =>
                                                updateSoupProteinQty(
                                                  activeDay,
                                                  soup.id,
                                                  p.id,
                                                  parseInt(e.target.value) || 1
                                                )
                                              }
                                              className="w-12 bg-[#060b13] border border-yellow-500/40 rounded p-1 text-center text-xs text-yellow-300 focus:outline-none"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* 3. AIRPORT TRANSFER & CHAUFFEUR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-yellow-400 text-sm font-bold">🚘 Airport Transfer Service</h3>
              <div>
                <label className="text-xs text-slate-400 block mb-1">SELECT VEHICLE</label>
                <select
                  value={airportTransferType}
                  onChange={(e) => setAirportTransferType(e.target.value)}
                  className="w-full bg-[#060b13] border border-slate-500/40 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="none">No Airport Transfer</option>
                  <option value="sedan">Executive Sedan (₦45,000)</option>
                  <option value="suv">Luxury SUV (₦85,000)</option>
                </select>
              </div>

              {airportTransferType !== 'none' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">TRIP TYPE & DIRECTION</label>
                  <select
                    value={airportTripDirection}
                    onChange={(e) => setAirportTripDirection(e.target.value as any)}
                    className="w-full bg-[#060b13] border border-slate-500/40 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="one_way_pickup">One-Way Trip: Pick-up (Airport to Lodge)</option>
                    <option value="one_way_dropoff">One-Way Trip: Drop-off (Lodge to Airport)</option>
                    <option value="round_trip">Round Trip (2x Fare)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-yellow-400 text-sm font-bold">🚘 Dedicated Chauffeur Service</h3>
                <span className="text-[11px] text-yellow-400 font-semibold">{nights} Night{nights > 1 ? 's' : ''}</span>
              </div>
              <select
                value={chauffeurService}
                onChange={(e) => setChauffeurService(e.target.value)}
                className="w-full bg-[#060b13] border border-slate-700/60 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="none">No Dedicated Chauffeur</option>
                <option value="sedan">Executive Sedan (₦250,000/day)</option>
                <option value="luxury_sedan">Luxury Sedan (₦350,000/day)</option>
                <option value="commuter">Executive Commuter Shuttle (₦150,000/day)</option>
              </select>
            </div>
          </div>

          {/* 4. SECURITY & PERSONAL SHOPPER ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-yellow-400 text-sm font-bold">🛡️ Dedicated Security Details</h3>
                <span className="text-[11px] text-amber-400 font-semibold">{nights} Night{nights > 1 ? 's' : ''}</span>
              </div>
              <select
                value={securityService}
                onChange={(e) => setSecurityService(e.target.value)}
                className="w-full bg-[#060b13] border border-slate-500/50 rounded-xl p-3.5 text-sm text-slate-200 mb-3 focus:outline-none"
              >
                <option value="none">No Additional Security</option>
                <option value="tactical">Tactical Unit (₦80,000/day)</option>
                <option value="bodyguard">Executive Bodyguards (₦120,000/day)</option>
                <option value="bouncer">Protection (Bouncers) (₦200,000/day)</option>
              </select>

              {securityService !== 'none' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">PERSONNEL COUNT (MAX 5)</label>
                  <select
                    value={securityCount}
                    onChange={(e) => setSecurityCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#060b13] border border-slate-700/60 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} Personnel{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-yellow-400 text-sm font-bold">🛍️ Personal Shoppers</h3>
                <span className="text-[11px] text-amber-400 font-semibold">{nights} Night{nights > 1 ? 's' : ''}</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">₦15,000 / Day per Shopper</p>
              <div>
                <label className="text-xs text-slate-400 block mb-1">NUMBER OF SHOPPERS (MAX 5)</label>
                <select
                  value={shoppersCount}
                  onChange={(e) => setShoppersCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#060b13] border border-slate-700/60 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none"
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? 'No Shopper' : `${n} Shopper${n > 1 ? 's' : ''}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 5. LAUNDRY & HOUSEKEEPING SERVICES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
              <h3 className="text-yellow-400 text-sm font-bold mb-3">🧺 Laundry Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-slate-300">Adult Outfits (₦1,500)</span>
                  <select
                    value={laundryAdult}
                    onChange={(e) => setLaundryAdult(e.target.value)}
                    className="w-28 bg-[#060b13] border border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {[0, 1, 2, 3, 4, 5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>{n} pcs</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-slate-300">Kids Wear (₦1,000)</span>
                  <select
                    value={laundryKid}
                    onChange={(e) => setLaundryKid(e.target.value)}
                    className="w-28 bg-[#060b13] border border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>{n} pcs</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-slate-300">Suits & Ceremonial (₦5,000)</span>
                  <select
                    value={laundrySuit}
                    onChange={(e) => setLaundrySuit(e.target.value)}
                    className="w-28 bg-[#060b13] border border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>{n} pcs</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-yellow-400 text-sm font-bold">🧹 Housekeeping</h3>
                <span className="text-xs text-amber-400 font-bold">₦25,000 / Session</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">HOUSEKEEPING SERVICE</label>
                  <select
                    value={housekeepingActive}
                    onChange={(e) => setHousekeepingActive(e.target.value)}
                    className="w-full bg-[#060b13] border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none mb-3"
                  >
                    <option value="no">No Housekeeping Service</option>
                    <option value="yes">Include Housekeeping Service</option>
                  </select>
                </div>

                {housekeepingActive === 'yes' && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">CLEANING SCHEDULE ({nights} Night Stay)</label>
                    <select
                      value={housekeepingSchedule}
                      onChange={(e) => setHousekeepingSchedule(e.target.value)}
                      className="w-full bg-[#060b13] border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="daily">Daily Housekeeping ({nights} sessions)</option>
                      {nights > 2 ? (
                        <option value="every_2_days">Every 2 Days ({Math.max(1, Math.ceil(nights / 2))} sessions)</option>
                      ) : (
                        <option value="every_2_days" disabled>
                          Every 2 Days (Requires stay &gt; 2 nights)
                        </option>
                      )}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 6. BEDDING SERVICE OPTIONS */}
          <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-yellow-400 text-sm font-bold">🛩️ Bedding & Linen Options</h3>
              <span className="text-[11px] text-amber-400 font-semibold">{nights} Night{nights > 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">FRESH BEDDINGS CHANGE (₦10,000/NIGHT)</label>
                <select
                  value={beddingBeddings}
                  onChange={(e) => setBeddingBeddings(e.target.value)}
                  className="w-full bg-[#060b13] border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="no">Standard (No Daily Change)</option>
                  <option value="yes">Fresh Beddings Change Daily</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">FRESH LUXURY TOWELS (₦3,000/NIGHT)</label>
                <select
                  value={beddingTowels}
                  onChange={(e) => setBeddingTowels(e.target.value)}
                  className="w-full bg-[#060b13] border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="no">Standard Towel Rotation</option>
                  <option value="yes">Fresh Luxury Towels Daily</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Reservation Summary */}
        <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6 shadow-2xl h-fit space-y-6 sticky top-6">
          <div>
            <h2 className="text-yellow-400 text-xs tracking-wider uppercase font-bold mb-6">RESERVATION SUMMARY</h2>

            <div className="space-y-4 text-sm border-b border-slate-800/80 pb-6">
              <div className="flex justify-between items-center text-slate-300">
                <span>Accommodation ({nights} Night{nights > 1 ? 's' : ''})</span>
                <span className="font-bold text-yellow-400">₦{totals.accommodation.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Dining & Fine Meals</span>
                <span className="font-bold text-amber-400">₦{totals.diningTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Concierge Add-Ons</span>
                <span className="font-bold text-yellow-400">₦{totals.conciergeTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 text-lg font-bold">
              <span className="text-slate-200">Total Due</span>
              <span className="text-yellow-400 text-xl">₦{totals.totalDue.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handlePaystackPayment} className="pt-4 border-t border-slate-800/80 space-y-4">
            <h3 className="text-yellow-400 text-xs tracking-wider uppercase font-bold">GUEST DETAILS</h3>

            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 block mb-2">FULL NAME *</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[#060b13] border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 block mb-2">GUEST EMAIL ADDRESS *</label>
              <input
                type="email"
                placeholder="guest@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#060b13] border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 block mb-2">PHONE NUMBER *</label>
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-[#060b13] border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 block mb-2">NUMBER OF GUESTS</label>
              <input
                type="number"
                min="1"
                value={guests}
                onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#060b13] border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-yellow-500 hover:bg-cyan-400 text-slate-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/10 uppercase tracking-wider text-xs cursor-pointer"
            >
              Confirm & Pay ₦{totals.totalDue.toLocaleString()}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}