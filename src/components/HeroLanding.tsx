'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, ArrowUpRight, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface HeroLandingProps {
  onBookClick?: () => void;
}

export default function HeroLanding({ onBookClick }: HeroLandingProps) {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for smooth scroll pinning and frame shrink effect
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

      // 1. Shrink Hero Container into a floating rounded card
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

      // 2. Parallax zoom effect on background villa image
      tl.to(
        bgImageRef.current,
        {
          scale: 1.15,
          y: '-5%',
          ease: 'none',
        },
        0
      );

      // 3. Smooth fade & slide for section transition
      tl.to(
        contentRef.current,
        {
          opacity: 0.4,
          y: '-20px',
          ease: 'power1.out',
        },
        0.5
      );
    }, mainContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={mainContainerRef}
      className="relative h-screen w-full bg-slate-950 overflow-hidden font-sans"
    >
      {/* Outer Pin Container */}
      <div
        ref={heroCardRef}
        className="relative h-full w-full overflow-hidden bg-slate-950 transition-all duration-300"
      >
        {/* Background Visual (Warm Architectural Villa) */}
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <img
            ref={bgImageRef}
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2200"
            alt="Sunshine Luxury Villa"
            className="h-full w-full object-cover object-center brightness-[0.85] contrast-[1.08] transition-transform"
          />

          {/* Cinematic Dusk Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
        </div>

        {/* Foreground Hero Viewport Layout */}
        <div
          ref={contentRef}
          className="relative z-20 flex h-full flex-col justify-between px-6 pb-6 pt-24 lg:px-12 lg:pb-8"
        >
          {/* Top Badges */}
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

          {/* Main Headline & Clean CTA */}
          <div className="my-auto max-w-2xl space-y-4 pt-2">
            {/* Stars */}
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 stroke-none" />
                ))}
              </div>
              <span className="text-xs font-mono text-slate-300">
                5,000+ satisfied visitors
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-serif leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl drop-shadow-2xl">
              Where Every Stay <br />
              <span className="font-light italic text-slate-200">
                Feels <span className="text-yellow-400 font-serif not-italic">Effortlessly</span> Elevated
              </span>
            </h1>

            

            {/* Main Book a Stay Button */}
            <div className="pt-2">
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

          {/* Bottom Floating Stats Strip */}
          <div className="shrink-0 flex items-end justify-between pt-2">
            <div className="flex items-center gap-6 bg-slate-950/60 p-3.5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-xl">
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

            {/* Testimonial Box */}
            <div className="hidden md:flex max-w-xs items-center gap-3 rounded-2xl border border-white/15 bg-slate-900/70 p-3 backdrop-blur-2xl">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                alt="Sophia L."
                className="h-9 w-9 rounded-xl object-cover border border-white/20"
              />
              <div className="space-y-0.5">
                <p className="text-[13px]  text-slate-200">
                  "Private chef and close security detail made our trip flawless."
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