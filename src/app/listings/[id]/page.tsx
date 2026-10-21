'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LISTINGS, Listing } from '@/lib/cateringData';
import { ArrowRight, MapPin, Sparkles, ShieldCheck, Play, X, ImageIcon } from 'lucide-react';

export default function DynamicListingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');

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
          className="bg-yellow-500 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
        >
          RETURN TO HOMEPAGE
        </button>
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    router.push(`/checkout/${listing.id}`);
  };

  const currentHero = activeImage || listing.heroImage;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <button
          onClick={() => router.back()}
          className="text-xs font-mono text-yellow-400 hover:text-cyan-300 transition cursor-pointer"
        >
          ← BACK TO PORTFOLIO
        </button>

        {/* Header & Video Walkthrough Trigger Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-yellow-400 uppercase tracking-widest mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{listing.location}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">{listing.title}</h1>
            {listing.address && (
              <p className="text-xs font-mono text-slate-400 mt-1">{listing.address}</p>
            )}
          </div>

          {/* Video Walkthrough Display Button */}
          {listing.videoUrl && (
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-slate-950 font-mono text-xs font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-yellow-500/20 transition cursor-pointer shrink-0"
            >
              <div className="w-7 h-7 rounded-full bg-slate-950 text-yellow-400 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              <span>WATCH VIDEO WALKTHROUGH</span>
            </button>
          )}
        </div>

        {/* Bento Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/40 p-2 backdrop-blur-xl">
          <div className="md:col-span-2 h-80 md:h-96 rounded-2xl overflow-hidden border border-slate-800 relative group">
            <img
              src={currentHero}
              alt={listing.title}
              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
            />
            {listing.videoUrl && (
              <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="px-4 py-2 bg-slate-950/80 border border-yellow-500/50 text-yellow-400 rounded-xl font-mono text-xs flex items-center gap-2 backdrop-blur-md"
                >
                  <Play className="w-4 h-4 fill-current" /> Watch Tour
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:col-span-2 gap-4">
            <div
              onClick={() => setActiveImage(listing.heroImage)}
              className={`h-36 md:h-44 rounded-2xl overflow-hidden border-2 cursor-pointer transition ${
                currentHero === listing.heroImage ? 'border-yellow-400 scale-[0.98]' : 'border-slate-800 opacity-80 hover:opacity-100'
              }`}
            >
              <img src={listing.heroImage} alt="hero thumbnail" className="w-full h-full object-cover" />
            </div>
            {listing.gallery?.map((img: string, idx: number) => (
              <div
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`h-36 md:h-44 rounded-2xl overflow-hidden border-2 cursor-pointer transition ${
                  currentHero === img ? 'border-yellow-400 scale-[0.98]' : 'border-slate-800 opacity-80 hover:opacity-100'
                }`}
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
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-3">
              <h3 className="text-sm font-mono text-yellow-400 uppercase tracking-widest">About This Residence</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{listing.description}</p>
            </div>

            {/* Property Features */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-yellow-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Residence Highlights</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-300">
                {listing.features?.map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
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
                Dates, dining schedules, and concierge add-ons will be finalized during checkout.
              </p>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-slate-950 font-mono font-extrabold py-4 rounded-2xl transition shadow-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Walkthrough Modal */}
      {isVideoModalOpen && listing.videoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2 font-mono text-xs text-yellow-400">
                <Play className="w-4 h-4 fill-current" />
                <span>Video Walkthrough — {listing.title}</span>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <video
                src={listing.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}