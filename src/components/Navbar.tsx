'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, PhoneCall } from 'lucide-react';

interface NavbarProps {
  onServicesClick?: () => void;
  onRoomsClick?: () => void;
  onContactClick?: () => void;
}

export default function Navbar({ onServicesClick, onRoomsClick, onContactClick }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleServicesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (onServicesClick) {
      onServicesClick();
    } else {
      document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRoomsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (onRoomsClick) {
      onRoomsClick();
    } else {
      document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (onContactClick) {
      onContactClick();
    } else {
      document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 py-3 shadow-lg'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <a
          href="#"
          onClick={handleHomeClick}
          className="text-xl sm:text-2xl font-serif font-bold tracking-wide text-white flex items-center"
        >
          <span className="text-yellow-400">Sunshine</span> Concierge<span className="text-yellow-400">.</span>
        </a>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-mono tracking-widest text-slate-300">
          <a href="#" onClick={handleHomeClick} className="transition-colors hover:text-cyan-400">
            Home
          </a>
          <a href="#services-section" onClick={handleServicesClick} className="transition-colors hover:text-cyan-400">
            Services
          </a>
          <a href="#listings-section" onClick={handleRoomsClick} className="transition-colors hover:text-cyan-400">
            Rooms
          </a>
        </nav>

        <div className="hidden md:block">
          <button
            onClick={handleContactClick}
            className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-yellow-500/40 text-yellow-400 hover:bg-cyan-500 hover:text-slate-950 transition font-mono text-xs font-bold flex items-center gap-2"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Get in Touch</span>
          </button>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
          className="md:hidden p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 hover:text-white focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-slate-800/90 backdrop-blur-xl px-4 pt-4 pb-6 space-y-3">
          <nav className="flex flex-col space-y-3 font-mono text-sm text-slate-200">
            <a href="#" onClick={handleHomeClick} className="px-3 py-2 rounded-lg hover:bg-slate-900 transition">
              Home
            </a>
            <a href="#services-section" onClick={handleServicesClick} className="px-3 py-2 rounded-lg hover:bg-slate-900 transition">
              Services
            </a>
            <a href="#listings-section" onClick={handleRoomsClick} className="px-3 py-2 rounded-lg hover:bg-slate-900 text-cyan-400 font-semibold transition">
              Rooms / Listings
            </a>
          </nav>
          <div className="pt-2">
            <button
              onClick={handleContactClick}
              className="w-full py-3 rounded-xl bg-yellow-500 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Contact Concierge Desk</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}