// ====================================================================
// FILE 6 OF 6: BOOKING-SUCCESS PAGE
// PASTE INTO: app/booking-success/page.tsx
// REPLACE the whole existing file with this one.
// ====================================================================

'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Copy, Home, User, Mail, Phone, Loader2 } from 'lucide-react';

interface BookingPayload {
  id?: string;
  listingId?: string;
  transactionRef?: string;
  paymentReference?: string;
  apartmentTitle?: string;
  checkIn?: string;
  checkOut?: string;
  grandTotal?: number;
  customerName?: string;
  customerEmail?: string;
  phone?: string;
  phoneNumber?: string;
  guestInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    guests?: number;
  };
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  // Interswitch redirects back with ?txnref=...&resp=00&desc=...
  const queryRef = searchParams.get('txnref') || searchParams.get('reference');
  const gatewayResp = searchParams.get('resp');
  const gatewayDesc = searchParams.get('desc');

  const [booking, setBooking] = useState<BookingPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'pending' | 'failed'>('idle');

  // Ref guard to guarantee the fetch only executes once per lifecycle
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    let currentBooking: BookingPayload | null = null;

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('booking_confirmation_payload');
      if (stored) {
        try {
          currentBooking = JSON.parse(stored);
          setBooking(currentBooking);
        } catch (e) {
          console.error('Error parsing booking payload', e);
        }
      }
    }

    // Only trust the saved draft if it belongs to THIS transaction.
    if (currentBooking && queryRef && currentBooking.transactionRef !== queryRef) {
      currentBooking = null;
      setBooking(null);
    }

    const transactionRef = queryRef || currentBooking?.transactionRef || currentBooking?.id;

    // The gateway already told us it failed or was cancelled: no need to verify.
    if (gatewayResp && gatewayResp !== '00') {
      setSyncStatus('failed');
      return;
    }

    // Prevent double invocation
    if (transactionRef && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      setSyncStatus('syncing');

      fetch('/api/bookings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionRef }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));

          if (res.ok && data?.booking) {
            setSyncStatus('synced');
            const b = data.booking;
            setBooking((prev) => ({
              ...prev,
              ...b,
              phone: b.phone || prev?.guestInfo?.phone || prev?.phone || '',
              guestInfo: prev?.guestInfo,
            }));

            // Only now is it safe to show it in the user's booking list.
            try {
              const confirmed = { ...(currentBooking || {}), ...b, status: 'Successful' };
              const list = JSON.parse(localStorage.getItem('user_bookings') || '[]');
              const withoutDup = list.filter((x: any) => x.transactionRef !== transactionRef);
              localStorage.setItem('user_bookings', JSON.stringify([confirmed, ...withoutDup]));
              localStorage.setItem('booking_confirmation_payload', JSON.stringify(confirmed));
            } catch {}
          } else if (res.status === 402 || res.status === 400) {
            // Interswitch says not paid / amount mismatch.
            setSyncStatus('failed');
          } else {
            // 404 / 5xx / provider unreachable: unknown, let the user retry.
            setSyncStatus('pending');
          }
        })
        .catch((err) => {
          console.error('Verification request failed:', err);
          setSyncStatus('pending');
        });
    }
  }, [queryRef]);

  const rawReference =
    queryRef ||
    booking?.transactionRef ||
    booking?.paymentReference ||
    booking?.id ||
    'CS_REF_PENDING';

  const referenceId = rawReference.replace(/^VACEUP_/i, 'CS_');

  const handleCopyRef = () => {
    if (!referenceId) return;
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const displayPhone =
    booking?.phone ||
    booking?.phoneNumber ||
    booking?.guestInfo?.phone ||
    booking?.guestInfo?.phoneNumber ||
    'N/A';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full border mb-2 ${
            syncStatus === 'failed'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          }`}
        >
          {syncStatus === 'failed' ? <XCircle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
          {syncStatus === 'synced' && 'Reservation Confirmed!'}
          {(syncStatus === 'idle' || syncStatus === 'syncing') && 'Verifying your payment...'}
          {syncStatus === 'pending' && 'Payment Verification Pending'}
          {syncStatus === 'failed' && (gatewayResp && gatewayResp !== '00' ? 'Payment Not Completed' : 'Payment Not Verified')}
        </h1>
        <p className="text-xs font-mono text-slate-400">
          {syncStatus === 'synced' && 'Payment received. Your concierge experience is officially scheduled.'}
          {(syncStatus === 'idle' || syncStatus === 'syncing') && 'Please do not close this page.'}
          {syncStatus === 'pending' &&
            'We could not confirm your payment yet. If you were debited, keep your reference and refresh this page, or contact support.'}
          {syncStatus === 'failed' &&
            (gatewayResp && gatewayResp !== '00'
              ? `Payment was not completed${gatewayDesc ? ` (${gatewayDesc})` : ''}. You have not been charged for this booking. You can go back and try again.`
              : 'We could not verify this payment. If you were debited, contact support with your reference below.')}
        </p>
        {syncStatus === 'pending' && (
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10"
          >
            Retry verification
          </button>
        )}
      </div>

      {/* Transaction Reference Box */}
      <div className="bg-slate-900 border border-yellow-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Transaction Reference
            </p>
            {syncStatus === 'syncing' && (
              <span className="text-[9px] font-mono text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/30 inline-flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verifying...
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="text-[9px] font-mono text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/30">
                Verified Backend
              </span>
            )}
            {(syncStatus === 'pending' || syncStatus === 'failed') && (
              <span className="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                {syncStatus === 'failed' ? 'Not Verified' : 'Verification Pending'}
              </span>
            )}
          </div>
          <p className="text-base font-mono font-bold text-yellow-400 mt-0.5">
            {referenceId}
          </p>
        </div>
        <button
          onClick={handleCopyRef}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10 transition cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          {copied ? 'Copied!' : 'Copy Ref'}
        </button>
      </div>

      {/* Booking Details Card */}
      {booking && syncStatus === 'synced' && (
        <div className="bg-slate-900/60 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-md text-xs font-mono">
          <h2 className="text-yellow-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
            <Home className="w-4 h-4" /> Accommodation & Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px]">PROPERTY</span>
              <span className="text-white font-semibold">{booking.apartmentTitle || 'Luxury Suite'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">DATES</span>
              <span className="text-yellow-400">
                {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] flex items-center gap-1">
                <User className="w-3 h-3" /> GUEST NAME
              </span>
              <span className="text-white">
                {booking.guestInfo?.fullName || booking.customerName || 'Valued Guest'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] flex items-center gap-1">
                <Mail className="w-3 h-3" /> EMAIL
              </span>
              <span className="text-white">
                {booking.guestInfo?.email || booking.customerEmail || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] flex items-center gap-1">
                <Phone className="w-3 h-3 text-yellow-400" /> PHONE NUMBER
              </span>
              <span className="text-amber-400 font-semibold">
                {displayPhone}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">GUESTS</span>
              <span className="text-white">{booking.guestInfo?.guests || (booking as any).guestCount || 1} Person(s)</span>
            </div>
          </div>

          {booking.grandTotal && (
            <div className="border-t border-white/10 pt-4 flex justify-between items-center text-sm">
              <span className="text-slate-400">Total Paid</span>
              <span className="text-yellow-400 font-serif font-bold text-lg">
                ₦{booking.grandTotal.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="pt-4 flex justify-center gap-3">
        {syncStatus === 'failed' && booking?.listingId && (
          <Link
            href={`/checkout/${booking.listingId}`}
            className="inline-flex items-center gap-2 px-6 py-3 text-xs font-mono font-bold border border-yellow-400 text-yellow-400 rounded-xl hover:bg-yellow-400/10 transition uppercase tracking-wider"
          >
            Try Again
          </Link>
        )}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-mono font-bold bg-yellow-400 text-slate-950 rounded-xl hover:bg-yellow-300 transition uppercase tracking-wider"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-12 flex items-center justify-center font-sans">
      <Suspense fallback={<div className="font-mono text-xs text-cyan-400">Loading receipt...</div>}>
        <BookingSuccessContent />
      </Suspense>
    </div>
  );
}