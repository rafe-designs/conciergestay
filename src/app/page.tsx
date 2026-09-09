'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import HeroLanding from '@/components/HeroLanding';
import ListingDetailModal from '@/components/ListingDetailModal';
import { LISTINGS, Listing } from '@/lib/cateringData';
import Footer from '@/components/Footer';
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton';
import ServicesSection from '@/components/ServicesSection';
import { MapPin, Sparkles, ArrowRight, ShieldCheck, Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'penthouse' | 'villa' | 'mansion'>('all');

  // Modal State
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // DevTools Protection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u') ||
        (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) ||
        (e.metaKey && e.key === 'u')
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const listingsArray = Object.values(LISTINGS || {});

  const filteredListings = listingsArray.filter((listing) => {
    const searchLower = searchTerm.trim().toLowerCase();
    
    // Search matching logic (title, location, or description)
    const matchesSearch =
      !searchLower ||
      listing.title.toLowerCase().includes(searchLower) ||
      listing.location.toLowerCase().includes(searchLower) ||
      (listing as any).description?.toLowerCase().includes(searchLower);

    // Type filter matching logic
    const filterLower = selectedFilter.toLowerCase();
    const matchesType =
      selectedFilter === 'all' ||
      listing.title.toLowerCase().includes(filterLower) ||
      (listing as any).type?.toLowerCase().includes(filterLower) ||
      (listing as any).category?.toLowerCase().includes(filterLower) ||
      (listing as any).description?.toLowerCase().includes(filterLower);

    return matchesSearch && matchesType;
  });

  const handleScrollToServices = () => {
    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToListings = () => {
    document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectListing = (listingId: string) => {
    router.push(`/listings/${listingId}`);
  };

  const handleOpenModal = (listing: Listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      if (res.ok) {
        setSubmitStatus('success');
        setContactForm({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 select-none">
      {/* Global Navbar */}
      <Navbar 
        onServicesClick={handleScrollToServices} 
        onRoomsClick={handleScrollToListings} 
        onContactClick={handleScrollToContact} 
      />

      <main className="flex-grow">
        <HeroLanding onBookClick={handleScrollToListings} />

        {/* Services Section */}
        <ServicesSection />

        {/* Listings Section */}
        <section id="listings-section" className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8 md:space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-6 md:pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-yellow-400 uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Curated Portfolio</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-extrabold text-white">
                Explore Luxury Stays
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Showing {filteredListings.length} of {listingsArray.length} exclusive residences
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="flex bg-slate-900/80 border border-slate-800 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                {(['all', 'penthouse', 'villa', 'mansion'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-mono capitalize transition whitespace-nowrap ${
                      selectedFilter === filter
                        ? 'bg-yellow-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid View */}
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredListings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectListing(item.id)}
                  className="group cursor-pointer bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl hover:border-slate-700 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-cyan-950/20 active:scale-[0.99]"
                >
                  <div>
                    <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                      <img
                        src={item.heroImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                      <span className="absolute bottom-3 left-3 text-[10px] font-mono font-bold bg-slate-950/80 border border-yellow-500/40 text-yellow-300 px-3 py-1 rounded-full backdrop-blur-md">
                        VERIFIED RESIDENCE
                      </span>
                      <div className="absolute top-3 right-3 bg-slate-950/80 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl text-right">
                        <span className="text-xs font-mono font-extrabold text-yellow-400">
                          ₦{item.pricePerNight.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">/ night</span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono mb-1">
                          <MapPin className="h-3 w-3 text-yellow-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-serif font-bold text-white group-hover:text-yellow-300 transition line-clamp-1">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {item.features?.slice(0, 3).map((feat: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono bg-slate-950/80 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg"
                          >
                            ⚡ {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 pt-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectListing(item.id);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 font-mono text-xs font-bold py-3.5 rounded-2xl transition group/btn min-h-[44px]"
                    >
                      <span>RESERVE RESIDENCE</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-900/20 border border-slate-800 rounded-3xl space-y-3">
              <p className="text-sm font-mono text-slate-400">No residences found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('all');
                }}
                className="text-xs font-mono text-cyan-400 hover:underline"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>

        {/* Contact Form Section */}
        <section id="contact-section" className="relative z-30 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-yellow-400 uppercase tracking-widest bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-full">
                <Mail className="h-3.5 w-3.5" />
                <span>Concierge Desk</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">Contact Our Team</h3>
              <p className="text-xs sm:text-sm font-sans text-slate-400 max-w-md mx-auto">
                Have questions or need a bespoke extended booking? Send us a direct inquiry.
              </p>
            </div>

            {submitStatus === 'success' && (
              <div className="p-4 rounded-2xl bg-yellow-950/40 border border-yellow-500/40 text-yellow-300 text-xs font-mono flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-yellow-400" />
                <span>Your inquiry has been sent to our concierge desk. We will reach out shortly!</span>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                <span>Failed to dispatch inquiry. Please check your network or try again later.</span>
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 block">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 block">Message / Request *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail your requirements, dates, or specific concierge preferences..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-yellow-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-yellow-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Message to Desk</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        <ListingDetailModal
          listing={selectedListing}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </main>

      <Footer />
      <WhatsAppFloatingButton />
    </div>
  );
}