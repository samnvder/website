        /* --- GA4 / Google Ads conversion — added 2026-08-17, see handoffs/tour-conversion-tracking.md --- */
        try {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'tour_booked',
            tour_booking_id: res.data.appointment_id || res.data.id || null,
            tour_is_reschedule: !!res.data.appointment_rescheduled,
            tour_date: payload.preferred_date || null,
            tour_time: payload.preferred_time || null,
            tour_heard_about: payload.how_heard || null,
            tour_source_page: payload.source_page || null,
            tour_device: payload.device_type || null,
            tour_utm_source: payload.utm_source || null,
            tour_utm_medium: payload.utm_medium || null,
            tour_utm_campaign: payload.utm_campaign || null
          });
        } catch(e) { /* never let tracking break the booking confirmation */ }
        /* --- end conversion tracking --- */
