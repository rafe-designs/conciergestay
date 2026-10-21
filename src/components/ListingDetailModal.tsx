'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, Star, MapPin, Calendar, Play, Image as ImageIcon } from 'lucide-react';
import ConciergeBooking from './ConciergeBooking';

export interface Listing {
  id: string;
  title: string;
  location: string;
  rating?: number;
  pricePerNight: number;
  heroImage: string;
  gallery?: string[];
  videoUrl?: string; // Added local/hosted video walkthrough support
  features?: string[];
  description?: string;
  type?: 'penthouse' | 'villa' | 'mansion';
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
  const [activeTab, setActiveTab] = useState<'photos' | 'video'>('photos');
  const [selectedImage, setSelectedImage] = useState<string>('');

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

  const currentHero = selectedImage || listing.heroImage;
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
    router.push(`/checkout/${listing.id}?checkIn=${checkIn}&checkOut=${checkOut}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-auto w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-4 sm:p-6 lg:p-8 text-white shadow-2xl no-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Modal"
          className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/80 border border-white/20 text-slate-300 transition hover:bg-white/20 hover:text-white cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-white/10 pb-5 sm:pb-6 pr-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-mono uppercase tracking-wider text-yellow-400">
            <span className="rounded-md bg-yellow-400/10 px-2.5 py-0.5 border border-yellow-400/30">
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

          {/* Media Tab Selector (Photos vs Video Tour) */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                activeTab === 'photos'
                  ? 'bg-yellow-400 text-slate-950 font-bold shadow-lg shadow-yellow-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Photo Gallery</span>
            </button>

            {listing.videoUrl && (
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                  activeTab === 'video'
                    ? 'bg-yellow-400 text-slate-950 font-bold shadow-lg shadow-yellow-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Video Walkthrough</span>
              </button>
            )}
          </div>

          {/* Media Display Area */}
          <div className="mt-4 relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
            {activeTab === 'photos' ? (
              <>
                <img
                  src={currentHero}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                {/* Thumbnail Selector */}
                {listing.gallery && listing.gallery.length > 0 && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 overflow-x-auto p-2 rounded-xl bg-slate-950/80 backdrop-blur-md">
                    <button
                      onClick={() => setSelectedImage(listing.heroImage)}
                      className={`h-12 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                        currentHero === listing.heroImage ? 'border-yellow-400 scale-105' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={listing.heroImage} alt="hero" className="h-full w-full object-cover" />
                    </button>
                    {listing.gallery.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`h-12 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                          currentHero === img ? 'border-yellow-400 scale-105' : 'border-transparent opacity-70'
                        }`}
                      >
                        <img src={img} alt={`gallery-${idx}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="relative h-full w-full flex items-center justify-center bg-black">
                <video
                  src={listing.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>

          {/* Date Pickers */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-white/5">
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

        {/* Concierge & Culinary Services Component */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <ConciergeBooking 
            nights={totalDays} 
            guests={1} 
            onChange={(data) => setConciergeData(data)} 
          />
        </div>

        {/* Footer Summary & Action */}
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
              className="flex-1 sm:flex-initial rounded-xl border border-white/10 bg-slate-800 px-5 py-3 text-xs font-mono font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition min-h-[44px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="flex-1 sm:flex-initial rounded-xl bg-yellow-400 hover:bg-yellow-300 px-6 py-3 text-xs font-mono font-extrabold text-slate-950 transition shadow-lg shadow-yellow-500/20 cursor-pointer min-h-[44px]"
            >
              PROCEED TO CHECKOUT →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}