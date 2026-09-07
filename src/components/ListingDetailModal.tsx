'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChefHat, Truck, X, Utensils, Star, MapPin, Calendar 
} from 'lucide-react';
import ConciergeBooking from './ConciergeBooking';

export interface MealOption {
  id: string;
  name: string;
  price: number;
  category: 'soups' | 'breakfast' | 'lunch' | 'dinner' | 'specials';
  icon: string;
  isSoup?: boolean;
}

export interface ProteinAddon {
  id: string;
  name: string;
  price: number;
}

export interface MealSelectionDetails {
  mealId: string;
  liters: number;
  swallow?: string;
  proteins?: Record<string, number>;
}

export interface Listing {
  id: string;
  title: string;
  location: string;
  rating?: number;
  pricePerNight: number;
  [key: string]: any;
}

interface ListingDetailModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ListingDetailModal({
  listing,
  isOpen,
  onClose,
}: ListingDetailModalProps) {
  const router = useRouter();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [diningService, setDiningService] = useState<'delivery' | 'chef'>('delivery');

  // Concierge & Culinary Services State
  const [conciergeData, setConciergeData] = useState<{
    addons: Record<string, any>;
    dailyMealSelections: Record<number, any>;
    totalConciergePrice: number;
    totalMealPrice: number;
    grandTotal: number;
  }>({
    addons: {},
    dailyMealSelections: {},
    totalConciergePrice: 0,
    totalMealPrice: 0,
    grandTotal: 0,
  });

  const totalDays = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkIn, checkOut]);

  if (!isOpen || !listing) return null;

  const stayCost = listing.pricePerNight * totalDays;
  const grandTotal = stayCost + conciergeData.totalMealPrice + conciergeData.totalConciergePrice;

  const handleProceedToCheckout = () => {
    if (!checkIn || !checkOut) {
      alert('Please select Check-in and Check-out dates.');
      return;
    }

    const checkoutPayload = {
      listingId: listing.id,
      apartmentId: listing.id,
      apartmentTitle: listing.title,
      pricePerNight: listing.pricePerNight,
      checkIn,
      checkOut,
      totalDays,
      totalNights: totalDays,
      diningService,
      dailyMealSelections: conciergeData.dailyMealSelections,
      addons: conciergeData.addons,
      totalMealCost: conciergeData.totalMealPrice,
      addonTotal: conciergeData.totalConciergePrice,
      stayCost,
      grandTotal,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('concierge_booking_payload', JSON.stringify(checkoutPayload));
      localStorage.setItem('checkout_transaction_summary', JSON.stringify(checkoutPayload));
    }

    onClose();
    router.push(`/checkout/${listing.id}?checkIn=${checkIn}&checkOut=${checkOut}&service=${diningService}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-auto w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-4 sm:p-6 lg:p-8 text-white shadow-2xl no-scrollbar">
        
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Modal"
          className="absolute right-4 top-4 sm:right-6 sm:top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-white/10 pb-5 sm:pb-6 pr-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-mono uppercase tracking-wider text-yellow-400">
            <span className="rounded-md bg-yellow-400/10 px-2 py-0.5 border border-yellow-400/30">
              VERIFIED RESIDENCE
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-yellow-400" />
              {listing.location}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400 stroke-none" />
              {listing.rating || '5.0'}
            </span>
          </div>

          <h2 className="mt-2 font-serif text-xl sm:text-2xl md:text-3xl font-bold text-white">
            {listing.title}
          </h2>

          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-white/5">
            <div>
              <label htmlFor="checkInDate" className="text-[10px] font-mono text-yellow-400 uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold">
                <Calendar className="h-3 w-3" /> Check-In Date
              </label>
              <input
                id="checkInDate"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="checkOutDate" className="text-[10px] font-mono text-yellow-400 uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold">
                <Calendar className="h-3 w-3" /> Check-Out Date
              </label>
              <input
                id="checkOutDate"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">

          {/* Concierge & Meal Selection Component */}
          <div className="pt-4 border-t border-white/10">
            <ConciergeBooking 
              nights={totalDays} 
              guests={1} 
              onChange={(data) => setConciergeData(data)} 
            />
          </div>
        </div>

        {/* Footer Summary */}
        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-xs font-mono">
            <div className="text-slate-400">
              Stay ({totalDays}N): <span className="text-white font-semibold">₦{stayCost.toLocaleString()}</span> | Meals: <span className="text-amber-400 font-bold">₦{conciergeData.totalMealPrice.toLocaleString()}</span> | Add-ons: <span className="text-cyan-400 font-bold">₦{conciergeData.totalConciergePrice.toLocaleString()}</span>
            </div>
            <div className="text-slate-300 font-bold">
              Est. Total: <span className="text-emerald-400 text-base font-serif">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-white/10 bg-slate-800 px-5 py-3 text-xs font-mono font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="flex-1 sm:flex-initial rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-xs font-mono font-extrabold text-slate-950 transition hover:brightness-110 shadow-lg shadow-cyan-950/50 cursor-pointer min-h-[44px]"
            >
              PROCEED TO CHECKOUT →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}