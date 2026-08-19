// ============================================================================
// BOOK TOUR ? Supabase Edge Function
// ============================================================================
// CONFIRMED WORKING: Uses /api/engage/start with X-API-KEY header +
//   application/x-www-form-urlencoded body. Creates lead AND starts
//   communication track in one call.
//
// Flow:
//   1. Receive form data from the website (JSON)
//   2. Validate required fields
//   3. Try to save to Supabase tour_bookings table (non-blocking on failure)
//   4. Create lead + start Track 11 in Engage Pro (/api/engage/start)
//   5a. Create interview record (/api/interview/schedule) ? get InterviewID
//   5b. Find the calendar event (GET /api/calendar) ? get event ID
//   5c. Update event to Tour type (/api/calendar/update) ? triggers Appt tracks
//   6. If referral: save to tour_referrals + create CRM connection
//   7. Update tour_bookings with CRM result (if Supabase is available)
//   8. If Supabase failed but CRM succeeded ? send email alert via Resend
//   9. Return success to the client (if CRM worked, regardless of Supabase)
//
// RESILIENCE: If Supabase is down, the booking still goes through to the CRM.
//   An email alert is sent to notify of the Supabase failure.
//
// NOTE: Track 11 (Web General Inquiry) will fire alongside the Appointment
//   tracks. The user will adjust Track 11's messaging on the CRM side to
//   avoid conflicts.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// ?? Config ??????????????????????????????????????????????????????????????????
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENGAGE_API_KEY = Deno.env.get("ENGAGE_PRO_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

// Email alert config
const ALERT_TO_EMAIL = "s@southendclub.com";
const ALERT_FROM_EMAIL = "notifications@southendclub.com";

const ENGAGE_BASE = "https://api.vfpnext.com";
const ENGAGE_URL = `${ENGAGE_BASE}/api/engage/start`;
const INTERVIEW_URL = `${ENGAGE_BASE}/api/interview/schedule`;
const CALENDAR_GET_URL = `${ENGAGE_BASE}/api/calendar`;
const CALENDAR_UPDATE_URL = `${ENGAGE_BASE}/api/calendar/update`;
const CONNECTION_URL = `${ENGAGE_BASE}/api/connection/create`;
const MEMBER_SEARCH_URL = `${ENGAGE_BASE}/api/member/search`;
const TRACK_START_URL = `${ENGAGE_BASE}/api/track/start`;
const SUBDOMAIN = "racquetandhealthclubs";
const ACCOUNT = "21582374";
const CLUB_ID = "1";
const TRACK_ID = "11"; // Web | General Inquiry (Auto)
const REFERRAL_TRACK_ID = "50"; // Tour Referral - started on referrer when someone they referred books
const LEAD_SOURCE = "Web Form";
const JOIN_TYPE = "Web";
const STAFF_ID = 1567364; // Sam from South End (default tour guide)
const APPOINTMENT_TYPE = "Tour"; // Must match CRM Appt Type for track triggers
const APPOINTMENT_DURATION_MIN = 30; // 30-minute tours
const USER_AGENT = "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)";

// ?? CORS Headers ?????????????????????????????????????????????????????????????
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

// ?? Send Email Alert via Resend ????????????????????????????????????????????
async function sendFailureAlert(
  bookingData: BookingPayload,
  supabaseError: string,
  crmSuccess: boolean,
  prospectId: number | null
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("No RESEND_API_KEY configured ? skipping email alert");
    return;
  }

  try {
    const subject = crmSuccess
      ? "?? Tour Booking: Supabase Down but CRM Succeeded"
      : "? Tour Booking: Both Supabase and CRM Failed";

    const html = `
      <h2>${subject}</h2>
      <p><strong>Time:</strong> ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}</p>

      <h3>Booking Details</h3>
      <ul>
        <li><strong>Name:</strong> ${bookingData.first_name} ${bookingData.last_name}</li>
        <li><strong>Email:</strong> ${bookingData.email}</li>
        <li><strong>Phone:</strong> ${bookingData.cell_phone}</li>
        <li><strong>Date:</strong> ${bookingData.preferred_date}</li>
        <li><strong>Time:</strong> ${bookingData.preferred_time}</li>
        <li><strong>How Heard:</strong> ${bookingData.how_heard || "N/A"}</li>
        <li><strong>Referral:</strong> ${bookingData.referral_member || "None"}</li>
      </ul>

      <h3>Status</h3>
      <ul>
        <li><strong>Supabase:</strong> ? Failed ? ${supabaseError}</li>
        <li><strong>CRM (Engage Pro):</strong> ${crmSuccess ? `? Success ? Prospect ID: ${prospectId}` : "? Failed"}</li>
      </ul>

      <p style="color: #666; font-size: 12px;">
        ${crmSuccess
          ? "The booking was successfully created in the CRM. Once Supabase is back online, you may want to manually add this record to tour_bookings for tracking."
          : "This booking failed completely. Please follow up with the customer manually."}
      </p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ALERT_FROM_EMAIL,
        to: [ALERT_TO_EMAIL],
        subject: subject,
        html: html,
      }),
    });

    if (res.ok) {
      console.log("Failure alert email sent successfully");
    } else {
      const errData = await res.text();
      console.error("Failed to send alert email:", res.status, errData);
    }
  } catch (emailErr) {
    console.error("Error sending alert email:", emailErr);
  }
}

// ?? Send Referral Notification Email via Resend ??????????????????????????????
async function sendReferralNotification(
  referrerName: string,
  prospectFirstName: string,
  prospectLastName: string,
  prospectEmail: string,
  tourDate: string,
  tourTime: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("No RESEND_API_KEY configured ? skipping referral notification");
    return;
  }

  try {
    const prospectName = `${prospectFirstName} ${prospectLastName}`;
    const subject = `?? Member Referral: ${referrerName} referred ${prospectName} for a tour!`;

    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0b468c;">New Member Referral!</h2>
        <p style="font-size: 16px; color: #333;">
          <strong>${referrerName}</strong> referred <strong>${prospectName}</strong> for a tour.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Referrer:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${referrerName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Prospect:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${prospectName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Prospect Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${prospectEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Tour Date:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${tourDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Tour Time:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${tourTime}</td>
          </tr>
        </table>
        <p style="color: #666; font-size: 14px;">
          The referrer has been started on Track 50 (Tour Referral) and will receive automated communications.
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ALERT_FROM_EMAIL,
        to: [ALERT_TO_EMAIL],
        subject: subject,
        html: html,
      }),
    });

    if (res.ok) {
      console.log("Referral notification email sent successfully");
    } else {
      const errData = await res.text();
      console.error("Failed to send referral notification:", res.status, errData);
    }
  } catch (emailErr) {
    console.error("Error sending referral notification:", emailErr);
  }
}

// ?? Validation ??????????????????????????????????????????????????????????????
interface BookingPayload {
  first_name: string;
  last_name: string;
  email: string;
  cell_phone: string;
  preferred_date: string;
  preferred_time: string;
  how_heard?: string;
  referral_member?: string;
  referral_member_id?: number;
  referral_member_ref_id?: string;
  referral_member_email?: string;
  referral_member_phone?: string;
  interests?: string;
  note?: string;
  gender?: string;
  send_texts?: string;
  send_calls?: string;
  send_emails?: string;
  source_page?: string;
  device_type?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// ?? Time Helpers ????????????????????????????????????????????????????????????
// Convert "2:30 PM" ? "14:30:00"
function parseTime(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "10:00:00"; // fallback
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

// Add minutes to a "HH:MM:SS" time string
function addMinutes(time24: string, mins: number): string {
  const parts = time24.split(":");
  let h = parseInt(parts[0]);
  let m = parseInt(parts[1]);
  m += mins;
  while (m >= 60) { h++; m -= 60; }
  if (h >= 24) h -= 24;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
}

// Minimum lead time before a tour can start (mirrors the 2h buffer in the frontends)
const MIN_LEAD_HOURS = 2;
const CLUB_TIMEZONE = "America/Los_Angeles";

// Offset (ms) to add to a UTC instant to get the wall-clock time in `timeZone`.
// e.g. for LA in PDT this returns -7h.
function tzOffsetMs(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = parseInt(p.value, 10);
  }
  // 24:00 can appear for midnight in some runtimes — normalize to 0
  const hour = map.hour === 24 ? 0 : map.hour;
  const asUTC = Date.UTC(map.year, map.month - 1, map.day, hour, map.minute, map.second);
  return asUTC - date.getTime();
}

// Convert a wall-clock date/time in CLUB_TIMEZONE to a UTC epoch (ms).
function clubWallClockToUTC(year: number, month: number, day: number, hour: number, minute: number): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = tzOffsetMs(CLUB_TIMEZONE, new Date(guess));
  return guess - offset;
}

// Returns an error string if the requested slot is in the past or within the
// MIN_LEAD_HOURS buffer; null if it's far enough out. Timezone-aware so it
// works regardless of where the Edge Function runs (UTC).
function checkLeadTime(dateStr: string, timeStr: string): string | null {
  const dateParts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!dateParts || !timeMatch) return null; // unparseable — don't block, other validation handles format

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const period = timeMatch[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const slotUTC = clubWallClockToUTC(
    parseInt(dateParts[1], 10),
    parseInt(dateParts[2], 10),
    parseInt(dateParts[3], 10),
    hours,
    minutes,
  );

  const minStartUTC = Date.now() + MIN_LEAD_HOURS * 60 * 60 * 1000;
  if (slotUTC < minStartUTC) {
    return `Please choose a time at least ${MIN_LEAD_HOURS} hours from now`;
  }
  return null;
}

function validate(body: BookingPayload): string | null {
  if (!body.first_name?.trim()) return "First name is required";
  if (!body.last_name?.trim()) return "Last name is required";
  if (!body.email?.trim() || !body.email.includes("@"))
    return "Valid email is required";
  const digits = body.cell_phone?.replace(/\D/g, "") || "";
  if (digits.length !== 10) return "Valid 10-digit phone number is required";
  if (!body.preferred_date?.trim()) return "Preferred date is required";
  if (!body.preferred_time?.trim()) return "Preferred time is required";
  const leadTimeError = checkLeadTime(body.preferred_date.trim(), body.preferred_time.trim());
  if (leadTimeError) return leadTimeError;
  return null;
}

// Find a prospect's existing tour-type event (Tour/Interview/Consultation) by
// member ID OR member email, ignoring cancelled ones. Rescheduled "ghost" events
// ARE eligible — moving them forward cleans them up. Deterministic: returns the
// earliest upcoming match, else the most recent. Also returns the matched
// member's ID (memberId) so callers can recover a lead's UserID when Engage Pro's
// "already on track" response omits it. Returns null if nothing matches.
async function findExistingTourEvent(
  opts: {
    prospectId?: number | null;
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  },
): Promise<{ id: string; start: string; memberId: string | null } | null> {
  const last10 = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-10);
  const pid = opts.prospectId != null ? String(opts.prospectId) : null;
  const email = opts.email ? opts.email.trim().toLowerCase() : null;
  const phone = opts.phone ? last10(opts.phone) : null;
  const fname = opts.firstName ? opts.firstName.trim().toLowerCase() : null;
  const lname = opts.lastName ? opts.lastName.trim().toLowerCase() : null;
  if (!pid && !email && !(phone && phone.length === 10) && !(fname && lname)) {
    return null;
  }

  const today = new Date();
  const future = new Date();
  future.setDate(future.getDate() + 60);
  const startSearch = today.toISOString().split("T")[0];
  const endSearch = future.toISOString().split("T")[0];
  const url =
    `${CALENDAR_GET_URL}?Subdomain=${SUBDOMAIN}&Account=${ACCOUNT}&ClubID=${CLUB_ID}&start=${startSearch}&end=${endSearch}&type=all`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-API-KEY": ENGAGE_API_KEY, "user-agent": USER_AGENT },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    const startOf = (e: Record<string, unknown>) =>
      String(e.start ?? e.Start ?? e.StartTime ?? "");
    // The member object on the event that matched (to read back its ID).
    const matchedMember = (e: Record<string, unknown>): Record<string, unknown> | null => {
      const members = e.members;
      if (!Array.isArray(members)) return null;
      return (members as Record<string, unknown>[]).find((m) => {
        if (pid && String(m?.ID) === pid) return true;
        const mEmail = String(m?.Email ?? "").trim().toLowerCase();
        if (email && mEmail && mEmail === email) return true;
        // Phone is the most reliable key — CRM leaves Email blank on fresh leads.
        if (phone && phone.length === 10 && last10(m?.CellPhone) === phone) return true;
        if (fname && lname &&
          String(m?.FirstName ?? "").trim().toLowerCase() === fname &&
          String(m?.LastName ?? "").trim().toLowerCase() === lname) return true;
        return false;
      }) ?? null;
    };

    const candidates = (data as Record<string, unknown>[]).filter((e) => {
      if (!matchedMember(e)) return false;
      const type = String(e.Type ?? e.type ?? "");
      const name = String(e.Name ?? e.name ?? e.title ?? "").toLowerCase();
      const eid = String(e.EventID ?? "");
      const isTourish = type === "Tour" || type === "Interview" ||
        type === "Consultation" || name.includes("tour") ||
        name.includes("consultation") || eid.startsWith("I-");
      if (!isTourish) return false;
      const status = String(e.Status ?? e.status ?? "").toLowerCase();
      return !status.includes("cancel"); // ignore cancelled; keep rescheduled
    });

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => startOf(a).localeCompare(startOf(b)));
    const todayStr = startSearch;
    const chosen = candidates.find((e) => startOf(e) >= todayStr) ??
      candidates[candidates.length - 1];
    const member = matchedMember(chosen);
    return {
      id: String(chosen.id ?? chosen.ID),
      start: startOf(chosen),
      memberId: member ? String(member.ID) : null,
    };
  } catch (err) {
    console.warn("findExistingTourEvent error:", err);
    return null;
  }
}

// Update a calendar event into a Scheduled Tour at the given time.
// Used by both the reschedule and new-booking paths. Treats an empty 2xx body
// as success (the CRM returns no body on some updates).
async function updateEventToScheduledTour(
  eventId: string,
  startDateTime: string,
  endDateTime: string,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const payload = {
    Subdomain: SUBDOMAIN,
    Account: parseInt(ACCOUNT),
    ClubID: parseInt(CLUB_ID),
    ID: parseInt(eventId),
    Name: APPOINTMENT_TYPE,
    Type: APPOINTMENT_TYPE,
    Status: "Scheduled",
    StartTime: startDateTime,
    EndTime: endDateTime,
    Duration: APPOINTMENT_DURATION_MIN,
    Note: note,
  };
  console.log("Updating event to Scheduled Tour:", JSON.stringify(payload));
  try {
    const res = await fetch(CALENDAR_UPDATE_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": ENGAGE_API_KEY,
        "user-agent": USER_AGENT,
        "Content-Type": "application/json",
        accept: "*/*",
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log("Event update response:", res.status, text);
    let parsed: Record<string, unknown> = {};
    if (text.trim()) {
      try { parsed = JSON.parse(text); } catch { /* empty/non-JSON body is fine */ }
    }
    if (res.ok && (parsed.status === true || !text.trim())) return { ok: true };
    return { ok: false, error: String(parsed.message ?? parsed.error ?? `HTTP ${res.status}`) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "update failed" };
  }
}

// ?? Main Handler ????????????????????????????????????????????????????????????
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body: BookingPayload = await req.json();

    // ?? Step 1: Validate ????????????????????????????????????????????????????
    const validationError = validate(body);
    if (validationError) {
      return jsonResponse({ error: validationError }, 400);
    }

    // Clean phone to digits only
    const cleanPhone = body.cell_phone.replace(/\D/g, "");

    // Check if a verified referral member exists
    const hasVerifiedReferral = !!(body.referral_member_id && body.referral_member_id > 0);

    // ?? Step 2: Try to save to Supabase (non-blocking on failure) ????????????
    // If Supabase is down, we continue to CRM anyway and send an alert
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let booking: { id: number } | null = null;
    let supabaseError: string | null = null;
    let supabaseAvailable = true;

    try {
      const { data: bookingData, error: insertError } = await supabase
        .from("tour_bookings")
        .insert({
          first_name: body.first_name.trim(),
          last_name: body.last_name.trim(),
          email: body.email.trim().toLowerCase(),
          cell_phone: cleanPhone,
          preferred_date: body.preferred_date,
          preferred_time: body.preferred_time,
          how_heard: body.how_heard || null,
          referral_member: body.referral_member || null,
          referral_member_id: body.referral_member_id || null,
          interests: body.interests || null,
          note: body.note || null,
          gender: body.gender || null,
          send_texts: body.send_texts || "1",
          send_calls: body.send_calls || "1",
          send_emails: body.send_emails || "now",
          source_page: body.source_page || null,
          device_type: body.device_type || null,
          utm_source: body.utm_source || null,
          utm_medium: body.utm_medium || null,
          utm_campaign: body.utm_campaign || null,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        supabaseError = insertError.message;
        supabaseAvailable = false;
      } else {
        booking = bookingData;
        console.log("Booking saved to Supabase, ID:", booking?.id);
      }
    } catch (sbErr) {
      console.error("Supabase connection error:", sbErr);
      supabaseError = sbErr instanceof Error ? sbErr.message : "Connection failed";
      supabaseAvailable = false;
    }

    // If Supabase failed, log it but continue to CRM
    if (!supabaseAvailable) {
      console.warn("?? Supabase unavailable ? continuing to CRM anyway");
    }

    // ?? Step 3: Create Lead + Start Track in Engage Pro ???????????????????????
    // Uses the CONFIRMED WORKING approach:
    //   POST /api/engage/start
    //   X-API-KEY header + application/x-www-form-urlencoded body
    //   Creates lead AND starts Track 11 (Web General Inquiry) in one call
    let prospectId: number | null = null;
    let syncError: string | null = null;

    try {
      // Build the note with context
      const noteLines: string[] = [];
      if (body.how_heard) noteLines.push(`How heard: ${body.how_heard}`);
      if (body.referral_member)
        noteLines.push(`Referred by: ${body.referral_member}`);
      if (body.interests) noteLines.push(`Interests: ${body.interests}`);
      if (body.note) noteLines.push(`Message: ${body.note}`);
      noteLines.push(
        `Tour requested: ${body.preferred_date} at ${body.preferred_time}`
      );
      noteLines.push(`Source: ${body.source_page || "website"}`);
      if (body.device_type) noteLines.push(`Device: ${body.device_type}`);

      // Build form-urlencoded payload
      // If a verified referral member exists, set JoinType to "Referral"
      const formFields: Record<string, string> = {
        Subdomain: SUBDOMAIN,
        Account: ACCOUNT,
        ClubID: CLUB_ID,
        TrackID: TRACK_ID,
        LeadSource: hasVerifiedReferral ? "Lead - Referral" : LEAD_SOURCE,
        JoinType: hasVerifiedReferral ? "Referral" : JOIN_TYPE,
        FirstName: body.first_name.trim(),
        LastName: body.last_name.trim(),
        Email: body.email.trim().toLowerCase(),
        CellPhone: cleanPhone,
        SendTexts: body.send_texts || "1",   // default: opted IN (form has opt-in verbiage)
        SendCalls: body.send_calls || "1",   // default: opted IN
        SendEmails: body.send_emails || "now", // default: opted IN
        Note: noteLines.join(" | "),
      };

      // Add optional fields if present
      if (body.gender) formFields.Gender = body.gender;
      if (body.interests) formFields.Interest = body.interests;

      const urlEncoded = Object.entries(formFields)
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
        )
        .join("&");

      console.log("Sending to Engage Pro:", ENGAGE_URL);
      console.log("Fields:", Object.keys(formFields).join(", "));

      const engageRes = await fetch(ENGAGE_URL, {
        method: "POST",
        headers: {
          "X-API-KEY": ENGAGE_API_KEY,
          "user-agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlEncoded,
      });

      const engageData = await engageRes.json();
      console.log(
        "Engage Pro response:",
        engageRes.status,
        JSON.stringify(engageData)
      );

      if (engageRes.ok && engageData.status === true) {
        // New lead created and track started
        prospectId = engageData.data?.UserID || null;
        console.log("Lead created! UserID:", prospectId);
      } else if (
        engageRes.ok &&
        engageData.message?.includes("already on track")
      ) {
        // Lead already exists in CRM and is already on this track ? treat as success
        // BUT we need their real UserID to check for existing appointments
        prospectId = engageData.data?.UserID || null;
        console.log("Lead already exists and is on track ? treating as success, UserID:", prospectId);

        // If no UserID returned, look up the lead by email to get their ID
        if (!prospectId || prospectId <= 0) {
          try {
            console.log("Looking up existing lead by email to get UserID...");
            const searchRes = await fetch(MEMBER_SEARCH_URL, {
              method: "POST",
              headers: {
                "X-API-KEY": ENGAGE_API_KEY,
                "user-agent": USER_AGENT,
                "Content-Type": "application/json",
                accept: "*/*",
              },
              body: JSON.stringify({
                Subdomain: SUBDOMAIN,
                Account: parseInt(ACCOUNT),
                ClubID: parseInt(CLUB_ID),
                Email: body.email.trim().toLowerCase(),
              }),
            });

            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.status === true && searchData.data?.ID) {
                prospectId = searchData.data.ID;
                console.log("Found existing lead! UserID:", prospectId);
              }
            }
          } catch (searchErr) {
            console.warn("Could not look up existing lead:", searchErr);
          }
        }

        // /api/member/search only finds MEMBERS, not leads/prospects. If the
        // UserID is still unresolved, recover it from the prospect's calendar
        // event — those carry the member's ID and Email, so this works for leads.
        if (!prospectId || prospectId <= 0) {
          const byCal = await findExistingTourEvent({
            email: body.email,
            phone: body.cell_phone,
            firstName: body.first_name,
            lastName: body.last_name,
          });
          if (byCal?.memberId) {
            prospectId = parseInt(byCal.memberId);
            console.log("Recovered UserID from calendar (phone/email/name):", prospectId);
          }
        }
      } else {
        syncError =
          engageData.message ||
          engageData.error ||
          `API returned ${engageRes.status}`;
        console.error("Engage Pro error:", syncError);
      }
    } catch (crmErr) {
      syncError =
        crmErr instanceof Error ? crmErr.message : "CRM sync failed";
      console.error("CRM sync error:", crmErr);
    }

    // ?? Step 4: Book or Reschedule Tour Appointment ??????????????????????????
    //
    // RESCHEDULE LOGIC:
    //   1. First, check if this prospect already has a scheduled appointment
    //   2. If YES ? update the existing appointment with new date/time (reschedule)
    //   3. If NO ? create new interview + update to Tour type (new booking)
    //
    // For new bookings (three-step):
    //   Step 4a: /api/interview/schedule ? creates event + returns InterviewID
    //   Step 4b: GET /api/calendar       ? find the calendar event ID
    //   Step 4c: /api/calendar/update    ? set Type="Tour", Status="Scheduled"
    //
    let appointmentId: number | null = null;
    let interviewId: number | null = null;
    let isReschedule = false;

    if (prospectId && prospectId > 0) {
      const startTime24 = parseTime(body.preferred_time);
      const startDateTime = `${body.preferred_date} ${startTime24}`;
      const endTime24 = addMinutes(startTime24, APPOINTMENT_DURATION_MIN);

      // ?? Step 4-PRE: Check for existing scheduled appointment ???????????????
      let existingAppointmentId: string | null = null;

      try {
        // Search for appointments in a wide date range (next 30 days)
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const startSearch = today.toISOString().split("T")[0];
        const endSearch = futureDate.toISOString().split("T")[0];

        const checkUrl = `${CALENDAR_GET_URL}?Subdomain=${SUBDOMAIN}&Account=${ACCOUNT}&ClubID=${CLUB_ID}&start=${startSearch}&end=${endSearch}&type=all`;

        console.log("Step 4-PRE ? Checking for existing appointments:", checkUrl);

        const checkRes = await fetch(checkUrl, {
          method: "GET",
          headers: {
            "X-API-KEY": ENGAGE_API_KEY,
            "user-agent": USER_AGENT,
          },
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          console.log("Calendar check ? total events found:", Array.isArray(checkData) ? checkData.length : 0);

          if (Array.isArray(checkData) && checkData.length > 0) {
            // All non-cancelled tour-type events for this prospect. String-safe ID
            // compare; lowercase status. Rescheduled "ghosts" ARE eligible (moving
            // them forward cleans them up); only cancelled events are excluded.
            const pid = String(prospectId);
            const startOf = (e: Record<string, unknown>) =>
              String(e.start ?? e.Start ?? e.StartTime ?? "");
            const candidates = (checkData as Record<string, unknown>[]).filter((e) => {
              const members = e.members;
              const hasProspect = Array.isArray(members) &&
                (members as Record<string, unknown>[]).some((m) => String(m?.ID) === pid);
              if (!hasProspect) return false;
              const type = String(e.Type ?? e.type ?? "");
              const name = String(e.Name ?? e.name ?? e.title ?? "").toLowerCase();
              const eid = String(e.EventID ?? "");
              const isTourish = type === "Tour" || type === "Interview" ||
                type === "Consultation" || name.includes("tour") ||
                name.includes("consultation") || eid.startsWith("I-");
              if (!isTourish) return false;
              const status = String(e.Status ?? e.status ?? "").toLowerCase();
              return !status.includes("cancel");
            });

            if (candidates.length > 0) {
              // Deterministic pick: earliest upcoming, else most recent.
              candidates.sort((a, b) => startOf(a).localeCompare(startOf(b)));
              const todayStr = new Date().toISOString().split("T")[0];
              const chosen = candidates.find((e) => startOf(e) >= todayStr) ??
                candidates[candidates.length - 1];
              existingAppointmentId = String(chosen.id ?? chosen.ID);
              isReschedule = true;
              console.log("Found existing appointment to reschedule! ID:",
                existingAppointmentId, "Current start:", startOf(chosen));
            }
          }
        }
      } catch (checkErr) {
        console.warn("Error checking for existing appointments:", checkErr);
        // Continue with new booking flow if check fails
      }

      // ?? RESCHEDULE PATH: Update existing appointment ????????????????????????
      if (isReschedule && existingAppointmentId) {
        try {
          const referralNote = hasVerifiedReferral ? ` | Referred by: ${body.referral_member}` : "";
          const reschedulePayload = {
            Subdomain: SUBDOMAIN,
            Account: parseInt(ACCOUNT),
            ClubID: parseInt(CLUB_ID),
            ID: parseInt(existingAppointmentId),
            Name: APPOINTMENT_TYPE,
            Type: APPOINTMENT_TYPE,
            Status: "Scheduled",
            StartTime: startDateTime,
            EndTime: `${body.preferred_date} ${endTime24}`,
            Duration: APPOINTMENT_DURATION_MIN,
            Note: `Tour RESCHEDULED via website | New time: ${body.preferred_date} at ${body.preferred_time}${referralNote}`,
          };

          console.log("RESCHEDULE ? Updating existing appointment:", JSON.stringify(reschedulePayload));

          const reschedRes = await fetch(CALENDAR_UPDATE_URL, {
            method: "POST",
            headers: {
              "X-API-KEY": ENGAGE_API_KEY,
              "user-agent": USER_AGENT,
              "Content-Type": "application/json",
              accept: "*/*",
            },
            body: JSON.stringify(reschedulePayload),
          });

          const reschedData = await reschedRes.json();
          console.log("Reschedule response:", reschedRes.status, JSON.stringify(reschedData));

          if (reschedRes.ok && reschedData.status === true) {
            appointmentId = parseInt(existingAppointmentId);
            console.log("Tour appointment RESCHEDULED! ID:", appointmentId);
          } else {
            const reschedError = reschedData.message || reschedData.error || "Unknown reschedule error";
            console.warn("Reschedule issue:", reschedError);
            syncError = (syncError ? syncError + "; " : "") + "Reschedule: " + reschedError;
            // Do NOT fall back to a duplicate booking. Leave appointmentId null so
            // the response reports failure and the customer can pick another time.
          }
        } catch (reschedErr) {
          const reschedErrMsg = reschedErr instanceof Error ? reschedErr.message : "Reschedule failed";
          console.warn("Reschedule error:", reschedErrMsg);
          syncError = (syncError ? syncError + "; " : "") + "Reschedule: " + reschedErrMsg;
          // Do NOT fall back to a duplicate booking. Leave appointmentId null so
          // the response reports failure and the customer can pick another time.
        }
      }

      // ?? NEW BOOKING PATH: Create interview + update to Tour ?????????????????
      if (!isReschedule) {
        // ?? Step 4a: Create interview record ???????????????????????????????????
        try {
          const interviewPayload = {
            Subdomain: SUBDOMAIN,
            Account: parseInt(ACCOUNT),
            ClubID: parseInt(CLUB_ID),
            ID: prospectId,
            Email: body.email.trim().toLowerCase(),
            CellPhone: cleanPhone,
            TimeStamp: startDateTime,
            StaffID: STAFF_ID,
            Duration: APPOINTMENT_DURATION_MIN,
          };

          console.log("Step 4a ? Creating interview:", JSON.stringify(interviewPayload));

          const intRes = await fetch(INTERVIEW_URL, {
            method: "POST",
            headers: {
              "X-API-KEY": ENGAGE_API_KEY,
              "user-agent": USER_AGENT,
              "Content-Type": "application/json",
              accept: "*/*",
            },
            body: JSON.stringify(interviewPayload),
          });

          const intData = await intRes.json();
          console.log("Interview response:", intRes.status, JSON.stringify(intData));

          if (intRes.ok && intData.status === true) {
            interviewId = intData.data?.InterviewID || null;
            console.log("Interview created! InterviewID:", interviewId);
          } else if (typeof intData.message === "string" &&
                     intData.message.toLowerCase().includes("already exists")) {
            // CRM already has an event for this prospect that Step 4-PRE didn't
            // surface (indexing lag / odd status). Recover: locate it and reschedule
            // it to the requested time instead of dead-ending the booking.
            console.warn("Interview says event already exists - recovering via lookup + reschedule");
            const recover = await findExistingTourEvent({
              prospectId,
              phone: body.cell_phone,
              firstName: body.first_name,
              lastName: body.last_name,
            });
            if (recover) {
              const recoverNote =
                `Tour RESCHEDULED via website | New time: ${body.preferred_date} at ${body.preferred_time}` +
                (hasVerifiedReferral ? ` | Referred by: ${body.referral_member}` : "");
              const recoverResult = await updateEventToScheduledTour(
                recover.id, startDateTime, `${body.preferred_date} ${endTime24}`, recoverNote,
              );
              if (recoverResult.ok) {
                appointmentId = parseInt(recover.id);
                isReschedule = true;
                console.log("Recovered + rescheduled existing event! ID:", appointmentId);
              } else {
                syncError = (syncError ? syncError + "; " : "") + "Recovery: " + recoverResult.error;
              }
            } else {
              syncError = (syncError ? syncError + "; " : "") +
                "Interview: event exists but could not be located";
            }
          } else {
            const intError = intData.message || intData.error || "Unknown interview error";
            console.warn("Interview creation issue:", intError);
            syncError = (syncError ? syncError + "; " : "") + "Interview: " + intError;
          }
        } catch (intErr) {
          const intErrMsg = intErr instanceof Error ? intErr.message : "Interview creation failed";
          console.warn("Interview error:", intErrMsg);
          syncError = (syncError ? syncError + "; " : "") + "Interview: " + intErrMsg;
        }

        // ?? Step 4b: Find the calendar event that was just created ???????????
        // The CRM may not index the event immediately, so retry with delays.
        let calendarEventId: string | null = null;
        const RETRY_DELAYS_MS = [1500, 2500, 3000];

        if (interviewId) {
          const calUrl = `${CALENDAR_GET_URL}?Subdomain=${SUBDOMAIN}&Account=${ACCOUNT}&ClubID=${CLUB_ID}&start=${body.preferred_date}&end=${body.preferred_date}&ID=${prospectId}&type=all`;

          for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
            await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
            try {
              console.log(`Step 4b ? Fetching calendar events (attempt ${attempt + 1}/${RETRY_DELAYS_MS.length}):`, calUrl);

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

                if (Array.isArray(calData) && calData.length > 0) {
                  // Match STRICTLY by the EventID of the interview we just created.
                  // No member-match or last-event fallback — those can latch onto an
                  // unrelated/older event and corrupt it. If not found yet, the retry
                  // loop continues; if never found, we update nothing (safe).
                  const matchingEvent = calData.find(
                    (e: Record<string, unknown>) => String(e.EventID) === `I-${interviewId}`
                  );

                  if (matchingEvent) {
                    calendarEventId = String(matchingEvent.id);
                    console.log("Found calendar event by EventID I-" + interviewId + ", ID:", calendarEventId);
                    break;
                  }
                }
              }
            } catch (calErr) {
              console.warn(`Calendar fetch error (attempt ${attempt + 1}):`, calErr);
            }

            if (attempt < RETRY_DELAYS_MS.length - 1) {
              console.log("Event not found yet, retrying...");
            }
          }
        }

        // ?? Step 4c: Update the event to Tour type + Scheduled status ?????????
        if (calendarEventId) {
          try {
            const referralNote = hasVerifiedReferral ? ` | Referred by: ${body.referral_member}` : "";
            const updatePayload = {
              Subdomain: SUBDOMAIN,
              Account: parseInt(ACCOUNT),
              ClubID: parseInt(CLUB_ID),
              ID: parseInt(calendarEventId),
              Name: APPOINTMENT_TYPE,
              Type: APPOINTMENT_TYPE,
              Status: "Scheduled",
              StartTime: startDateTime,
              EndTime: `${body.preferred_date} ${endTime24}`,
              Duration: APPOINTMENT_DURATION_MIN,
              Note: `Tour booked via website | ${body.preferred_date} at ${body.preferred_time}${referralNote}`,
            };

            console.log("Step 4c ? Updating appointment:", JSON.stringify(updatePayload));

            const updRes = await fetch(CALENDAR_UPDATE_URL, {
              method: "POST",
              headers: {
                "X-API-KEY": ENGAGE_API_KEY,
                "user-agent": USER_AGENT,
                "Content-Type": "application/json",
                accept: "*/*",
              },
              body: JSON.stringify(updatePayload),
            });

            const updText = await updRes.text();
            console.log("Calendar update response:", updRes.status, updText);

            // The CRM may return an empty body on success
            let updData: Record<string, unknown> = {};
            if (updText.trim()) {
              try { updData = JSON.parse(updText); } catch { /* non-JSON is fine */ }
            }

            if (updRes.ok && (updData.status === true || !updText.trim())) {
              appointmentId = parseInt(calendarEventId);
              console.log("Tour appointment updated! ID:", appointmentId);
            } else {
              const updError = updData.message || updData.error || `HTTP ${updRes.status}`;
              console.warn("Calendar update issue:", updError);
              syncError = (syncError ? syncError + "; " : "") + "CalendarUpdate: " + updError;
            }
          } catch (updErr) {
            const updErrMsg = updErr instanceof Error ? updErr.message : "Calendar update failed";
            console.warn("Calendar update error:", updErrMsg);
            syncError = (syncError ? syncError + "; " : "") + "CalendarUpdate: " + updErrMsg;
          }
        } else if (interviewId) {
          console.warn("Could not find calendar event to update ? appointment stays as Consultation");
          syncError = (syncError ? syncError + "; " : "") + "CalendarUpdate: Could not find event to update";
        }
      }
    }

    // ?? Step 5: Process Referral (if verified member referral) ??????????????????
    //
    // If a verified referral member ID was provided:
    //   a. Look up the referring member to get their RefID
    //   b. Create a CRM connection (referrer ? referee)
    //   c. Save to tour_referrals table in Supabase
    //
    let referralSaved = false;
    let connectionCreated = false;
    let referralTrackStarted = false;

    if (hasVerifiedReferral && prospectId && prospectId > 0) {
      try {
        console.log("Step 5 ? Processing referral from member ID:", body.referral_member_id);

        // 5a: Get the referring member's details
        // The front-end already captured this during validation, so use it directly.
        let referrerRefId: string | null = body.referral_member_ref_id || null;
        let referrerEmail: string | null = body.referral_member_email || null;
        let referrerPhone: string | null = body.referral_member_phone || null;

        console.log("Referrer details from frontend ? RefID:", referrerRefId, "Email:", referrerEmail, "Phone:", referrerPhone);

        if (!referrerRefId) {
          // Fall back: look up the member by ID to get their RefID
          try {
            const memberRes = await fetch(MEMBER_SEARCH_URL, {
              method: "POST",
              headers: {
                "X-API-KEY": ENGAGE_API_KEY,
                "user-agent": USER_AGENT,
                "Content-Type": "application/json",
                accept: "*/*",
              },
              body: JSON.stringify({
                Subdomain: SUBDOMAIN,
                Account: parseInt(ACCOUNT),
                ClubID: parseInt(CLUB_ID),
                Email: body.email.trim().toLowerCase(), // search by the referrer's email
              }),
            });

            if (memberRes.ok) {
              const ct = memberRes.headers.get("content-type") || "";
              if (ct.includes("json")) {
                const memberData = await memberRes.json();
                if (memberData.status === true && memberData.data) {
                  referrerRefId = memberData.data.RefID || memberData.data.ExID || null;
                  referrerEmail = memberData.data.Email || null;
                  referrerPhone = memberData.data.CellPhone || null;
                  console.log("Referrer details (fallback) ? RefID:", referrerRefId);
                }
              }
            }
          } catch (memberErr) {
            console.warn("Could not look up referrer details:", memberErr);
          }
        } else {
          console.log("Using RefID from front-end validation:", referrerRefId);
        }

        // 5b: Create CRM connection (referrer ? referee)
        if (referrerRefId) {
          try {
            const connPayload = {
              Subdomain: SUBDOMAIN,
              Account: parseInt(ACCOUNT),
              ClubID: parseInt(CLUB_ID),
              UserID: prospectId,
              ConnectionRefID: parseInt(referrerRefId),
              Relationship: "Referral",
            };

            console.log("Step 5b ? Creating CRM connection:", JSON.stringify(connPayload));

            const connRes = await fetch(CONNECTION_URL, {
              method: "POST",
              headers: {
                "X-API-KEY": ENGAGE_API_KEY,
                "user-agent": USER_AGENT,
                "Content-Type": "application/json",
                accept: "*/*",
              },
              body: JSON.stringify(connPayload),
            });

            const connData = await connRes.json();
            console.log("Connection response:", connRes.status, JSON.stringify(connData));

            if (connRes.ok && connData.status !== false) {
              connectionCreated = true;
              console.log("CRM connection created successfully!");
            } else {
              console.warn("Connection creation issue:", connData.message || connData.error);
            }
          } catch (connErr) {
            console.warn("Connection creation error:", connErr);
          }
        }

        // 5c: Start "Tour Referral" track on the REFERRER (notify them someone they referred booked)
        // Use /api/engage/start with the member's ID - works for both members and leads
        if (body.referral_member_id) {
          try {
            console.log("Starting Tour Referral track (ID:", REFERRAL_TRACK_ID, ") on member ID:", body.referral_member_id);

            // Use /api/engage/start with JSON payload - this is the correct endpoint per API docs
            const trackPayload = {
              Subdomain: SUBDOMAIN,
              Account: parseInt(ACCOUNT),
              ClubID: parseInt(CLUB_ID),
              TrackID: parseInt(REFERRAL_TRACK_ID),
              ID: body.referral_member_id, // UserID of the referring member
            };

            console.log("Track start payload:", JSON.stringify(trackPayload));

            // Use the ENGAGE_START_URL endpoint (same as /api/engage/start)
            const engageStartUrl = `${ENGAGE_BASE}/api/engage/start`;

            const trackRes = await fetch(engageStartUrl, {
              method: "POST",
              headers: {
                "X-API-KEY": ENGAGE_API_KEY,
                "user-agent": USER_AGENT,
                "Content-Type": "application/json",
                accept: "*/*",
              },
              body: JSON.stringify(trackPayload),
            });

            const trackData = await trackRes.json();
            console.log("Referral track response:", trackRes.status, JSON.stringify(trackData));

            // Check for success - status:true or "already on track" message
            if (trackRes.ok && (trackData.status === true || trackData.message?.includes("already on track"))) {
              referralTrackStarted = true;
              console.log("Tour Referral track started on referrer member!");

              // Send email notification about the referral
              await sendReferralNotification(
                body.referral_member || "Unknown Member",
                body.first_name.trim(),
                body.last_name.trim(),
                body.email.trim().toLowerCase(),
                body.preferred_date,
                body.preferred_time
              );
            } else {
              console.warn("Referral track start issue:", trackData.message || trackData.error || JSON.stringify(trackData));
            }
          } catch (trackErr) {
            console.warn("Referral track start error:", trackErr);
          }
        }

        // 5d: Save to tour_referrals table in Supabase (only if Supabase is available)
        if (booking) {
          try {
            const { error: refInsertError } = await supabase
              .from("tour_referrals")
              .insert({
                booking_id: booking.id,
              referee_first_name: body.first_name.trim(),
              referee_last_name: body.last_name.trim(),
              referee_email: body.email.trim().toLowerCase(),
              referee_phone: cleanPhone,
              referee_crm_id: prospectId,
              referrer_name: body.referral_member || "Unknown",
              referrer_email: referrerEmail,
              referrer_phone: referrerPhone,
              referrer_crm_id: body.referral_member_id,
              referrer_ref_id: referrerRefId,
              connection_created: connectionCreated,
              referrer_track_started: referralTrackStarted,
              status: "pending",
            });

            if (refInsertError) {
              console.warn("Referral insert error:", refInsertError.message);
            } else {
              referralSaved = true;
              console.log("Referral saved to Supabase!");
            }
          } catch (refErr) {
            console.warn("Referral save error:", refErr);
          }
        } else {
          console.warn("Skipping referral save ? Supabase unavailable");
        }
      } catch (refProcessErr) {
        console.warn("Referral processing error:", refProcessErr);
        // Non-fatal ? the booking itself still succeeded
      }
    }

    // ?? Step 6: Update Supabase with CRM results (if available) ???????????????
    const finalStatus = prospectId ? "confirmed" : "failed";

    if (booking) {
      try {
        await supabase
          .from("tour_bookings")
          .update({
            engage_pro_prospect_id: prospectId,
            engage_pro_appointment_id: appointmentId,
            engage_pro_synced: !!prospectId,
            engage_pro_sync_error: syncError,
            engage_pro_synced_at: prospectId ? new Date().toISOString() : null,
            status: finalStatus,
          })
          .eq("id", booking.id);
        console.log("Supabase record updated with CRM results");
      } catch (updateErr) {
        console.warn("Failed to update Supabase record:", updateErr);
      }
    }

    // ?? Step 7: Send alert if Supabase failed ????????????????????????????????
    if (!supabaseAvailable && supabaseError) {
      await sendFailureAlert(body, supabaseError, !!prospectId, prospectId);
    }

    // ?? Step 8: Return Response ???????????????????????????????????????????????
    // Success if CRM worked, regardless of Supabase status
    // A booking only counts as success if an actual appointment exists (created or
    // rescheduled). A lead with no appointment is a failure — not a silent "booked".
    const crmWorked = !!prospectId && !!appointmentId;

    if (crmWorked) {
      return jsonResponse({
        success: true,
        booking_id: booking?.id || null,
        status: finalStatus,
        crm_synced: true,
        appointment_created: !!appointmentId,
        appointment_rescheduled: isReschedule,
        referral_saved: referralSaved,
        connection_created: connectionCreated,
        referral_track_started: referralTrackStarted,
        supabase_available: supabaseAvailable,
        message: isReschedule
          ? "Tour rescheduled successfully! You'll receive an updated confirmation shortly."
          : "Tour booked successfully! You'll receive a confirmation shortly.",
      });
    } else {
      // Both Supabase and CRM failed ? this is a real failure
      return jsonResponse({
        success: false,
        error: "Unable to complete booking. Please try again or call us directly.",
        detail: syncError || "CRM sync failed",
      }, 500);
    }
  } catch (err) {
    console.error("Unhandled error:", err);
    return jsonResponse(
      {
        error: "Something went wrong. Please try again.",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      500
    );
  }
});
