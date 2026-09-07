'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function WhatsAppFloatingButton() {
  const whatsappNumber = "2348000000000"; // Replace with your target WhatsApp phone number
  const whatsappMessage = encodeURIComponent("Hello ConciergeStay, I would like to inquire about a booking.");

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold py-3 px-4 rounded-full shadow-2xl shadow-emerald-500/30 border border-emerald-300/40 hover:scale-105 active:scale-95 transition-all duration-300 group"
    >
      {/* WhatsApp SVG Icon */}
      <svg
        className="w-5 h-5 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.524 5.837L0 24l6.335-1.497C8.01 23.468 9.948 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.834 0-3.551-.486-5.044-1.332l-.361-.205-3.75.886.983-3.655-.235-.374A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
      <span className="hidden sm:inline">Chat with Us</span>
    </a>
  );
}