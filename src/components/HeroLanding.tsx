// ====================================================================
// FILE 16: HERO SECTION (mobile layout fixed)
// PASTE INTO: components/HeroLanding.tsx  (same place as your current HeroLanding.tsx)
// REPLACE the whole file.
// ====================================================================

'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, ArrowUpRight, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);
// Phone address bars growing/shrinking should not make the page jump.
ScrollTrigger.config({ ignoreMobileResize: true });

interface HeroLandingProps {
  onBookClick?: () => void;
}

const HERO_IMG =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80';

export default function HeroLanding({ onBookClick }: HeroLandingProps) {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // The pinned "shrinking card" effect is desktop-only. On phones it pinned and scaled the hero,
      // which cut off the content and fought with the browser's address bar.
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: mainContainerRef.current,
            start: 'top top',
            end: '+=100%',
            scrub: 1.2,
            pin: true,
            anticipatePin: 1,
          },
        });

        tl.to(
          heroCardRef.current,
          {
            scale: 0.92,
            borderRadius: '40px',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)',
            ease: 'power2.inOut',
          },
          0
        );

        tl.to(bgImageRef.current, { scale: 1.15, y: '-5%', ease: 'none' }, 0);

        tl.to(contentRef.current, { opacity: 0.4, y: '-20px', ease: 'power1.out' }, 0.5);
      });
    }, mainContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={mainContainerRef}
      // svh = the height you can actually see on a phone (100vh includes the hidden address bar)
      className="relative h-screen supports-[height:100svh]:h-[100svh] min-h-[560px] w-full bg-slate-950 overflow-hidden font-sans"
    >
      <div
        ref={heroCardRef}
        // (removed transition-all: a CSS transition on top of GSAP made the scroll animation laggy)
        className="relative h-full w-full overflow-hidden bg-slate-950"
      >
        {/* Background visual */}
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <img
            ref={bgImageRef}
            src={`${HERO_IMG}&w=1280`}
            srcSet={`${HERO_IMG}&w=800 800w, ${HERO_IMG}&w=1280 1280w, ${HERO_IMG}&w=2200 2200w`}
            sizes="100vw"
            alt="Modern luxury villa with a swimming pool at dusk"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-center brightness-[0.85] contrast-[1.08]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
        </div>

        {/* Foreground content */}
        <div
          ref={contentRef}
          // pb-24 on phones keeps the stats card clear of the floating WhatsApp button
          className="relative z-20 flex h-full flex-col px-5 pb-24 pt-20 sm:px-6 sm:pt-24 sm:pb-8 lg:px-12"
        >
          {/* Top badges */}
          <div className="flex justify-between items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-slate-900/60 px-4 py-1.5 text-xs font-mono text-amber-300 backdrop-blur-xl shadow-md">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Luxury Short-Lets & Concierge</span>
            </div>

            <div className="hidden sm:flex items-center gap-2.5 text-xs font-mono text-slate-300 bg-slate-950/40 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>Executive Protection Included</span>
            </div>
          </div>

          {/* Headline + CTA: sits at the bottom on phones (image shows above), centred on larger screens */}
          <div className="mt-auto sm:my-auto max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 stroke-none" />
                ))}
              </div>
              <span className="text-xs font-mono text-slate-300">5,000+ satisfied visitors</span>
            </div>

            <h1 className="text-[2.4rem] font-serif leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl drop-shadow-2xl">
              Where Every Stay <br />
              <span className="font-light italic text-slate-200">
                Feels <span className="text-yellow-400 font-serif not-italic">Effortlessly</span> Elevated
              </span>
            </h1>

            <div className="pt-1">
              <button
                onClick={onBookClick}
                className="group inline-flex items-center gap-3 rounded-full bg-yellow-400 px-6 py-3 text-xs font-mono font-bold text-slate-950 backdrop-blur-md transition-all hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-500/20 cursor-pointer"
              >
                <span>Book a stay</span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-yellow-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </button>
            </div>
          </div>

          {/* Stats strip + testimonial */}
          <div className="shrink-0 flex items-end justify-between pt-6 sm:pt-2">
            <div className="flex w-full sm:w-auto items-center justify-around sm:justify-start gap-6 bg-slate-950/60 p-3.5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-xl">
              <div>
                <div className="font-serif text-xl font-bold text-white sm:text-2xl">24/7</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  Concierge On Call
                </div>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <div className="font-serif text-xl font-bold text-white sm:text-2xl">5-STAR</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  Bespoke Service
                </div>
              </div>
            </div>

            <div className="hidden md:flex max-w-xs items-center gap-3 rounded-2xl border border-white/15 bg-slate-900/70 p-3 backdrop-blur-2xl">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                alt="Sophia L."
                loading="lazy"
                className="h-9 w-9 rounded-xl object-cover border border-white/20"
              />
              <div className="space-y-0.5">
                <p className="text-[13px] text-slate-200">
                  &quot;Private chef and close security detail made our trip flawless.&quot;
                </p>
                <span className="block font-mono text-[9px] font-bold uppercase text-yellow-400">
                  — Sophia L., Guest
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}