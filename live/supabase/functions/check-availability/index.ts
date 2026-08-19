// ============================================================================
// CHECK AVAILABILITY — Supabase Edge Function
// ============================================================================
// Returns booked time slots for a given date so the frontend can disable them.
//
// Flow:
//   1. Receive date from the website (JSON: { date: "2026-02-19" })
//   2. Query CRM calendar for all appointments on that date
//   3. Extract booked time slots (start times of Tour/Interview appointments)
//   4. Return list of unavailable times
//
// Response format:
//   {
//     success: true,
//     date: "2026-02-19",
//     booked_slots: ["11:00 AM", "2:30 PM", "6:30 PM"],
//     available: true  // false if ALL slots are booked
//   }
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// ── Config ──────────────────────────────────────────────────────────────────
const ENGAGE_API_KEY = Deno.env.get("ENGAGE_PRO_API_KEY")!;

const ENGAGE_BASE = "https://api.vfpnext.com";
const CALENDAR_GET_URL = `${ENGAGE_BASE}/api/calendar`;
const SUBDOMAIN = "racquetandhealthclubs";
const ACCOUNT = "21582374";
const CLUB_ID = "1";
const USER_AGENT = "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)";

// Business hours (must match booking-form.html)
const HOURS = {
  weekday: { open: 11, close: 19 },  // Mon-Fri: 11 AM - 7 PM
  weekend: { open: 8, close: 16 },   // Sat-Sun: 8 AM - 4 PM
};
const APPOINTMENT_DURATION_MIN = 30;

// Business hours for a given "YYYY-MM-DD". Holidays / early closures are handled
// via "Unavailable" blocks in the CRM calendar (see the event loop below), not here.
function getHoursForDate(dateStr: string): { open: number; close: number } {
  const dow = getDayOfWeek(dateStr);
  const isWeekend = dow === 0 || dow === 6;
  return isWeekend ? HOURS.weekend : HOURS.weekday;
}

// ── CORS Headers ────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Convert 24h hour to "H:MM AM/PM" format
function formatTime12(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

// Parse "12:30 PM" or "3:00 PM" to minutes since midnight
function parseTime12(timeStr: string): number | null {
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const pm = m[3].toUpperCase() === "PM";
  if (h === 12) h = pm ? 12 : 0;
  else if (pm) h += 12;
  return h * 60 + min;
}

// Format date for label: "Wednesday, February 19"
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate();
}

// Parse "2026-02-19 14:30:00" or "2026-02-19T14:30:00" to { hour, minute }
function parseDateTime(dateTimeStr: string): { hour: number; minute: number } | null {
  const match = dateTimeStr.match(/(\d{2}):(\d{2})/);
  if (!match) return null;
  return { hour: parseInt(match[1]), minute: parseInt(match[2]) };
}

// Get day of week (0=Sun, 6=Sat) from date string "2026-02-19"
function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDay();
}

