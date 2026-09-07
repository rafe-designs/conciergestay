'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { LISTINGS, Listing } from '@/lib/cateringData';
import { ArrowRight, MapPin, Sparkles, ShieldCheck } from 'lucide-react';

export default function DynamicListingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  // Dynamically load selected apartment by ID from shared data
  const listing: Listing | undefined = LISTINGS[resolvedParams.id];

  // Fallback state if property ID is invalid
  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-mono">
        <h1 className="text-2xl font-bold text-rose-400 mb-2">Residence Not Found</h1>
        <p className="text-xs text-slate-400 mb-6">
          The requested luxury residence does not exist in our portfolio.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-yellow-500 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider"
        >
          RETURN TO HOMEPAGE
        </button>
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    router.push(`/checkout/${listing.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <button
          onClick={() => router.back()}
          className="text-xs font-mono text-yellow-400 hover:text-cyan-300 transition"
        >
          ← BACK TO PORTFOLIO
        </button>

        {/* Bento Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/40 p-2 backdrop-blur-xl">
          <div className="md:col-span-2 h-80 md:h-96 rounded-2xl overflow-hidden border border-slate-800 relative">
            <img
              src={listing.heroImage}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 md:col-span-2 gap-4">
            {(listing.gallery && listing.gallery.length > 0
              ? listing.gallery
              : [listing.heroImage]
            ).map((img: string, idx: number) => (
              <div
                key={idx}
                className="h-36 md:h-44 rounded-2xl overflow-hidden border border-slate-800"
              >
                <img
                  src={img}
                  alt={`${listing.title} gallery ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Details Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-yellow-400 uppercase tracking-widest mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{listing.location}</span>
              </div>
              <h1 className="text-3xl font-serif font-bold text-white">{listing.title}</h1>
              <p className="text-slate-300 mt-3 text-sm leading-relaxed">{listing.description}</p>
            </div>

            {/* Property Features */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-yellow-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Residence Highlights</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-300">
                {listing.features?.map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-yellow-400 font-bold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Direct Reserve Sidebar Card */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl h-fit sticky top-6 space-y-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-2xl font-bold font-mono text-yellow-400">
                  ₦{listing.pricePerNight.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400"> / night</span>
              </div>
              <span className="text-[10px] font-mono text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 rounded-full">
                VERIFIED
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                <span>Instant Reservation</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Dates and stay preferences will be finalized during checkout.
              </p>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-slate-950 font-mono font-extrabold py-4 rounded-2xl transition shadow-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}