'use client';

import React, { useState } from 'react';

export default function Footer() {
  const [modalContent, setModalContent] = useState<'terms' | 'cancellation' | 'privacy' | null>(null);

  const closeModal = () => setModalContent(null);

  return (
    <>
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          {/* Brand & Copyright */}
          <div className="flex items-center gap-2">
            <span className="text-white font-serif font-bold text-sm tracking-wide">
              <span className="text-yellow-400">Sunshine</span>Concierge<span className="text-yellow-400">.</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          {/* Social Handles */}
          <div className="flex items-center gap-4 text-slate-400">
            {/* Instagram */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="Instagram">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* X (Twitter) */}
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="X">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          {/* Legal Links (Triggers Modals) */}
          <div className="flex items-center gap-6 text-slate-400">
            <button 
              onClick={() => setModalContent('privacy')} 
              className="hover:text-yellow-400 transition cursor-pointer bg-transparent border-none p-0 text-xs font-mono"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setModalContent('cancellation')} 
              className="hover:text-yellow-400 transition cursor-pointer bg-transparent border-none p-0 text-xs font-mono"
            >
              Cancellation Policy
            </button>
            <button 
              onClick={() => setModalContent('terms')} 
              className="hover:text-yellow-400 transition cursor-pointer bg-transparent border-none p-0 text-xs font-mono"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Policy Modal Overlay */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 text-slate-300 font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white capitalize font-mono tracking-wide">
                {modalContent === 'terms' && 'Terms of Service'}
                {modalContent === 'cancellation' && 'Cancellation & Refund Policy'}
                {modalContent === 'privacy' && 'Privacy Policy'}
              </h3>
              <button 
                onClick={closeModal} 
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3 leading-relaxed text-slate-400 font-sans">
              {modalContent === 'terms' && (
                <>
                  <p><strong className="text-white">Check-in / Check-out:</strong> Standard check-in is at 3:00 PM; check-out is at 11:00 AM. Early check-in or late check-out must be requested in advance.</p>
                  <p><strong className="text-white">Guest Identification:</strong> All staying guests must provide a valid government-issued ID prior to check-in for security and verification purposes.</p>
                  <p><strong className="text-white">Property Protection & Conduct:</strong> Guests are responsible for any intentional damage caused to the property, suites, or amenities during their stay. Illegal activities or unapproved party hosting are strictly prohibited.</p>
                </>
              )}

              {modalContent === 'cancellation' && (
                <>
                  <p><strong className="text-white">Full Refund:</strong> Cancellations made <strong className="text-white">14 days or more</strong> before the scheduled check-in date are eligible for a 100% refund (less standard processing fees).</p>
                  <p><strong className="text-white">Partial Refund:</strong> Cancellations made between <strong className="text-white">7 to 13 days</strong> prior to check-in will receive a 50% refund.</p>
                  <p><strong className="text-white">Peak Period Non-Refundable Policy:</strong> Cancellations made <strong className="text-white">less than 7 days</strong> before check-in or no-shows during peak holiday periods (<strong className="text-white">December 15 – January 15</strong>) are non-refundable due to reserved allocations and high holiday demand.</p>
                  <p><strong className="text-white">Concierge & Add-on Services:</strong> Security details, chauffeur services, and private dining bookings canceled within 48 hours of service start time are non-refundable.</p>
                </>
              )}

              {modalContent === 'privacy' && (
                <>
                  <p><strong className="text-white">Data Collection:</strong> Sunshine Concierge collects guest names, phone numbers, email addresses, and identification data solely for booking management and security verification.</p>
                  <p><strong className="text-white">Payment Security:</strong> All financial transactions are processed securely through certified payment processors (Paystack and Flutterwave). We do not store sensitive credit card credentials on our servers.</p>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-right">
              <button 
                onClick={closeModal} 
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-xs rounded-xl cursor-pointer transition font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}