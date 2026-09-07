'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  ChefHat, 
  ShieldCheck, 
  Car, 
  Sparkles, 
  ConciergeBell, 
  Clock, 
  Check, 
  ArrowRight, 
  X 
} from 'lucide-react';

interface ServiceDetail {
  id: string;
  title: string;
  tagline: string;
  icon: React.ReactNode;
  heroImage: string;
  description: string;
  features: string[];
}

const SERVICES: ServiceDetail[] = [
  {
    id: 'luxury-stays',
    title: 'Luxury Short-Let Stays',
    tagline: 'Handpicked Penthouses & Exclusive Villas',
    icon: <Building2 className="w-6 h-6 text-yellow-400" />,
    heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
    description: 'Fully furnished, high-security luxury apartments and penthouses located in prime districts. Optimized with high-speed fiber internet, uninterrupted 24/7 power, and automated smart-home systems.',
    features: [
      '24/7 Uninterrupted Power & High-Speed Wi-Fi',
      'Smart Home Automation & Keyless Access',
      'Prime Locations in Business & Entertainment Hubs',
      'Regular Housekeeping & Linen Refresh'
    ]
  },
  {
    id: 'private-chef',
    title: 'Private Chef & Catering',
    tagline: 'Gourmet Culinary Experiences On-Demand',
    icon: <ChefHat className="w-6 h-6 text-yellow-400" />,
    heroImage: 'https://plus.unsplash.com/premium_photo-1764202468993-16aba84bcc3d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjR8fGJsYWNrJTIwY2hlZiUyMGNvb2tpbmd8ZW58MHx8MHx8fDA%3Dauto=format&fit=crop&q=80&w=1200',
    description: 'Indulge in tailored culinary creations crafted directly in your suite kitchen by professional executive chefs. From daily meal prep to private multi-course dinner parties.',
    features: [
      'Bespoke Daily Meal Plans & Dietary Customization',
      'Multi-Course Fine Dining Private Dinners',
      'Cocktail & Beverage Curation Services',
      'Fresh Organic Ingredients Sourced Daily'
    ]
  },
  {
    id: 'vip-security',
    title: 'Close Protection & Security',
    tagline: 'Discreet Security & Armed Escorts',
    icon: <ShieldCheck className="w-6 h-6 text-yellow-400" />,
    heroImage: 'https://images.unsplash.com/photo-1618371731836-2b9bff9ac72a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJpdmF0ZSUyMGJvZHlndWFyZHxlbnwwfHwwfHx8MA%3D%3D?auto=format&fit=crop&q=80&w=1200',
    description: 'Your safety is paramount. We provide professional close protection operatives and armed escort vehicles for airport transfers, high-profile movements, and personal security during your stay.',
    features: [
      'Trained Close Protection Officers (CPOs)',
      'Armed Mobile Escort Vehicles',
      'Discreet Executive Protection',
      '24/7 Security Monitoring & Emergency Response'
    ]
  },
  {
    id: 'executive-chauffeur',
    title: 'Executive Chauffeur & Fleet',
    tagline: 'Luxury SUV & Sedan Ground Mobility',
    icon: <Car className="w-6 h-6 text-yellow-400" />,
    heroImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200',
    description: 'Travel in ultimate comfort. Our fleet of pristine SUVs, armored vehicles, and luxury sedans comes with professional, vetted chauffeurs dedicated to your itinerary.',
    features: [
        'Airport Pickups & Drop-offs',
      'Pristine Fleet of Armored & Luxury SUVs',
      'Vetted Professional Chauffeurs',
      'City Tours & Inter-State Transit',
    ]
  },
  {
    id: 'bespoke-concierge',
    title: '24/7 Bespoke Concierge',
    tagline: 'Personalized Lifestyle & Administrative Support',
    icon: <ConciergeBell className="w-6 h-6 text-yellow-400" />,
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200',
    description: 'From last-minute VIP restaurant reservations to errand execution, house keeping and laundry, our round-the-clock concierge team handles every single detail of your itinerary.',
    features: [
      'VIP Table & Event Access',
      'Personal Shopping & Errand Logistics',
      '24/7 Dedicated Desk Agent'
    ]
  },
  {
    id: 'wellness-spa',
    title: 'In-Suite Spa & Wellness',
    tagline: 'Private Massage & Holistic Treatments',
    icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
    heroImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200',
    description: 'Transform your apartment into a sanctuary. Unwind with licensed massage therapists, skincare specialists, and private yoga instructors delivered directly to your room.',
    features: [
      'Deep Tissue & Therapeutic Massages',
      'Private Yoga & Personal Trainer Sessions',
      'Organic Skin & Body Treatments',
      'All Professional Equipment Provided On-Site'
    ]
  }
];

export default function ServicesSection() {
  const [activeModalService, setActiveModalService] = useState<ServiceDetail | null>(null);

  return (
    <section id="services-section" className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-yellow-400 uppercase tracking-widest bg-yellow-950/40 border border-yellow-800/40 px-3.5 py-1 rounded-full">
          <Clock className="h-3.5 w-3.5" />
          <span>Elevated Hospitality</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-white">
          Our Premium Services
        </h2>
        <p className="text-xs sm:text-sm font-sans text-slate-400 leading-relaxed">
          Every stay is backed by a full spectrum of luxury amenities and personalized concierge management designed to make travel completely frictionless.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {SERVICES.map((service) => (
          <div
            key={service.id}
            onClick={() => setActiveModalService(service)}
            className="group cursor-pointer bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-cyan-950/20 active:scale-[0.99]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl group-hover:border-cyan-500/50 transition">
                  {service.icon}
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-950 text-yellow-400 px-2.5 py-1 rounded-full border border-slate-800">
                  24/7 AVAILABLE
                </span>
              </div>

              <div>
                <h3 className="text-lg font-serif font-bold text-white group-hover:text-yellow-300 transition">
                  {service.title}
                </h3>
                <p className="text-xs font-mono text-yellow-400/80 mt-0.5">
                  {service.tagline}
                </p>
              </div>

              <p className="text-xs font-sans text-slate-400 leading-relaxed line-clamp-3">
                {service.description}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-800/60 mt-6 flex items-center justify-between text-xs font-mono text-yellow-400 group-hover:text-yellow-300">
              <span>EXPLORE DETAILS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Service Modal */}
      {activeModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Hero Banner */}
            <div className="relative h-48 sm:h-60 w-full">
              <img
                src={activeModalService.heroImage}
                alt={activeModalService.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <button
                onClick={() => setActiveModalService(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 pb-8 space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-mono text-yellow-400 uppercase tracking-widest block">
                  {activeModalService.tagline}
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  {activeModalService.title}
                </h3>
              </div>

              <p className="text-xs sm:text-sm font-sans text-slate-300 leading-relaxed">
                {activeModalService.description}
              </p>

              {/* Feature Checklist */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Key Service Highlights:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeModalService.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                      <Check className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      <span className="text-xs font-mono text-slate-200">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setActiveModalService(null);
                    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-mono text-xs font-bold rounded-2xl transition"
                >
                  REQUEST THIS SERVICE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}