'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Star, ArrowUpRight } from 'lucide-react';

interface HeroLandingProps {
  onBookClick?: () => void;
}

export default function HeroLanding({ onBookClick }: HeroLandingProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const borderRadius = useTransform(scrollYProgress, [0, 1], ['0px', '40px']);
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <div ref={containerRef} className="relative h-[120vh] w-full bg-slate-950">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.div
          style={{ scale, opacity, borderRadius }}
          className="relative flex h-full w-full flex-col overflow-hidden bg-slate-950 shadow-2xl transition-all duration-100 ease-out pt-20"
        >
          <motion.div style={{ y: yBg }} className="absolute inset-0 h-[120%] w-full">
            <img
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=2000"
              alt="Luxury Resort"
              className="h-full w-full object-cover object-center brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60" />
            <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]" />
          </motion.div>

          <div className="relative z-20 flex flex-1 flex-col justify-between min-h-0 px-6 pb-6 pt-6 lg:px-12 lg:pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col justify-center my-auto max-w-2xl space-y-3 sm:space-y-4 lg:space-y-5"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 stroke-none sm:h-4 sm:w-4" />
                  ))}
                </div>
                <span className="text-[11px] font-mono tracking-wide text-slate-300 sm:text-xs">
                  5,000+ satisfied visitors
                </span>
              </div>

              <h1 className="text-4xl font-serif leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                Where Every Stay <br />
                <span className="font-light italic text-slate-200">Feels Effortlessly Elevated</span>
              </h1>

              <p className="max-w-md font-sans text-xs font-light leading-relaxed text-slate-300 sm:text-sm">
                Our dedication to excellence ensures every moment is crafted with care.
              </p>

              <div className="pt-1">
                <button
                  onClick={onBookClick}
                  className="group flex items-center gap-3 rounded-full bg-white/95 px-5 py-2.5 text-xs font-mono font-bold text-slate-950 backdrop-blur-md transition-all hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 sm:px-6 sm:py-3"
                >
                  <span>Book a stay</span>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-white transition group-hover:bg-slate-950 sm:h-6 sm:w-6">
                    <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </div>
                </button>
              </div>
            </motion.div>

            <div className="shrink-0 flex flex-col gap-4 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-6 sm:gap-8"
              >
                <div>
                  <div className="font-serif text-xl text-white sm:text-2xl lg:text-3xl">24/7</div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400 sm:text-[10px]">
                    concierge on call
                  </div>
                </div>
                <div className="h-7 w-px bg-white/15" />
                <div>
                  <div className="font-serif text-xl text-white sm:text-2xl lg:text-3xl">5-STAR</div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400 sm:text-[10px]">
                    personalized Service
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex max-w-sm items-center gap-3 rounded-xl border border-white/15 bg-slate-900/60 p-3 backdrop-blur-xl sm:gap-4 sm:rounded-2xl sm:p-3.5"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                  alt="Sophia L."
                  className="h-10 w-10 shrink-0 rounded-lg border border-white/20 object-cover sm:h-11 sm:w-11 sm:rounded-xl"
                />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-light italic leading-snug text-slate-200 sm:text-xs">
                    "The private chef and security services made our stay absolutely seamless. We're never going back to a regular apartment again!"
                  </p>
                  <span className="block font-mono text-[9px] font-bold uppercase text-slate-400 sm:text-[10px]">
                    — Sophia L., Guest
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}