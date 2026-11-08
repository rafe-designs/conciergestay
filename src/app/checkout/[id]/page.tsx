// ====================================================================
// FILE 1 OF 6: CHECKOUT PAGE  (UPDATED: double-submit guard + exact charged amount)
// PASTE INTO: app/checkout/[id]/page.tsx
// REPLACE the whole existing file with this one.
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

const IS_LIVE = process.env.NEXT_PUBLIC_QUICKTELLER_MODE === 'LIVE';
// Web Redirect gateway page (inline popup is not used: it renders blank on the sandbox).
const QT_PAY_URL = IS_LIVE
  ? 'https://newwebpay.interswitchng.com/collections/w/pay'
  : 'https://newwebpay-sandbox.interswitchng.com/collections/w/pay';

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  // Protected test mode: only active when the URL has ?testcode=... (the code is checked on the server).
  const [testMode, setTestMode] = useState(false);
  useEffect(() => {
    setTestMode(!!new URLSearchParams(window.location.search).get('testcode'));
  }, []);

  // Guards against double-clicks creating two bookings/two references.
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    // If the guest presses Back from the payment page, the browser may restore this page from cache
    // with the button still locked.
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setSubmitting(false);
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);
  const listing = LISTINGS[resolvedParams.id] || LISTINGS['new-horizon'];

  // Currency State
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');

  // Real-time Dynamic Exchange Rates State (1 Unit of Foreign Currency = X Naira)
  const [exchangeRates, setExchangeRates] = useState<Record<string, { rate: number; symbol: string }>>({
    NGN: { rate: 1, symbol: '₦' },
    USD: { rate: 1331, symbol: '$' },
    GBP: { rate: 1750, symbol: '£' },
    EUR: { rate: 1450, symbol: '€' },
  });

  // Fetch live exchange rates on component mount
  useEffect(() => {
    async function fetchLiveRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.result === 'success' && data.rates) {
          const usdToNgn = data.rates.NGN || 1331;
          const usdToGbp = data.rates.GBP || 0.78;
          const usdToEur = data.rates.EUR || 0.92;

          const ngnPerGbp = usdToGbp > 0 ? usdToNgn / usdToGbp : 1750;
          const ngnPerEur = usdToEur > 0 ? usdToNgn / usdToEur : 1450;

          setExchangeRates({
            NGN: { rate: 1, symbol: '₦' },
            USD: { rate: usdToNgn, symbol: '$' },
            GBP: { rate: ngnPerGbp, symbol: '£' },
            EUR: { rate: ngnPerEur, symbol: '€' },
          });
        }
      } catch (err) {
        console.warn('Failed to fetch live exchange rates, using fallback rates:', err);
      }
    }
    fetchLiveRates();
  }, []);

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
  const [activeTab, setActiveTab] = useState<'rice' | 'breakfast' | 'dinner' | 'soups' | 'spiced_comforts'>('rice');

  const [dailyMeals, setDailyMeals] = useState<
    Record<string, Record<string, { liters: number; proteins: { id: string; qty: number }[] }>>
  >({});

  const [dailySoups, setDailySoups] = useState<
    Record<string, Record<string, { liters: number; swallow: string; proteins: { id: string; qty: number }[] }>>
  >({});

  // 3. Concierge Add-On States
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

  // Generate Array of Stay Dates
  const stayDates = useMemo(() => {
    if (!checkInDate || !checkOutDate) return [];
    const dates: string[] = [];
    const start = new Date(checkInDate + 'T00:00:00Z');
    const end = new Date(checkOutDate + 'T00:00:00Z');

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return [];
    }

    const current = new Date(start);
    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
  }, [checkInDate, checkOutDate]);

  const nights = stayDates.length;

  useEffect(() => {
    if (nights <= 1) {
      setBeddingBeddings('no');
      setBeddingTowels('no');
    }
  }, [nights]);

  const activeDay = useMemo(() => {
    if (stayDates.includes(selectedDayTab)) return selectedDayTab;
    return stayDates[0] || '';
  }, [stayDates, selectedDayTab]);

  const ALL_SOUP_AND_COMFORT_OPTIONS = useMemo(() => {
    return [...(SOUP_OPTIONS || []), ...(SPICED_COMFORT_OPTIONS || [])];
  }, []);

  const toggleCustomDay = (
    date: string,
    selectedList: string[],
    setSelectedList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedList.includes(date)) {
      setSelectedList(selectedList.filter((d) => d !== date));
    } else {
      setSelectedList([...selectedList, date]);
    }
  };

  // Dynamic Total Calculation Engine
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

        const cappedLiters = Math.min(data.liters, 10);
        diningTotal += (basePricePerLiter * cappedLiters) + proteinCost;
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

          const cappedLiters = Math.min(data.liters, 10);
          diningTotal += (soup.pricePerLiter * cappedLiters) + proteinCost;
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

    if (chauffeurService !== 'none') {
      let dailyChauffeurRate = 350000;
      if (chauffeurService === 'sedan') dailyChauffeurRate = 350000;
      if (chauffeurService === 'luxury_sedan') dailyChauffeurRate = 450000;
      if (chauffeurService === 'commuter') dailyChauffeurRate = 250000;

      const chauffeurDaysCount =
        chauffeurDurationMode === 'entire_stay'
          ? nights
          : chauffeurSelectedDays.filter((d) => stayDates.includes(d)).length;

      conciergeTotal += dailyChauffeurRate * chauffeurDaysCount;
    }

    const cappedSec = Math.min(securityCount, 5);
    if (securityService !== 'none') {
      let dailySecurityRate = 80000;
      if (securityService === 'bodyguard') dailySecurityRate = 120000;
      if (securityService === 'bouncer') dailySecurityRate = 200000;

      const securityDaysCount =
        securityDurationMode === 'entire_stay'
          ? nights
          : securitySelectedDays.filter((d) => stayDates.includes(d)).length;

      conciergeTotal += dailySecurityRate * cappedSec * securityDaysCount;
    }

    const cappedShoppers = Math.min(shoppersCount, 5);
    if (cappedShoppers > 0) {
      const shopperDaysCount =
        shoppersDurationMode === 'entire_stay'
          ? nights
          : shoppersSelectedDays.filter((d) => stayDates.includes(d)).length;

      conciergeTotal += cappedShoppers * 15000 * shopperDaysCount;
    }

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

    if (nights > 1) {
      if (beddingBeddings === 'yes') conciergeTotal += 10000 * nights;
      if (beddingTowels === 'yes') conciergeTotal += 3000 * nights;
    }

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
    dailyMeals,
    dailySoups,
    ALL_SOUP_AND_COMFORT_OPTIONS,
    airportTransferType,
    airportTripDirection,
    chauffeurService,
    chauffeurDurationMode,
    chauffeurSelectedDays,
    securityService,
    securityCount,
    securityDurationMode,
    securitySelectedDays,
    shoppersCount,
    shoppersDurationMode,
    shoppersSelectedDays,
    laundryAdult,
    laundryKid,
    laundrySuit,
    housekeepingActive,
    housekeepingSchedule,
    beddingBeddings,
    beddingTowels,
  ]);

  const formatPrice = (amountInNGN: number) => {
    const curr = exchangeRates[currency] || exchangeRates.NGN;
    const converted = Math.round(amountInNGN / curr.rate);
    return `${curr.symbol}${converted.toLocaleString()}`;
  };

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

    setDailyMeals({ ...dailyMeals, [date]: updatedDayMeals });
  };

  const updateSoupLiters = (date: string, soupId: string, liters: number) => {
    const cappedLiters = Math.min(10, Math.max(0, liters));
    const daySoups = dailySoups[date] || {};
    const current = daySoups[soupId] || { liters: 0, swallow: 'Amala', proteins: [] };
    const updatedDaySoups = { ...daySoups };

    if (cappedLiters === 0) {
      delete updatedDaySoups[soupId];
    } else {
      updatedDaySoups[soupId] = { ...current, liters: cappedLiters, proteins: current.proteins || [] };
    }

    setDailySoups({ ...dailySoups, [date]: updatedDaySoups });
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
      [date]: { ...dayMeals, [mealId]: { ...currentData, proteins: updatedProteins } },
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
      [date]: { ...dayMeals, [mealId]: { ...currentData, proteins: updatedProteins } },
    });
  };

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
      [date]: { ...daySoups, [soupId]: { ...currentData, proteins: updatedProteins } },
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
      [date]: { ...daySoups, [soupId]: { ...currentData, proteins: updatedProteins } },
    });
  };

  // Quickteller Payment & Local Storage Sync Handler
  const handlePaymentSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!checkInDate || !checkOutDate) {
      alert('Please select your check-in and check-out dates.');
      return;
    }

    if (!fullName || !email || !phone) {
      alert('Please fill in your Full Name, Email Address, and Phone Number before proceeding.');
      return;
    }

    if (nights < 1) {
      alert('Check-out date must be after check-in date.');
      return;
    }

    const testCode = new URLSearchParams(window.location.search).get('testcode') || '';
    const isTest = !!testCode;
    // In protected test mode the guest is charged exactly ₦100 (10,000 kobo); the server enforces this too.
    const amountKobo = isTest ? 10000 : Math.round(Number(totals.totalDue) * 100);
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
      console.error('Invalid total, totals =', totals);
      alert('There is a problem with your total. Please review your selections.');
      return;
    }

    setSubmitting(true);

    const uniqueTxRef =
      'CS_' + Date.now() + '_' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

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
      // exactly what the gateway is asked to charge (whole kobo), so server verification can match it
      grandTotal: isTest ? totals.totalDue : amountKobo / 100,
      currency: 'NGN', // the currency actually charged
      displayCurrency: currency, // what the guest was viewing
      createdAt: new Date().toISOString(),
      status: 'Pending', // becomes confirmed only after server-side verification
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

    // Draft only: the success page reads this, verifies the payment on the server,
    // and only then marks the booking as confirmed.
    localStorage.setItem('booking_confirmation_payload', JSON.stringify(payload));

    const merchantCode = process.env.NEXT_PUBLIC_QUICKTELLER_MERCHANT_CODE;
    const payItemId = process.env.NEXT_PUBLIC_QUICKTELLER_PAY_ITEM_ID;

    if (!merchantCode || !payItemId) {
      alert('Payment is not configured. Please contact support.');
      console.error('Missing NEXT_PUBLIC_QUICKTELLER_MERCHANT_CODE or NEXT_PUBLIC_QUICKTELLER_PAY_ITEM_ID');
      setSubmitting(false);
      return;
    }

    // Store a PENDING booking on the server first. Payment is later matched to it by reference,
    // so a paid guest is never lost even if their browser/tab closes after paying.
    try {
      const initRes = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initiate', transactionRef: uniqueTxRef, bookingData: payload, testCode: isTest ? testCode : undefined }),
      });
      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        console.error('Could not start booking:', err);
        alert('We could not start your booking. Please try again.');
        setSubmitting(false);
        return;
      }
    } catch (err) {
      console.error('Could not start booking:', err);
      alert('Network problem. Please check your connection and try again.');
      setSubmitting(false);
      return;
    }

    // Web Redirect: post a hidden form to Interswitch's hosted payment page.
    // After payment they send the guest back to site_redirect_url with
    // ?txnref=...&amount=...&resp=00&desc=... (because payment_response_type = GET).
    const fields: Record<string, string> = {
      merchant_code: merchantCode,
      pay_item_id: payItemId,
      txn_ref: uniqueTxRef,
      amount: String(amountKobo), // kobo, whole number
      currency: '566', // NGN
      cust_id: email,
      cust_email: email,
      cust_name: fullName,
      // cust_mobile_no intentionally NOT sent: Interswitch validates it against the NGN
      // country and rejects foreign or oddly formatted numbers. We keep the phone in our own booking data.
      site_redirect_url: `${window.location.origin}/booking-success`,
      payment_response_type: 'GET',
    };

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = QT_PAY_URL;
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100 font-sans p-4 md:p-8">
      {testMode && (
        <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-center text-xs font-mono text-rose-300">
          TEST MODE: this checkout will charge only ₦100. Remove ?testcode from the URL for a normal booking.
        </div>
      )}
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
                ? 'Redirecting to payment...'
                : `Checkout (${testMode ? '₦100 TEST' : formatPrice(totals.totalDue)})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}