// ── Main Handler ────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const date = body.date?.trim();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return jsonResponse({ error: "Valid date required (YYYY-MM-DD)" }, 400);
    }

    console.log("Checking availability for date:", date);

    // Determine business hours for this day (respects holiday/early-close overrides)
    const hours = getHoursForDate(date);

    // Generate all possible time slots for this day
    const allSlots: string[] = [];
    for (let hr = hours.open; hr < hours.close; hr++) {
      for (let min = 0; min < 60; min += 30) {
        // Last slot must be APPOINTMENT_DURATION_MIN before close
        const slotEndHour = hr + (min + APPOINTMENT_DURATION_MIN) / 60;
        if (slotEndHour <= hours.close) {
          allSlots.push(formatTime12(hr, min));
        }
      }
    }

    // Query CRM calendar for this date
    const bookedSlots: string[] = [];

    try {
      const calUrl = `${CALENDAR_GET_URL}?Subdomain=${SUBDOMAIN}&Account=${ACCOUNT}&ClubID=${CLUB_ID}&start=${date}&end=${date}&type=all`;

      console.log("Fetching calendar:", calUrl);

      const calRes = await fetch(calUrl, {
        method: "GET",
        headers: {
          "X-API-KEY": ENGAGE_API_KEY,
          "user-agent": USER_AGENT,
        },
      });

      if (calRes.ok) {
        const calData = await calRes.json();
        console.log("Calendar events found:", Array.isArray(calData) ? calData.length : 0);

        if (Array.isArray(calData)) {
          // Log first event to see structure
          if (calData.length > 0) {
            console.log("Sample event structure:", JSON.stringify(calData[0]));
          }

          for (const event of calData) {
            // Log each event's key fields
            const eventType = event.Type || event.type || "";
            const eventName = event.Name || event.name || event.title || "";
            const eventStatus = event.Status || event.status || "";
            const startStr = event.start || event.Start || event.StartTime || "";
            const endStr = event.end || event.End || event.EndTime || "";
            const className = typeof event.className === "string" ? event.className : "";

            console.log("Event:", eventName, "| Type:", eventType, "| Status:", eventStatus, "| Start:", startStr);

            // "Unavailable" blocks (set in the CRM calendar) — staff-out, front-desk
            // closures, holidays, early closes. Block every tour slot they cover so
            // the booking form greys them out. The CRM independently rejects bookings
            // during these windows; this just keeps the UI in sync.
            const isUnavailable =
              eventType === "Unavailable" || className.includes("unavailable-event");
            if (isUnavailable) {
              const isAllDay =
                event.allDay === "1" || event.allDay === 1 || event.allDay === true;
              if (isAllDay) {
                for (const s of allSlots) {
                  if (!bookedSlots.includes(s)) bookedSlots.push(s);
                }
                console.log(">>> ALL-DAY block — entire day unavailable:", eventName);
              } else {
                const startP = parseDateTime(startStr);
                const endP = parseDateTime(endStr);
                if (startP && endP) {
                  const blockStart = startP.hour * 60 + startP.minute;
                  const blockEnd = endP.hour * 60 + endP.minute;
                  for (const s of allSlots) {
                    const sm = parseTime12(s);
                    // Slot [sm, sm+duration) overlaps the unavailable window
                    if (sm != null && sm < blockEnd && sm + APPOINTMENT_DURATION_MIN > blockStart) {
                      if (!bookedSlots.includes(s)) {
                        bookedSlots.push(s);
                        console.log(">>> Unavailable block:", s, "from", eventName);
                      }
                    }
                  }
                } else {
                  console.log("Unavailable event with unparseable start/end:", startStr, endStr);
                }
              }
              continue;
            }

            // Count any appointment with Sam that blocks a slot:
            // Tour, Interview, or Consultation (CRM default when update fails)
            const isTourOrInterview =
              eventType === "Tour" ||
              eventType === "Interview" ||
              eventType === "Consultation" ||
              eventName === "Tour" ||
              (typeof eventName === "string" && (
                eventName.toLowerCase().includes("tour") ||
                eventName.toLowerCase().includes("consultation")
              ));

            // Only CANCELLED tours free up their slot — the customer isn't coming.
            // "Rescheduled" tours DO block: staff mark a moved-but-still-happening
            // appointment "Rescheduled" and it sits at its current (correct) time, so
            // it must hold that slot. (The fixed book-tour now MOVES events on
            // reschedule rather than leaving ghosts behind, so blocking rescheduled
            // events no longer wrongly blocks an old slot.) Failing toward "blocked"
            // also avoids double-booking.
            const statusLower = String(eventStatus).toLowerCase();
            const isCancelled = statusLower.includes("cancel");

            if (isTourOrInterview && !isCancelled) {
              const parsed = parseDateTime(startStr);

              if (parsed) {
                const timeSlot = formatTime12(parsed.hour, parsed.minute);
                if (!bookedSlots.includes(timeSlot)) {
                  bookedSlots.push(timeSlot);
                  console.log(">>> BOOKED slot:", timeSlot, "from event ID:", event.id || event.ID);
                }
              } else {
                console.log("Could not parse start time:", startStr);
              }
            }
          }
        }
      } else {
        console.warn("Calendar API returned:", calRes.status);
      }
    } catch (calErr) {
      console.error("Calendar fetch error:", calErr);
      // Continue with empty booked slots — better to allow booking than block entirely
    }

    // Calculate available slots
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    console.log("Total slots:", allSlots.length, "Booked:", bookedSlots.length, "Available:", availableSlots.length);

    const response: Record<string, unknown> = {
      success: true,
      date: date,
      all_slots: allSlots,
      booked_slots: bookedSlots,
      available_slots: availableSlots,
      available: availableSlots.length > 0,
    };

    // When time is provided and booked, compute 3 suggestions
    const requestedTime = body.time?.trim();
    if (requestedTime && bookedSlots.includes(requestedTime)) {
      const reqMins = parseTime12(requestedTime);
      if (reqMins != null) {
        const suggestions: Array<{ date: string; time: string; label: string; type: string }> = [];

        // 1. Closest before (same day)
        const slotMins = allSlots.map(s => ({ slot: s, mins: parseTime12(s) })).filter(x => x.mins != null) as { slot: string; mins: number }[];
        const beforeSlots = slotMins.filter(x => availableSlots.includes(x.slot) && x.mins < reqMins);
        if (beforeSlots.length > 0) {
          const closestBefore = beforeSlots.reduce((a, b) => a.mins > b.mins ? a : b);
          suggestions.push({
            type: "closest_before",
            date,
            time: closestBefore.slot,
            label: formatDateLabel(date) + " at " + closestBefore.slot,
          });
        }

        // 2. Closest after (same day)
        const afterSlots = slotMins.filter(x => availableSlots.includes(x.slot) && x.mins > reqMins);
        if (afterSlots.length > 0) {
          const closestAfter = afterSlots.reduce((a, b) => a.mins < b.mins ? a : b);
          suggestions.push({
            type: "closest_after",
            date,
            time: closestAfter.slot,
            label: formatDateLabel(date) + " at " + closestAfter.slot,
          });
        }

        // 3. Same time on closest available day
        const dateParts = date.split("-").map(Number);
        const baseDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        for (let offset = 1; offset <= 14; offset++) {
          for (const sign of [1, -1]) {
            const checkDate = new Date(baseDate);
            checkDate.setDate(checkDate.getDate() + sign * offset);
            const checkStr = checkDate.getFullYear() + "-" + String(checkDate.getMonth() + 1).padStart(2, "0") + "-" + String(checkDate.getDate()).padStart(2, "0");
            const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
            const checkDayStart = new Date(checkDate); checkDayStart.setHours(0, 0, 0, 0);
            if (checkDayStart < todayStart) continue;
            const checkHours = getHoursForDate(checkStr);
            const checkAllSlots: string[] = [];
            for (let hr = checkHours.open; hr < checkHours.close; hr++) {
              for (let min = 0; min < 60; min += 30) {
                const slotEndHour = hr + (min + APPOINTMENT_DURATION_MIN) / 60;
                if (slotEndHour <= checkHours.close) checkAllSlots.push(formatTime12(hr, min));
              }
            }
            if (!checkAllSlots.includes(requestedTime)) continue;
            const calUrl = `${CALENDAR_GET_URL}?Subdomain=${SUBDOMAIN}&Account=${ACCOUNT}&ClubID=${CLUB_ID}&start=${checkStr}&end=${checkStr}&type=all`;
            try {
              const calRes = await fetch(calUrl, {
                method: "GET",
                headers: { "X-API-KEY": ENGAGE_API_KEY, "user-agent": USER_AGENT },
              });
              const checkBooked: string[] = [];
              if (calRes.ok) {
                const calData = await calRes.json();
                if (Array.isArray(calData)) {
                  for (const event of calData) {
                    const eventType = event.Type || event.type || "";
                    const eventName = event.Name || event.name || event.title || "";
                    const eventStatus = event.Status || event.status || "";
                    const startStr = event.start || event.Start || event.StartTime || "";
                    const isTourOrInterview = eventType === "Tour" || eventType === "Interview" || eventName === "Tour" || (typeof eventName === "string" && eventName.toLowerCase().includes("tour"));
                    const isScheduled = eventStatus === "Scheduled" || eventStatus === "" || !eventStatus;
                    if (isTourOrInterview && isScheduled) {
                      const parsed = parseDateTime(startStr);
                      if (parsed) {
                        const timeSlot = formatTime12(parsed.hour, parsed.minute);
                        if (!checkBooked.includes(timeSlot)) checkBooked.push(timeSlot);
                      }
                    }
                  }
                }
              }
              if (!checkBooked.includes(requestedTime)) {
                suggestions.push({
                  type: "same_time_other_day",
                  date: checkStr,
                  time: requestedTime,
                  label: formatDateLabel(checkStr) + " at " + requestedTime,
                });
                break;
              }
            } catch {
              // Continue to next date on fetch error
            }
            if (suggestions.some(s => s.type === "same_time_other_day")) break;
          }
          if (suggestions.some(s => s.type === "same_time_other_day")) break;
        }

        const typeOrder = { same_time_other_day: 0, closest_before: 1, closest_after: 2 };
        suggestions.sort((a, b) => (typeOrder[a.type as keyof typeof typeOrder] ?? 3) - (typeOrder[b.type as keyof typeof typeOrder] ?? 3));
        response.suggestions = suggestions;
      }
    }

    return jsonResponse(response);

  } catch (err) {
    console.error("Unhandled error:", err);
    return jsonResponse(
      {
        error: "Something went wrong",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      500
    );
  }
});
