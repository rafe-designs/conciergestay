// ====================================================================
// FILE 1: app/checkout/[id]/page.tsx (Paystack Checkout with SC_ Prefix)
// ====================================================================

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

  const [submitting, setSubmitting] = useState(false);
  const listing = LISTINGS[resolvedParams.id] || LISTINGS['new-horizon'];

  // Currency State
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');
  const [exchangeRates, setExchangeRates] = useState<Record<string, { rate: number; symbol: string }>>({
    NGN: { rate: 1, symbol: '₦' },
    USD: { rate: 1331, symbol: '$' },
    GBP: { rate: 1750, symbol: '£' },
    EUR: { rate: 1450, symbol: '€' },
  });

  useEffect(() => {
    async function fetchLiveRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.result === 'success' && data.rates) {
          const usdToNgn = data.rates.NGN || 1331;
          const usdToGbp = data.rates.GBP || 0.78;
          const usdToEur = data.rates.EUR || 0.92;
          setExchangeRates({
            NGN: { rate: 1, symbol: '₦' },
            USD: { rate: usdToNgn, symbol: '$' },
            GBP: { rate: usdToNgn / usdToGbp, symbol: '£' },
            EUR: { rate: usdToNgn / usdToEur, symbol: '€' },
          });
        }
      } catch (err) {
        console.warn('Failed to fetch live exchange rates:', err);
      }
    }
    fetchLiveRates();
  }, []);

  // Stay & Guest Info
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(1);

  const [selectedDayTab, setSelectedDayTab] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'rice' | 'breakfast' | 'dinner' | 'soups' | 'spiced_comforts'>('rice');

  const [dailyMeals, setDailyMeals] = useState<
    Record<string, Record<string, { liters: number; proteins: { id: string; qty: number }[] }>>
  >({});

  const [dailySoups, setDailySoups] = useState<
    Record<string, Record<string, { liters: number; swallow: string; proteins: { id: string; qty: number }[] }>>
  >({});

  const [airportTransferType, setAirportTransferType] = useState('none');
  const [airportTripDirection, setAirportTripDirection] = useState<'one_way_pickup' | 'one_way_dropoff' | 'round_trip'>('one_way_pickup');
  const [chauffeurService, setChauffeurService] = useState('none');
  const [chauffeurDurationMode, setChauffeurDurationMode] = useState<'entire_stay' | 'custom_days'>('entire_stay');
  const [chauffeurSelectedDays, setChauffeurSelectedDays] = useState<string[]>([]);
  const [securityService, setSecurityService] = useState('none');
  const [securityCount, setSecurityCount] = useState(1);
  const [securityDurationMode, setSecurityDurationMode] = useState<'entire_stay' | 'custom_days'>('entire_stay');
  const [securitySelectedDays, setSecuritySelectedDays] = useState<string[]>([]);
  const [shoppersCount, setShoppersCount] = useState(0);
  const [shoppersDurationMode, setShoppersDurationMode] = useState<'entire_stay' | 'custom_days'>('entire_stay');
  const [shoppersSelectedDays, setShoppersSelectedDays] = useState<string[]>([]);
  const [laundryAdult, setLaundryAdult] = useState('0');
  const [laundryKid, setLaundryKid] = useState('0');
  const [laundrySuit, setLaundrySuit] = useState('0');
  const [housekeepingActive, setHousekeepingActive] = useState('no');
  const [housekeepingSchedule, setHousekeepingSchedule] = useState('daily');
  const [beddingBeddings, setBeddingBeddings] = useState('no');
  const [beddingTowels, setBeddingTowels] = useState('no');

  const stayDates = useMemo(() => {
    if (!checkInDate || !checkOutDate) return [];
    const dates: string[] = [];
    const start = new Date(checkInDate + 'T00:00:00Z');
    const end = new Date(checkOutDate + 'T00:00:00Z');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return [];
    const current = new Date(start);
    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
  }, [checkInDate, checkOutDate]);

  const nights = stayDates.length;
  const activeDay = stayDates.includes(selectedDayTab) ? selectedDayTab : (stayDates[0] || '');
  const ALL_SOUP_AND_COMFORT_OPTIONS = useMemo(() => [...(SOUP_OPTIONS || []), ...(SPICED_COMFORT_OPTIONS || [])], []);

  const toggleCustomDay = (date: string, selectedList: string[], setSelectedList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selectedList.includes(date)) {
      setSelectedList(selectedList.filter((d) => d !== date));
    } else {
      setSelectedList([...selectedList, date]);
    }
  };

  const totals = useMemo(() => {
    const accommodation = listing.pricePerNight * nights;
    let diningTotal = 0;

    stayDates.forEach((date) => {
      const dayMeals = dailyMeals[date] || {};
      Object.entries(dayMeals).forEach(([mealId, data]) => {
        let basePricePerLiter = 0;
        Object.values(CULINARY_MEALS).forEach((category) => {
          const found = category.find((m) => m.id === mealId);
          if (found) basePricePerLiter = found.basePrice;
        });
        let proteinCost = 0;
        (data.proteins || []).forEach((item) => {
          const p = PROTEIN_OPTIONS.find((opt) => opt.id === item.id);
          if (p) proteinCost += p.price * item.qty;
        });
        diningTotal += basePricePerLiter * Math.min(data.liters, 10) + proteinCost;
      });

      const daySoups = dailySoups[date] || {};
      Object.entries(daySoups).forEach(([soupId, data]) => {
        const soup = ALL_SOUP_AND_COMFORT_OPTIONS.find((s) => s.id === soupId);
        if (soup) {
          let proteinCost = 0;
          (data.proteins || []).forEach((item) => {
            const p = PROTEIN_OPTIONS.find((opt) => opt.id === item.id);
            if (p) proteinCost += p.price * item.qty;
          });
          diningTotal += soup.pricePerLiter * Math.min(data.liters, 10) + proteinCost;
        }
      });
    });

    let conciergeTotal = 0;
    if (airportTransferType !== 'none') {
      const baseFee = airportTransferType === 'suv' ? 85000 : 45000;
      conciergeTotal += airportTripDirection === 'round_trip' ? baseFee * 2 : baseFee;
    }

    if (chauffeurService !== 'none') {
      const rate = chauffeurService === 'luxury_sedan' ? 450000 : chauffeurService === 'commuter' ? 250000 : 350000;
      const days = chauffeurDurationMode === 'entire_stay' ? nights : chauffeurSelectedDays.filter((d) => stayDates.includes(d)).length;
      conciergeTotal += rate * days;
    }

    if (securityService !== 'none') {
      const rate = securityService === 'bouncer' ? 200000 : securityService === 'bodyguard' ? 120000 : 80000;
      const days = securityDurationMode === 'entire_stay' ? nights : securitySelectedDays.filter((d) => stayDates.includes(d)).length;
      conciergeTotal += rate * Math.min(securityCount, 5) * days;
    }

    if (shoppersCount > 0) {
      const days = shoppersDurationMode === 'entire_stay' ? nights : shoppersSelectedDays.filter((d) => stayDates.includes(d)).length;
      conciergeTotal += Math.min(shoppersCount, 5) * 15000 * days;
    }

    conciergeTotal += (parseInt(laundryAdult) || 0) * 1500 + (parseInt(laundryKid) || 0) * 1000 + (parseInt(laundrySuit) || 0) * 5000;

    if (housekeepingActive === 'yes') {
      conciergeTotal += housekeepingSchedule === 'daily' ? 25000 * nights : 25000 * Math.max(1, Math.ceil(nights / 2));
    }

    if (nights > 1) {
      if (beddingBeddings === 'yes') conciergeTotal += 10000 * nights;
      if (beddingTowels === 'yes') conciergeTotal += 3000 * nights;
    }

    return { accommodation, diningTotal, conciergeTotal, totalDue: accommodation + diningTotal + conciergeTotal };
  }, [
    listing, nights, stayDates, dailyMeals, dailySoups, ALL_SOUP_AND_COMFORT_OPTIONS,
    airportTransferType, airportTripDirection, chauffeurService, chauffeurDurationMode, chauffeurSelectedDays,
    securityService, securityCount, securityDurationMode, securitySelectedDays, shoppersCount, shoppersDurationMode,
    shoppersSelectedDays, laundryAdult, laundryKid, laundrySuit, housekeepingActive, housekeepingSchedule,
    beddingBeddings, beddingTowels
  ]);

  const formatPrice = (amountInNGN: number) => {
    const curr = exchangeRates[currency] || exchangeRates.NGN;
    const converted = Math.round(amountInNGN / curr.rate);
    return `${curr.symbol}${converted.toLocaleString()}`;
  };

  const updateMealLiters = (date: string, id: string, liters: number) => {
    const dayMeals = dailyMeals[date] || {};
    const currentData = dayMeals[id] || { liters: 0, proteins: [] };
    const capped = Math.min(10, Math.max(0, liters));
    const updated = { ...dayMeals };
    if (capped === 0) delete updated[id];
    else updated[id] = { ...currentData, liters: capped };
    setDailyMeals({ ...dailyMeals, [date]: updated });
  };

  const updateSoupLiters = (date: string, soupId: string, liters: number) => {
    const capped = Math.min(10, Math.max(0, liters));
    const daySoups = dailySoups[date] || {};
    const current = daySoups[soupId] || { liters: 0, swallow: 'Amala', proteins: [] };
    const updated = { ...daySoups };
    if (capped === 0) delete updated[soupId];
    else updated[soupId] = { ...current, liters: capped };
    setDailySoups({ ...dailySoups, [date]: updated });
  };

  const toggleMealProtein = (date: string, mealId: string, proteinId: string) => {
    const dayMeals = dailyMeals[date] || {};
    const current = dayMeals[mealId];
    if (!current) return;
    const exists = current.proteins.some((p) => p.id === proteinId);
    const updatedProteins = exists ? current.proteins.filter((p) => p.id !== proteinId) : [...current.proteins, { id: proteinId, qty: 1 }];
    setDailyMeals({ ...dailyMeals, [date]: { ...dayMeals, [mealId]: { ...current, proteins: updatedProteins } } });
  };

  const updateMealProteinQty = (date: string, mealId: string, proteinId: string, qty: number) => {
    const dayMeals = dailyMeals[date] || {};
    const current = dayMeals[mealId];
    if (!current) return;
    const updatedProteins = current.proteins.map((p) => (p.id === proteinId ? { ...p, qty: Math.max(1, qty) } : p));
    setDailyMeals({ ...dailyMeals, [date]: { ...dayMeals, [mealId]: { ...current, proteins: updatedProteins } } });
  };

  const toggleSoupProtein = (date: string, soupId: string, proteinId: string) => {
    const daySoups = dailySoups[date] || {};
    const current = daySoups[soupId];
    if (!current) return;
    const currentProt = current.proteins || [];
    const exists = currentProt.some((p) => p.id === proteinId);
    const updated = exists ? currentProt.filter((p) => p.id !== proteinId) : [...currentProt, { id: proteinId, qty: 1 }];
    setDailySoups({ ...dailySoups, [date]: { ...daySoups, [soupId]: { ...current, proteins: updated } } });
  };

  const updateSoupProteinQty = (date: string, soupId: string, proteinId: string, qty: number) => {
    const daySoups = dailySoups[date] || {};
    const current = daySoups[soupId];
    if (!current) return;
    const updated = (current.proteins || []).map((p) => (p.id === proteinId ? { ...p, qty: Math.max(1, qty) } : p));
    setDailySoups({ ...dailySoups, [date]: { ...daySoups, [soupId]: { ...current, proteins: updated } } });
  };

  // Paystack Payment Handler (Updated with SC_ prefix)
  const handlePaymentSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!checkInDate || !checkOutDate || !fullName || !email || !phone) {
      alert('Please fill in your dates and contact details.');
      return;
    }

    const amountKobo = Math.round(Number(totals.totalDue) * 100);
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
      alert('Invalid total amount.');
      return;
    }

    setSubmitting(true);
    const uniqueTxRef = 'SC_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);

    let formattedAirportTransfer = 'None';
    if (airportTransferType !== 'none') {
      const vehicleName = airportTransferType === 'suv' ? 'Luxury SUV' : 'Executive Sedan';
      const directionLabel = 
        airportTripDirection === 'round_trip' ? 'Round Trip (2x Fare)' :
        airportTripDirection === 'one_way_dropoff' ? 'One-Way Drop-off' : 'One-Way Pick-up';
      formattedAirportTransfer = `${directionLabel} - ${vehicleName}`;
    }

    let formattedChauffeur = 'None';
    if (chauffeurService !== 'none') {
      const chauffeurDaysCount =
        chauffeurDurationMode === 'entire_stay'
          ? nights
          : chauffeurSelectedDays.filter((d) => stayDates.includes(d)).length;
      const chauffeurLabel =
        chauffeurService === 'luxury_sedan' ? 'Luxury Sedan' :
        chauffeurService === 'commuter' ? 'Executive Commuter Shuttle' : 'Executive Sedan';
      formattedChauffeur = `${chauffeurLabel} (${chauffeurDaysCount} Days)`;
    }

    let formattedSecurity = 'None';
    if (securityService !== 'none') {
      const securityDaysCount =
        securityDurationMode === 'entire_stay'
          ? nights
          : securitySelectedDays.filter((d) => stayDates.includes(d)).length;
      const secLabel = 
        securityService === 'bouncer' ? 'Protection (Bouncers)' :
        securityService === 'bodyguard' ? 'Executive Bodyguards' : 'Tactical Unit';
      formattedSecurity = `${secLabel} (${securityCount} Personnel, ${securityDaysCount} Days)`;
    }

    let formattedShopper = 'None';
    const cappedShoppers = Math.min(shoppersCount, 5);
    if (cappedShoppers > 0) {
      const shopperDaysCount =
        shoppersDurationMode === 'entire_stay'
          ? nights
          : shoppersSelectedDays.filter((d) => stayDates.includes(d)).length;
      formattedShopper = `${cappedShoppers} Personal Shopper(s) (${shopperDaysCount} Days)`;
    }

    const payload = {
      transactionRef: uniqueTxRef,
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
      currency: 'NGN',
      displayCurrency: currency,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      guestInfo: { fullName, email, phone, guests },
      dailyMealSelections: { meals: dailyMeals, soups: dailySoups },
      addons: {
        airportTransfer: formattedAirportTransfer,
        chauffeurService: formattedChauffeur,
        securityService: formattedSecurity,
        shoppersService: formattedShopper,
        laundryAdult,
        laundryKid,
        laundrySuit,
        housekeepingActive,
        housekeepingSchedule,
        beddingBeddings: nights > 1 ? beddingBeddings : 'no',
        beddingTowels: nights > 1 ? beddingTowels : 'no',
      },
    };

    localStorage.setItem('booking_confirmation_payload', JSON.stringify(payload));

    try {
      const initRes = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initiate', transactionRef: uniqueTxRef, bookingData: payload }),
      });
      if (!initRes.ok) {
        alert('Could not initiate booking on server.');
        setSubmitting(false);
        return;
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
      setSubmitting(false);
      return;
    }

    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!paystackPublicKey) {
      alert('Paystack public key missing.');
      setSubmitting(false);
      return;
    }

    // Load Paystack Inline Script dynamically
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      const handler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email: email,
        amount: amountKobo,
        currency: 'NGN',
        ref: uniqueTxRef,
        callback: function (response: { reference: string }) {
          router.push(`/booking-success?reference=${response.reference}`);
        },
        onClose: function () {
          setSubmitting(false);
        },
      });
      handler.openIframe();
    };
    document.body.appendChild(script);
  };

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100 font-sans p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link
          href={`/listings/${resolvedParams.id}`}
          className="text-yellow-400 hover:text-cyan-300 text-sm flex items-center gap-2 font-medium transition-colors"
        >
          ← Back to Residence Details
        </Link>

        {/* Currency Switcher */}
        <div className="flex items-center gap-2 bg-[#0b121e] border border-slate-800 p-1.5 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 px-2">Currency (Live):</span>
          {(['NGN', 'USD', 'GBP', 'EUR'] as const).map((curr) => (
            <button
              key={curr}
              type="button"
              onClick={() => setCurrency(curr)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                currency === curr
                  ? 'bg-yellow-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-100">
          {listing.title}
        </h1>
        <p className="text-yellow-400 text-lg font-semibold mt-1">
          {formatPrice(listing.pricePerNight)}{' '}
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
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/40'
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

                      return (
                        <div
                          key={item.id}
                          className="bg-[#060b13] border border-slate-800/80 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-200">{item.name}</p>
                              <p className="text-xs text-amber-400 mt-1 font-semibold">
                                {formatPrice(item.basePrice)} / Liter
                              </p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                              <label className="text-[11px] text-slate-400 uppercase">Liters (Max 10)</label>
                              <div className="flex items-center gap-1 bg-[#0b121e] border border-slate-800 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => updateMealLiters(activeDay, item.id, currentData.liters - 1)}
                                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-md font-bold text-sm flex items-center justify-center transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-xs text-amber-400 font-semibold">
                                  {currentData.liters}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateMealLiters(activeDay, item.id, currentData.liters + 1)}
                                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-md font-bold text-sm flex items-center justify-center transition-colors"
                                >
                                  +
                                </button>
                              </div>
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
                                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#0b121e] p-2.5 rounded-lg border border-slate-800/60"
                                    >
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => toggleMealProtein(activeDay, item.id, p.id)}
                                          className="w-4 h-4 accent-yellow-400 rounded"
                                        />
                                        <span className="text-xs text-slate-300">
                                          {p.name}{' '}
                                          <span className="text-yellow-400/80">(+{formatPrice(p.price)})</span>
                                        </span>
                                      </label>

                                      {isChecked && (
                                        <div className="flex items-center justify-between w-full sm:w-auto gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                                          <span className="text-[10px] text-slate-400 uppercase">Qty (Pcs):</span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateMealProteinQty(
                                                  activeDay,
                                                  item.id,
                                                  p.id,
                                                  (selectedProtein.qty || 1) - 1
                                                )
                                              }
                                              className="w-7 h-7 bg-[#060b13] border border-yellow-500/40 text-yellow-300 rounded font-bold text-xs flex items-center justify-center"
                                            >
                                              -
                                            </button>
                                            <span className="w-6 text-center text-xs text-yellow-300 font-semibold">
                                              {selectedProtein.qty}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateMealProteinQty(
                                                  activeDay,
                                                  item.id,
                                                  p.id,
                                                  (selectedProtein.qty || 1) + 1
                                                )
                                              }
                                              className="w-7 h-7 bg-[#060b13] border border-yellow-500/40 text-yellow-300 rounded font-bold text-xs flex items-center justify-center"
                                            >
                                              +
                                            </button>
                                          </div>
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

                      return (
                        <div key={soup.id} className="bg-[#060b13] border border-slate-800/80 rounded-xl p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-200">{soup.name}</p>
                              <p className="text-xs text-yellow-400 mt-1 font-semibold">
                                {formatPrice(soup.pricePerLiter)} / Liter
                              </p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                              <label className="text-[11px] text-slate-400 uppercase">Qty (Max 10)</label>
                              <div className="flex items-center gap-1 bg-[#0b121e] border border-slate-800 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => updateSoupLiters(activeDay, soup.id, current.liters - 1)}
                                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-md font-bold text-sm flex items-center justify-center transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-xs text-amber-400 font-semibold">
                                  {current.liters}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateSoupLiters(activeDay, soup.id, current.liters + 1)}
                                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-md font-bold text-sm flex items-center justify-center transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="space-y-3 pt-2 border-t border-slate-800/60">
                              {activeTab === 'soups' && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                                    className="bg-[#0b121e] border border-yellow-500/40 rounded-lg p-2.5 text-xs text-yellow-400 focus:outline-none"
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
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#0b121e] p-2.5 rounded-lg border border-slate-800/60"
                                      >
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleSoupProtein(activeDay, soup.id, p.id)}
                                            className="w-4 h-4 accent-yellow-400 rounded"
                                          />
                                          <span className="text-xs text-slate-300">
                                            {p.name}{' '}
                                            <span className="text-yellow-400/80">(+{formatPrice(p.price)})</span>
                                          </span>
                                        </label>

                                        {isChecked && (
                                          <div className="flex items-center justify-between w-full sm:w-auto gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                                            <span className="text-[10px] text-slate-400 uppercase">Qty (Pcs):</span>
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  updateSoupProteinQty(
                                                    activeDay,
                                                    soup.id,
                                                    p.id,
                                                    (selectedProtein.qty || 1) - 1
                                                  )
                                                }
                                                className="w-7 h-7 bg-[#060b13] border border-yellow-500/40 text-yellow-300 rounded font-bold text-xs flex items-center justify-center"
                                              >
                                                -
                                              </button>
                                              <span className="w-6 text-center text-xs text-yellow-300 font-semibold">
                                                {selectedProtein.qty}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  updateSoupProteinQty(
                                                    activeDay,
                                                    soup.id,
                                                    p.id,
                                                    (selectedProtein.qty || 1) + 1
                                                  )
                                                }
                                                className="w-7 h-7 bg-[#060b13] border border-yellow-500/40 text-yellow-300 rounded font-bold text-xs flex items-center justify-center"
                                              >
                                                +
                                              </button>
                                            </div>
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
                  <option value="sedan">Executive Sedan ({formatPrice(45000)})</option>
                  <option value="suv">Luxury SUV ({formatPrice(85000)})</option>
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

            {/* Dedicated Chauffeur Service */}
            <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-yellow-400 text-sm font-bold">🚘 Dedicated Chauffeur Service</h3>
                <span className="text-[11px] text-yellow-400 font-semibold">{nights} Night{nights > 1 ? 's' : ''} Stay</span>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">CHAUFFEUR TIER & RATE</label>
                <select
                  value={chauffeurService}
                  onChange={(e) => setChauffeurService(e.target.value)}
                  className="w-full bg-[#060b13] border border-slate-700/60 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="none">No Dedicated Chauffeur</option>
                  <option value="sedan">Executive Sedan ({formatPrice(350000)}/day)</option>
                  <option value="luxury_sedan">Luxury Sedan ({formatPrice(450000)}/day)</option>
                  <option value="commuter">Executive Commuter Shuttle ({formatPrice(250000)}/day)</option>
                </select>
              </div>

              {chauffeurService !== 'none' && (
                <div className="space-y-3 pt-2 border-t border-slate-800/60">
                  <label className="text-xs text-slate-400 block font-medium">CHAUFFEUR DURATION</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setChauffeurDurationMode('entire_stay')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                        chauffeurDurationMode === 'entire_stay'
                          ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                          : 'bg-[#060b13] text-slate-300 border-slate-800'
                      }`}
                    >
                      Entire Stay ({nights} Days)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChauffeurDurationMode('custom_days')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                        chauffeurDurationMode === 'custom_days'
                          ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                          : 'bg-[#060b13] text-slate-300 border-slate-800'
                      }`}
                    >
                      Specific Dates / Period
                    </button>
                  </div>

                  {chauffeurDurationMode === 'custom_days' && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] text-amber-400">Select exact booking days for chauffeur service:</p>
                      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                        {stayDates.map((dateStr, idx) => {
                          const isChecked = chauffeurSelectedDays.includes(dateStr);
                          const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          });
                          return (
                            <button
                              key={`chauf-${dateStr}`}
                              type="button"
                              onClick={() => toggleCustomDay(dateStr, chauffeurSelectedDays, setChauffeurSelectedDays)}
                              className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-between transition ${
                                isChecked
                                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                                  : 'bg-[#060b13] border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <span>Day {idx + 1} ({formattedDate})</span>
                              <span className={`w-3 h-3 rounded border flex items-center justify-center text-[10px] ${isChecked ? 'bg-yellow-400 border-yellow-400 text-slate-950 font-bold' : 'border-slate-600'}`}>
                                {isChecked ? '✓' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. SECURITY & PERSONAL SHOPPER ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-yellow-400 text-sm font-bold">🛡️ Dedicated Security Details</h3>
                <span className="text-[11px] text-amber-400 font-semibold">{nights} Night{nights > 1 ? 's' : ''} Stay</span>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">SECURITY TIER</label>
                <select
                  value={securityService}
                  onChange={(e) => setSecurityService(e.target.value)}
                  className="w-full bg-[#060b13] border border-slate-500/50 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="none">No Additional Security</option>
                  <option value="tactical">Tactical Unit ({formatPrice(80000)}/day)</option>
                  <option value="bodyguard">Executive Bodyguards ({formatPrice(120000)}/day)</option>
                  <option value="bouncer">Protection (Bouncers) ({formatPrice(200000)}/day)</option>
                </select>
              </div>

              {securityService !== 'none' && (
                <div className="space-y-3 pt-2 border-t border-slate-800/60">
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

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-medium">SECURITY DURATION</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSecurityDurationMode('entire_stay')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                          securityDurationMode === 'entire_stay'
                            ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                            : 'bg-[#060b13] text-slate-300 border-slate-800'
                        }`}
                      >
                        Entire Stay ({nights} Days)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSecurityDurationMode('custom_days')}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                          securityDurationMode === 'custom_days'
                            ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                            : 'bg-[#060b13] text-slate-300 border-slate-800'
                        }`}
                      >
                        Specific Dates / Period
                      </button>
                    </div>

                    {securityDurationMode === 'custom_days' && (
                      <div className="space-y-2 pt-2">
                        <p className="text-[11px] text-amber-400">Select exact booking days for security details:</p>
                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                          {stayDates.map((dateStr, idx) => {
                            const isChecked = securitySelectedDays.includes(dateStr);
                            const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            });
                            return (
                              <button
                                key={`sec-${dateStr}`}
                                type="button"
                                onClick={() => toggleCustomDay(dateStr, securitySelectedDays, setSecuritySelectedDays)}
                                className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-between transition ${
                                  isChecked
                                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                                    : 'bg-[#060b13] border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <span>Day {idx + 1} ({formattedDate})</span>
                                <span className={`w-3 h-3 rounded border flex items-center justify-center text-[10px] ${isChecked ? 'bg-yellow-400 border-yellow-400 text-slate-950 font-bold' : 'border-slate-600'}`}>
                                  {isChecked ? '✓' : ''}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Personal Shoppers */}
            <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-yellow-400 text-sm font-bold">🛍️ Personal Shoppers</h3>
                <span className="text-[11px] text-amber-400 font-semibold">{nights} Night{nights > 1 ? 's' : ''} Stay</span>
              </div>
              <p className="text-xs text-slate-400">{formatPrice(15000)} / Day per Shopper</p>

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

              {shoppersCount > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800/60">
                  <label className="text-xs text-slate-400 block font-medium">SHOPPER DURATION</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShoppersDurationMode('entire_stay')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                        shoppersDurationMode === 'entire_stay'
                          ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                          : 'bg-[#060b13] text-slate-300 border-slate-800'
                      }`}
                    >
                      Entire Stay ({nights} Days)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShoppersDurationMode('custom_days')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                        shoppersDurationMode === 'custom_days'
                          ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                          : 'bg-[#060b13] text-slate-300 border-slate-800'
                      }`}
                    >
                      Specific Dates / Period
                    </button>
                  </div>

                  {shoppersDurationMode === 'custom_days' && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] text-amber-400">Select exact booking days for personal shoppers:</p>
                      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                        {stayDates.map((dateStr, idx) => {
                          const isChecked = shoppersSelectedDays.includes(dateStr);
                          const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          });
                          return (
                            <button
                              key={`shop-${dateStr}`}
                              type="button"
                              onClick={() => toggleCustomDay(dateStr, shoppersSelectedDays, setShoppersSelectedDays)}
                              className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-between transition ${
                                isChecked
                                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                                  : 'bg-[#060b13] border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <span>Day {idx + 1} ({formattedDate})</span>
                              <span className={`w-3 h-3 rounded border flex items-center justify-center text-[10px] ${isChecked ? 'bg-yellow-400 border-yellow-400 text-slate-950 font-bold' : 'border-slate-600'}`}>
                                {isChecked ? '✓' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 5. LAUNDRY & HOUSEKEEPING SERVICES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
              <h3 className="text-yellow-400 text-sm font-bold mb-3">🧺 Laundry Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-slate-300">Adult Outfits ({formatPrice(1500)})</span>
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
                  <span className="text-xs text-slate-300">Kids Wear ({formatPrice(1000)})</span>
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
                  <span className="text-xs text-slate-300">Suits & Ceremonial ({formatPrice(5000)})</span>
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
                <span className="text-xs text-amber-400 font-bold">{formatPrice(25000)} / Session</span>
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
                <label className="text-xs text-slate-400 block mb-1">FRESH BEDDINGS CHANGE ({formatPrice(10000)}/NIGHT)</label>
                <select
                  value={beddingBeddings}
                  onChange={(e) => setBeddingBeddings(e.target.value)}
                  disabled={nights <= 1}
                  className={`w-full bg-[#060b13] border rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none ${
                    nights <= 1 ? 'opacity-50 cursor-not-allowed border-slate-800' : 'border-slate-700/60'
                  }`}
                >
                  <option value="no">Standard (No Daily Change)</option>
                  {nights > 1 ? (
                    <option value="yes">Fresh Beddings Change Daily</option>
                  ) : (
                    <option value="yes" disabled>
                      Fresh Beddings Change Daily (Requires stay &gt; 1 night)
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">FRESH LUXURY TOWELS ({formatPrice(3000)}/NIGHT)</label>
                <select
                  value={beddingTowels}
                  onChange={(e) => setBeddingTowels(e.target.value)}
                  disabled={nights <= 1}
                  className={`w-full bg-[#060b13] border rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none ${
                    nights <= 1 ? 'opacity-50 cursor-not-allowed border-slate-800' : 'border-slate-700/60'
                  }`}
                >
                  <option value="no">Standard Towel Rotation</option>
                  {nights > 1 ? (
                    <option value="yes">Fresh Luxury Towels Daily</option>
                  ) : (
                    <option value="yes" disabled>
                      Fresh Luxury Towels Daily (Requires stay &gt; 1 night)
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Reservation Summary & Payment */}
        <div className="bg-[#0b121e] border border-slate-800/80 rounded-2xl p-6 shadow-2xl h-fit space-y-6 sticky top-6">
          <div>
            <h2 className="text-yellow-400 text-xs tracking-wider uppercase font-bold mb-6">RESERVATION SUMMARY</h2>

            <div className="space-y-4 text-sm border-b border-slate-800/80 pb-6">
              <div className="flex justify-between items-center text-slate-300">
                <span>Accommodation ({nights} Night{nights > 1 ? 's' : ''})</span>
                <span className="font-bold text-yellow-400">{formatPrice(totals.accommodation)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Dining & Fine Meals</span>
                <span className="font-bold text-amber-400">{formatPrice(totals.diningTotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Concierge Add-Ons</span>
                <span className="font-bold text-yellow-400">{formatPrice(totals.conciergeTotal)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 text-lg font-bold">
              <span className="text-slate-200">Total Due ({currency})</span>
              <span className="text-yellow-400 text-xl">{formatPrice(totals.totalDue)}</span>
            </div>
          </div>

          <form onSubmit={handlePaymentSubmission} className="pt-4 border-t border-slate-800/80 space-y-4">
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
              <div className="flex items-center justify-between bg-[#060b13] border border-slate-800 rounded-xl p-1.5">
                <button
                  type="button"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-yellow-400 rounded-lg font-bold text-base flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="text-sm font-semibold text-slate-200">
                  {guests} Guest{guests > 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setGuests(Math.min(30, guests + 1))}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-yellow-400 rounded-lg font-bold text-base flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 bg-yellow-500 hover:bg-cyan-400 text-slate-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/10 uppercase tracking-wider text-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Opening Paystack...'
                : `Pay with Paystack (${formatPrice(totals.totalDue)})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}