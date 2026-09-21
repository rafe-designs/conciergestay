import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);

function sanitizeAddons(rawAddons: any): Record<string, any> {
  if (!rawAddons || typeof rawAddons !== 'object') return {};

  const sanitized: Record<string, any> = {};

  // Security Filter
  const sec = rawAddons.security || rawAddons.securityType || rawAddons.securityService;
  if (sec && !['None', 'No Additional Security', 'false'].includes(String(sec))) {
    sanitized.security = sec;
    if (rawAddons.securityCount || rawAddons.guards) {
      sanitized.securityCount = Number(rawAddons.securityCount || rawAddons.guards || 1);
    }
  }

  // Airport Transfer Filter with Fallback Auto-Parsing for Direction
  const airport = rawAddons.airport || rawAddons.airportTransfer;
  if (airport && !['None', 'No Airport Transfer', 'false'].includes(String(airport))) {
    sanitized.airport = airport;
    
    const explicitDirection = rawAddons.airportDirection || rawAddons.direction || rawAddons.tripType;
    if (explicitDirection) {
      sanitized.airportDirection = explicitDirection;
    } else {
      const stringVal = String(airport).toLowerCase();
      if (stringVal.includes('round trip') || stringVal.includes('round_trip')) {
        sanitized.airportDirection = 'round_trip';
      } else if (stringVal.includes('one way') || stringVal.includes('one_way')) {
        sanitized.airportDirection = 'one_way';
      }
    }
  }

  // Housekeeping Filter
  const hk = rawAddons.housekeeping || rawAddons.housekeepingService || rawAddons.housekeepingActive;
  if (hk && !['None', 'No Housekeeping Service', 'no', 'false'].includes(String(hk))) {
    sanitized.housekeeping = hk;
    if (rawAddons.housekeepingSchedule || rawAddons.frequency) {
      sanitized.housekeepingSchedule = rawAddons.housekeepingSchedule || rawAddons.frequency;
    }
  }

  // Chauffeur Filter
  const chauffeur = rawAddons.chauffeur || rawAddons.chauffeurService;
  if (chauffeur && !['None', 'No Chauffeur Service', 'false'].includes(String(chauffeur))) {
    sanitized.chauffeur = chauffeur;
  }

  // Laundry Filter
  const laundryObj = rawAddons.laundry && typeof rawAddons.laundry === 'object' ? rawAddons.laundry : {
    adult: Number(rawAddons.laundryAdult) || 0,
    kid: Number(rawAddons.laundryKid) || 0,
    suit: Number(rawAddons.laundrySuit) || 0,
  };
  const totalPcs = (Number(laundryObj.adult) || 0) + (Number(laundryObj.kid) || 0) + (Number(laundryObj.suit) || 0);
  if (totalPcs > 0) {
    sanitized.laundry = laundryObj;
  }

  // Beddings & Linen Filter
  let beddingsObj = rawAddons.beddings || rawAddons.linen;
  if (!beddingsObj || typeof beddingsObj !== 'object') {
    beddingsObj = {
      towels: rawAddons.beddingTowels || 'no',
      beddings: rawAddons.beddingBeddings || 'no',
      selection: rawAddons.beddingSelection || 'Standard'
    };
  }
  
  const towelsVal = String(beddingsObj.towels || '').toLowerCase();
  const beddingsVal = String(beddingsObj.beddings || '').toLowerCase();
  const selectionVal = String(beddingsObj.selection || '').toLowerCase();

  const hasActiveTowels = towelsVal === 'yes' || towelsVal === 'true' || towelsVal === '1' || (towelsVal !== 'no' && towelsVal !== 'false' && towelsVal !== '');
  const hasActiveBeddings = beddingsVal === 'yes' || beddingsVal === 'true' || beddingsVal === '1' || (beddingsVal !== 'no' && beddingsVal !== 'false' && beddingsVal !== '');
  const hasPaidSelection = selectionVal && !['none', 'standard', 'standard (no daily change)', 'false', 'no'].includes(selectionVal);

  if (hasActiveTowels || hasActiveBeddings || hasPaidSelection) {
    sanitized.beddings = beddingsObj;
  }

  // Personal Shopper Filter
  const shopper = rawAddons.shopper || rawAddons.personalShopper;
  if (shopper && !['None', 'false'].includes(String(shopper))) {
    sanitized.shopper = shopper;
  }

  // Copy remaining non-default custom fields
  Object.entries(rawAddons).forEach(([key, value]) => {
    const isHandledKey = [
      'security', 'securityType', 'securityService', 'securityCount', 'guards',
      'airport', 'airportTransfer', 'airportDirection', 'direction', 'tripType',
      'housekeeping', 'housekeepingService', 'housekeepingActive', 'housekeepingSchedule', 'frequency',
      'chauffeur', 'chauffeurService', 'laundry', 'drycleaning', 'laundryAdult', 'laundryKid', 'laundrySuit',
      'beddings', 'linen', 'beddingTowels', 'beddingBeddings', 'beddingSelection', 'shopper', 'personalShopper'
    ].includes(key);

    if (!isHandledKey && value && value !== 'None' && value !== false && value !== 'no' && value !== '0') {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[API Parse Error]: Request body is empty or invalid JSON');
      return NextResponse.json({ error: 'Invalid JSON payload received' }, { status: 400 });
    }

    const raw = body?.bookingData || body;
    const txRefFromRoot = body?.transactionRef;

    const {
      id,
      reference,
      transactionRef,
      listingId,
      apartmentTitle,
      customerEmail,
      customerName,
      phone,
      checkIn,
      checkOut,
      totalNights,
      guestCount,
      guestInfo,
      baseRentTotal,
      stayCost,
      servicesTotal,
      totalConciergePrice,
      grandTotal,
      apartmentCut,
      platformFee,
      platformFeeTotal,
      diningTotal,
      servicesCut,
      dailyMealSelections,
      parsedMeals,
      addons,
      activeAddons,
      status,
      paymentStatus,
      pricePerNight,
    } = raw || {};

    const resolvedTxRef = txRefFromRoot || transactionRef || reference || `CS_REF_${Date.now()}`;
    const parsedNights = Math.max(1, Number(totalNights) || 1);
    const parsedBaseRent = Number(baseRentTotal ?? stayCost ?? 0);
    const parsedServices = Number(servicesTotal ?? diningTotal ?? totalConciergePrice ?? 0);
    const parsedGrandTotal = Number(grandTotal ?? 0);
    const parsedPlatformFee = Number(platformFeeTotal ?? platformFee ?? 0);
    const resolvedGuestCount = Number(guestCount ?? guestInfo?.guests ?? 1);
    const resolvedPricePerNight = Number(pricePerNight ?? (parsedNights > 0 ? parsedBaseRent / parsedNights : 0));

    const resolvedCustomerName = customerName || guestInfo?.fullName || '';
    const resolvedCustomerEmail = customerEmail || guestInfo?.email || '';
    const resolvedPhone = phone || guestInfo?.phone || '';

    const nowIso = new Date().toISOString();
    const sanitizedAddons = sanitizeAddons(addons || activeAddons || {});

    const bookingData: Record<string, any> = {
      id: id || crypto.randomUUID(),
      createdAt: nowIso,
      updatedAt: nowIso,
      reference: resolvedTxRef,
      paymentReference: resolvedTxRef,
      checkIn: checkIn ? new Date(checkIn).toISOString() : nowIso,
      checkOut: checkOut ? new Date(checkOut).toISOString() : nowIso,
      totalNights: parsedNights,
      guestCount: resolvedGuestCount,
      pricePerNight: resolvedPricePerNight,
      baseRentTotal: parsedBaseRent,
      servicesTotal: parsedServices,
      grandTotal: parsedGrandTotal,
      apartmentCut: Number(apartmentCut ?? parsedBaseRent),
      servicesCut: Number(servicesCut ?? parsedServices),
      platformFee: parsedPlatformFee,
      platformFeeTotal: parsedPlatformFee,
      status: status || 'Confirmed',
      paymentStatus: paymentStatus || 'Paid',
      customerName: resolvedCustomerName,
      customerEmail: resolvedCustomerEmail,
      phone: resolvedPhone,
      apartmentTitle: apartmentTitle || '',
      listingId: listingId || '',
      dailyMealSelections: dailyMealSelections || parsedMeals || [],
      addons: sanitizedAddons,
    };

    let { data: newBooking, error } = await supabase
      .from('Booking')
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.error('[Supabase Insert Error]:', error.message);
      return NextResponse.json({ error: 'Database insert failed', message: error.message }, { status: 500 });
    }

    // --- SEND EMAIL VIA RESEND ---
    try {
      if (resolvedCustomerEmail) {
        let mealsHtml = '';
        const rawMeals = dailyMealSelections ?? parsedMeals ?? null;

        if (rawMeals) {
          if (typeof rawMeals === 'object' && !Array.isArray(rawMeals)) {
            const mealsData = rawMeals as Record<string, any>;

            if (mealsData.meals) {
              Object.entries(mealsData.meals as Record<string, any>).forEach(([date, meals]: [string, any]) => {
                mealsHtml += `<h4 style="color: #fbbf24; margin-top: 10px;">📅 Date: ${date}</h4><ul>`;
                Object.entries(meals as Record<string, any>).forEach(([mealId, data]: [string, any]) => {
                  mealsHtml += `<li><strong>${mealId}</strong> - ${data?.liters ?? data?.qty ?? 1} Liters/Portions`;
                  if (data?.proteins && Array.isArray(data.proteins) && data.proteins.length > 0) {
                    mealsHtml += `<br/><span style="font-size: 12px; color: #94a3b8;">Proteins: ${data.proteins.map((p: any) => `${p?.id ?? p?.name ?? 'Protein'} (x${p?.qty ?? 1})`).join(', ')}</span>`;
                  }
                  mealsHtml += `</li>`;
                });
                mealsHtml += `</ul>`;
              });
            }

            if (mealsData.soups) {
              Object.entries(mealsData.soups as Record<string, any>).forEach(([date, soups]: [string, any]) => {
                mealsHtml += `<h4 style="color: #fbbf24; margin-top: 10px;">🍲 Soups (${date})</h4><ul>`;
                Object.entries(soups as Record<string, any>).forEach(([soupId, data]: [string, any]) => {
                  mealsHtml += `<li><strong>${soupId}</strong> - ${data?.liters ?? data?.qty ?? 1} Portions (${data?.swallow || 'Standard'})`;
                  if (data?.proteins && Array.isArray(data.proteins) && data.proteins.length > 0) {
                    mealsHtml += `<br/><span style="font-size: 12px; color: #94a3b8;">Proteins: ${data.proteins.map((p: any) => `${p?.id ?? p?.name ?? 'Protein'} (x${p?.qty ?? 1})`).join(', ')}</span>`;
                  }
                  mealsHtml += `</li>`;
                });
                mealsHtml += `</ul>`;
              });
            }
          } else if (Array.isArray(rawMeals) && rawMeals.length > 0) {
            mealsHtml += `<ul>`;
            rawMeals.forEach((m: any) => {
              mealsHtml += `<li>${typeof m === 'string' ? m : JSON.stringify(m)}</li>`;
            });
            mealsHtml += `</ul>`;
          }
        }

        let addonsHtml = '';
        if (Object.keys(sanitizedAddons).length > 0) {
          addonsHtml += `<ul>`;
          Object.entries(sanitizedAddons).forEach(([key, val]) => {
            const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            addonsHtml += `<li><strong>${key}:</strong> ${displayVal}</li>`;
          });
          addonsHtml += `</ul>`;
        } else {
          addonsHtml = '<p>No additional concierge services selected.</p>';
        }

        await resend.emails.send({
          from: 'Concierge Stay <onboarding@resend.dev>', // Update with your verified domain in production
          to: [resolvedCustomerEmail],
          subject: `Booking Confirmation & Order Breakdown - ${apartmentTitle || 'Luxury Apartment'}`,
          html: `
            <div style="font-family: sans-serif; background-color: #060b13; color: #f8fafc; padding: 24px; border-radius: 12px;">
              <h2 style="color: #fbbf24; border-bottom: 1px solid #334155; padding-bottom: 12px;">Reservation Confirmed!</h2>
              <p>Hello <strong>${resolvedCustomerName || 'Valued Guest'}</strong>,</p>
              <p>Thank you for booking with us. Your payment has been successfully verified and your reservation is secured.</p>
              
              <div style="background-color: #0b121e; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #1e293b;">
                <h3 style="color: #fbbf24; margin-top: 0;">Stay Details</h3>
                <p><strong>Apartment:</strong> ${apartmentTitle || 'N/A'}</p>
                <p><strong>Duration:</strong> ${parsedNights} Night(s) (${checkIn ? new Date(checkIn).toLocaleDateString() : 'N/A'} to ${checkOut ? new Date(checkOut).toLocaleDateString() : 'N/A'})</p>
                <p><strong>Guests:</strong> ${resolvedGuestCount}</p>
                <p><strong>Reference:</strong> ${resolvedTxRef}</p>
              </div>

              <div style="background-color: #0b121e; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #1e293b;">
                <h3 style="color: #fbbf24; margin-top: 0;">Selected Concierge Add-Ons</h3>
                ${addonsHtml}
              </div>

              <div style="background-color: #0b121e; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #1e293b;">
                <h3 style="color: #fbbf24; margin-top: 0;">Culinary Selections</h3>
                ${mealsHtml || '<p>No custom daily meals selected.</p>'}
              </div>

              <div style="background-color: #0b121e; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #1e293b;">
                <h3 style="color: #fbbf24; margin-top: 0;">Payment Summary</h3>
                <p>Accommodation: ₦${parsedBaseRent.toLocaleString()}</p>
                <p>Services & Dining: ₦${parsedServices.toLocaleString()}</p>
                <hr style="border-color: #334155;" />
                <p style="font-size: 16px; color: #fbbf24;"><strong>Total Paid: ₦${parsedGrandTotal.toLocaleString()}</strong></p>
              </div>

              <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">If you have any questions or need to modify your itinerary, please contact our support desk.</p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error('[Resend Email Dispatch Error]:', emailError);
    }

    return NextResponse.json({ success: true, booking: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error('[API POST Booking Detailed Error]:', error);
    return NextResponse.json(
      { error: 'Failed to save booking', message: error?.message || 'Internal Error' },
      { status: 500 }
    );
  }
}