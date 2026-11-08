// ====================================================================
// FILE 6 OF 6: BOOKING-SUCCESS PAGE  (UPDATED: transfer-safe, auto-polling)
// PASTE INTO: app/booking-success/page.tsx
// REPLACE the whole existing file with this one.
// Needs the updated app/api/bookings/verify/route.ts (it returns 202 while a payment is still settling).
// ====================================================================

'use client';

import React, { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, Copy, Home, User, Mail, Phone, Loader2 } from 'lucide-react';

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

type SyncStatus = 'idle' | 'syncing' | 'waiting' | 'synced' | 'pending' | 'failed';

// Bank transfers settle AFTER the customer is sent back to this page, so "not paid yet" is normal.
// Check quickly at first, then more slowly, then stop and let the guest re-check manually.
const POLL_FAST_MS = 5_000;
const POLL_SLOW_MS = 15_000;
const FAST_WINDOW_MS = 3 * 60_000;
const MAX_WINDOW_MS = 12 * 60_000;

// Interswitch response code Z6 = customer cancelled. Every other non-00 code can still change.
const GATEWAY_FINAL_FAIL = new Set(['Z6']);

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  // Interswitch redirects back with ?txnref=...&resp=00&desc=...
  const queryRef = searchParams.get('txnref') || searchParams.get('reference');
  const gatewayResp = searchParams.get('resp');
  const gatewayDesc = searchParams.get('desc');
  const gatewayCancelled = !!gatewayResp && GATEWAY_FINAL_FAIL.has(gatewayResp);

  const [booking, setBooking] = useState<BookingPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [gatewayNote, setGatewayNote] = useState<{ code?: string; description?: string } | null>(null);

  const runIdRef = useRef(0); // bumping this cancels any in-flight polling loop
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRefRef = useRef<string>('');
  const draftRef = useRef<BookingPayload | null>(null);

  const stopPolling = useCallback(() => {
    runIdRef.current += 1;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startVerification = useCallback(
    (transactionRef: string) => {
      stopPolling();
      const runId = runIdRef.current;
      const startedAt = Date.now();
      setSyncStatus('syncing');

      const attempt = async () => {
        if (runId !== runIdRef.current) return;

        try {
          const res = await fetch('/api/bookings/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionRef }),
          });
          const data = await res.json().catch(() => ({}));
          if (runId !== runIdRef.current) return;

          if (res.ok && data?.booking) {
            const b = data.booking;
            setSyncStatus('synced');
            setBooking((prev) => ({
              ...prev,
              ...b,
              phone: b.phone || prev?.guestInfo?.phone || prev?.phone || '',
              guestInfo: prev?.guestInfo,
            }));

            // Only now is it safe to show it in the user's booking list.
            try {
              const confirmed = { ...(draftRef.current || {}), ...b, transactionRef, status: 'Successful' };
              const list = JSON.parse(localStorage.getItem('user_bookings') || '[]');
              const withoutDup = list.filter((x: any) => x.transactionRef !== transactionRef);
              localStorage.setItem('user_bookings', JSON.stringify([confirmed, ...withoutDup]));
              localStorage.setItem('booking_confirmation_payload', JSON.stringify(confirmed));
            } catch {}
            return;
          }

          if (data?.code || data?.description) {
            setGatewayNote({ code: data.code, description: data.description });
          }

          // Definitive answers only: bad reference, cancelled, or the 30-minute payment window is over.
          if (res.status === 400 || (res.status === 402 && data?.final)) {
            setSyncStatus('failed');
            return;
          }
          // Anything else (202 still settling, 404, 5xx, provider down) is "not yet": keep checking.
        } catch (err) {
          console.error('Verification request failed:', err);
          if (runId !== runIdRef.current) return;
        }

        const elapsed = Date.now() - startedAt;
        if (elapsed >= MAX_WINDOW_MS) {
          setSyncStatus('pending');
          return;
        }
        setSyncStatus('waiting');
        timerRef.current = setTimeout(attempt, elapsed < FAST_WINDOW_MS ? POLL_FAST_MS : POLL_SLOW_MS);
      };

      void attempt();
    },
    [stopPolling]
  );

  useEffect(() => {
    let draft: BookingPayload | null = null;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('booking_confirmation_payload');
        if (stored) draft = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing booking payload', e);
      }
    }

    // Only trust the saved draft if it belongs to THIS transaction.
    if (draft && queryRef && draft.transactionRef !== queryRef) draft = null;

    draftRef.current = draft;
    setBooking(draft);

    const transactionRef = queryRef || draft?.transactionRef || draft?.id || '';
    activeRefRef.current = transactionRef;

    // The customer explicitly cancelled on the gateway: nothing to wait for.
    if (gatewayCancelled) {
      setSyncStatus('failed');
      return;
    }

    if (!transactionRef) {
      setSyncStatus('failed');
      return;
    }

    startVerification(transactionRef);
    return stopPolling;
  }, [queryRef, gatewayCancelled, startVerification, stopPolling]);

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

  const handleCheckAgain = () => {
    if (activeRefRef.current) startVerification(activeRefRef.current);
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

  const inProgress = syncStatus === 'idle' || syncStatus === 'syncing' || syncStatus === 'waiting';

  const iconTone =
    syncStatus === 'failed'
      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border mb-2 ${iconTone}`}>
          {syncStatus === 'failed' && <XCircle className="w-10 h-10" />}
          {syncStatus === 'synced' && <CheckCircle2 className="w-10 h-10" />}
          {inProgress && <Loader2 className="w-10 h-10 animate-spin" />}
          {syncStatus === 'pending' && <Clock className="w-10 h-10" />}
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
          {syncStatus === 'synced' && 'Reservation Confirmed!'}
          {(syncStatus === 'idle' || syncStatus === 'syncing') && 'Verifying your payment...'}
          {syncStatus === 'waiting' && 'Waiting for payment confirmation'}
          {syncStatus === 'pending' && 'Payment Not Confirmed Yet'}
          {syncStatus === 'failed' && (gatewayCancelled ? 'Payment Cancelled' : 'Payment Not Verified')}
        </h1>

        <p className="text-xs font-mono text-slate-400">
          {syncStatus === 'synced' && 'Payment received. Your concierge experience is officially scheduled.'}
          {(syncStatus === 'idle' || syncStatus === 'syncing') && 'Please do not close this page.'}
          {syncStatus === 'waiting' &&
            'We have not received confirmation from your bank yet. Bank transfers can take a few minutes. Keep this page open, we check automatically. Please do not pay again.'}
          {syncStatus === 'pending' &&
            'We still have not received confirmation. If you were debited, your booking will be confirmed automatically once the payment settles. Keep your reference below and contact support if it does not. Please do not pay again.'}
          {syncStatus === 'failed' &&
            (gatewayCancelled
              ? `Payment was cancelled${gatewayDesc ? ` (${gatewayDesc})` : ''}. You can go back and try again.`
              : 'We could not verify this payment. If you were debited, contact support with your reference below and do not pay again.')}
        </p>

        {gatewayNote?.code && syncStatus !== 'synced' && (
          <p className="text-[10px] font-mono text-slate-500">
            Bank status: {gatewayNote.code}
            {gatewayNote.description ? ` - ${gatewayNote.description}` : ''}
          </p>
        )}

        {syncStatus === 'pending' && (
          <button
            onClick={handleCheckAgain}
            className="mt-2 px-4 py-2 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10"
          >
            Check again
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
            {(syncStatus === 'syncing' || syncStatus === 'waiting') && (
              <span className="text-[9px] font-mono text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/30 inline-flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> {syncStatus === 'waiting' ? 'Waiting...' : 'Verifying...'}
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="text-[9px] font-mono text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/30">
                Verified Backend
              </span>
            )}
            {(syncStatus === 'pending' || syncStatus === 'failed') && (
              <span className="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                {syncStatus === 'failed' ? 'Not Verified' : 'Not Confirmed Yet'}
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