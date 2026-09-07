export function getGuestEmailHtml({
  guestEmail,
  listingName,
  checkIn,
  checkOut,
  totalNights,
  grandTotal,
  reference,
  dailyMealSelections,
}: any) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 8px;">
      <h2 style="color: #38bdf8; margin-bottom: 4px;">Concierge Stays & Hospitality</h2>
      <p style="color: #94a3b8; font-size: 14px;">Booking Confirmation & Receipt</p>
      <hr style="border-color: #334155; margin: 20px 0;" />
      
      <p>Hello,</p>
      <p>Thank you for your reservation! Your payment has been confirmed.</p>

      <div style="background: #1e293b; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <p><strong>Property:</strong> ${listingName}</p>
        <p><strong>Check-In:</strong> ${checkIn}</p>
        <p><strong>Check-Out:</strong> ${checkOut} (${totalNights} night${totalNights > 1 ? 's' : ''})</p>
        <p><strong>Total Paid:</strong> ₦${grandTotal.toLocaleString()}</p>
        <p><strong>Payment Ref:</strong> ${reference}</p>
      </div>

      <h3 style="color: #38bdf8;">Meal & Add-on Itinerary</h3>
      <div style="background: #1e293b; padding: 16px; border-radius: 6px;">
        ${
          Object.keys(dailyMealSelections || {}).length > 0
            ? Object.entries(dailyMealSelections)
                .map(
                  ([dayIndex, meals]: [string, any]) => `
                  <p style="margin: 6px 0; border-bottom: 1px solid #334155; padding-bottom: 4px;">
                    <strong>Day ${Number(dayIndex) + 1}:</strong> ${Array.isArray(meals) ? meals.join(', ') : 'None'}
                  </p>
                `
                )
                .join('')
            : '<p style="color: #94a3b8;">No custom meal plans selected.</p>'
        }
      </div>

      <p style="margin-top: 24px; font-size: 13px; color: #64748b; text-align: center;">
        If you have questions about your stay, reply directly to this email.
      </p>
    </div>
  `;
}

export function getAdminEmailHtml({
  guestEmail,
  listingName,
  checkIn,
  checkOut,
  grandTotal,
  reference,
  dailyMealSelections,
}: any) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f8fafc; color: #0f172a; border-radius: 8px;">
      <h2 style="color: #0284c7;">🔔 New Booking Received!</h2>
      <p>A new guest has completed payment via Paystack.</p>
      
      <div style="background: #e2e8f0; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p><strong>Guest Email:</strong> ${guestEmail}</p>
        <p><strong>Property:</strong> ${listingName}</p>
        <p><strong>Dates:</strong> ${checkIn} to ${checkOut}</p>
        <p><strong>Amount Paid:</strong> ₦${grandTotal.toLocaleString()}</p>
        <p><strong>Ref:</strong> ${reference}</p>
      </div>

      <h3>Kitchen & Meal Prep Roster</h3>
      <div style="background: #ffffff; padding: 16px; border: 1px solid #cbd5e1; border-radius: 6px;">
        ${
          Object.keys(dailyMealSelections || {}).length > 0
            ? Object.entries(dailyMealSelections)
                .map(
                  ([dayIndex, meals]: [string, any]) => `
                  <p style="margin: 6px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                    <strong>Day ${Number(dayIndex) + 1}:</strong> ${Array.isArray(meals) ? meals.join(', ') : 'None'}
                  </p>
                `
                )
                .join('')
            : '<p style="color: #64748b;">No meal options selected for this stay.</p>'
        }
      </div>
    </div>
  `;
}