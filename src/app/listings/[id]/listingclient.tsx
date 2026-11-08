// ====================================================================
// FILE 13: LISTING PAGE INTERACTIVE PART (image slider, video, reserve card)
// PASTE INTO: app/listings/[id]/ListingClient.tsx   (CREATE this new file next to page.tsx)
// ====================================================================

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Listing } from '@/lib/cateringData';
import {
  ArrowRight, MapPin, Sparkles, ShieldCheck, Play, Pause, X, ChevronLeft, ChevronRight,
} from 'lucide-react';

const AUTOPLAY_MS = 5000;

export default function ListingClient({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const images = Array.from(
    new Set([listing.heroImage, ...(listing.gallery || [])].filter(Boolean))
  ) as string[];
  const count = images.length;

  // ---- slider state ----
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [userPaused, setUserPaused] = useState(false); // the visible pause button
  const [interactionPause, setInteractionPause] = useState(false); // after a swipe/tap, pause briefly
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => () => { if (resumeTimer.current) clearTimeout(resumeTimer.current); }, []);

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el || count === 0) return;
      const next = ((i % count) + count) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: reducedMotion ? 'auto' : 'smooth' });
      indexRef.current = next;
      setIndex(next);
    },
    [count, reducedMotion]
  );

  const pauseTemporarily = () => {
    setInteractionPause(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setInteractionPause(false), 8000);
  };

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== indexRef.current) {
      indexRef.current = i;
      setIndex(i);
    }
  };

  // keep the current slide in place if the screen is resized or rotated
  useEffect(() => {
    const onResize = () => {
      const el = trackRef.current;
      if (el) el.scrollTo({ left: indexRef.current * el.clientWidth, behavior: 'auto' });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // automatic sliding: stops on hover, touch, the pause button, reduced-motion setting, hidden tab and video modal
  const autoplay =
    count > 1 && !reducedMotion && !userPaused && !interactionPause && !hovering && !isVideoModalOpen;

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      goTo(indexRef.current + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplay, goTo]);

  // keep the active thumbnail visible
  useEffect(() => {
    const box = thumbsRef.current;
    const btn = box?.children[index] as HTMLElement | undefined;
    if (box && btn) {
      box.scrollTo({ left: btn.offsetLeft - (box.clientWidth - btn.clientWidth) / 2, behavior: 'smooth' });
    }
  }, [index]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); pauseTemporarily(); goTo(indexRef.current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); pauseTemporarily(); goTo(indexRef.current - 1); }
  };

  const handleProceedToCheckout = () => {
    router.push(`/checkout/${listing.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <Link href="/" className="inline-block text-xs font-mono text-yellow-400 hover:text-cyan-300 transition">
          ← BACK TO PORTFOLIO
        </Link>

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

        {/* ---------- IMAGE SLIDER ---------- */}
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label={`${listing.title} photos`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className="rounded-3xl border border-slate-800 bg-slate-900/40 p-2 backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
        >
          <div className="relative overflow-hidden rounded-2xl">
            <div
              ref={trackRef}
              onScroll={handleScroll}
              onTouchStart={pauseTemporarily}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] max-h-[75vh] w-full"
            >
              {images.map((src, i) => (
                <div
                  key={src + i}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}`}
                  className="relative min-w-full h-full snap-center"
                >
                  <img
                    src={src}
                    alt={`${listing.title}, ${listing.location}: photo ${i + 1} of ${count}`}
                    draggable={false}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover select-none"
                  />
                </div>
              ))}
            </div>

            {/* counter */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-700/60 text-[11px] font-mono text-slate-100 backdrop-blur-md">
              {index + 1} / {count}
            </div>

            {/* pause / play */}
            {count > 1 && !reducedMotion && (
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? 'Start automatic slideshow' : 'Pause automatic slideshow'}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-950/70 border border-slate-700/60 text-slate-100 flex items-center justify-center backdrop-blur-md hover:bg-slate-950/90 cursor-pointer"
              >
                {userPaused ? <Play className="w-4 h-4 fill-current ml-0.5" /> : <Pause className="w-4 h-4 fill-current" />}
              </button>
            )}

            {/* arrows */}
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => { pauseTemporarily(); goTo(index - 1); }}
                  aria-label="Previous photo"
                  className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 border border-slate-700/60 text-white items-center justify-center backdrop-blur-md hover:bg-slate-950/90 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => { pauseTemporarily(); goTo(index + 1); }}
                  aria-label="Next photo"
                  className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 border border-slate-700/60 text-white items-center justify-center backdrop-blur-md hover:bg-slate-950/90 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* watch tour chip */}
            {listing.videoUrl && (
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="absolute bottom-3 left-3 px-3 py-2 rounded-xl bg-slate-950/80 border border-yellow-500/50 text-yellow-400 font-mono text-[11px] flex items-center gap-2 backdrop-blur-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Watch Tour
              </button>
            )}

            {/* dots */}
            {count > 1 && count <= 12 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to photo ${i + 1}`}
                    aria-current={i === index}
                    onClick={() => { pauseTemporarily(); goTo(i); }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === index ? 'w-6 bg-yellow-400' : 'w-2 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* thumbnails */}
          {count > 1 && (
            <div
              ref={thumbsRef}
              className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => { pauseTemporarily(); goTo(i); }}
                  aria-label={`Show photo ${i + 1}`}
                  className={`relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    i === index ? 'border-yellow-400' : 'border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Details Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-3">
              <h2 className="text-sm font-mono text-yellow-400 uppercase tracking-widest">About This Residence</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{listing.description}</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-yellow-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <h2>Residence Highlights</h2>
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
          <div className="bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl h-fit lg:sticky lg:top-6 space-y-6 backdrop-blur-xl shadow-2xl">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2 font-mono text-xs text-yellow-400">
                <Play className="w-4 h-4 fill-current" />
                <span>Video Walkthrough: {listing.title}</span>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                aria-label="Close video"
                className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <video src={listing.videoUrl} controls autoPlay playsInline className="w-full h-full object-contain">
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}