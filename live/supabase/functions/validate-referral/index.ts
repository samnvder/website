// ============================================================================
// VALIDATE REFERRAL — Supabase Edge Function
// ============================================================================
// Searches Engage Pro MEMBERS (not leads/prospects) by email or phone to
// validate a referral. Name-only input is noted but cannot be matched via
// the API — /member/search only supports Email or CellPhone.
//
// Search types:
//   - "email"  → /member/search (Email field)
//   - "phone"  → /member/search (CellPhone field)
//   - "name"   → Cannot match via API — returns a "noted" response
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ENGAGE_API_KEY = Deno.env.get("ENGAGE_PRO_API_KEY")!;
const ENGAGE_BASE_URL = "https://api.vfpnext.com";
const SUBDOMAIN = "racquetandhealthclubs";
const ACCOUNT = "21582374";
const CLUB_ID = "1";
const USER_AGENT = "SouthEndClub/1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  data: Record<string, unknown>,
  status = 200
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { search_type, search_value } = await req.json();

    if (!search_value?.trim()) {
      return jsonResponse(
        { found: false, message: "Search value is required" },
        400
      );
    }

    // ── Name search — can't match via API, just note it ─────────────
    if (search_type === "name") {
      console.log("Name-only referral (cannot match via API):", search_value);
      return jsonResponse({
        found: false,
        noted: true,
        message: "We'll note the referral. For an instant match, try their email or phone.",
      });
    }

    // ── Email or Phone — search /member/search ──────────────────────
    const searchBody: Record<string, unknown> = {
      Subdomain: SUBDOMAIN,
      Account: parseInt(ACCOUNT),
      ClubID: parseInt(CLUB_ID),
    };

    if (search_type === "phone") {
      // Strip everything except digits
      let digits = search_value.replace(/\D/g, "");
      // Normalize to +1XXXXXXXXXX (CRM storage format)
      // "3104935197"   → 10 digits → "+13104935197"
      // "13104935197"  → 11 digits starting with 1 → "+13104935197"
      // "+3104935197"  → 10 digits (+ stripped) → "+13104935197"
      // "+13104935197" → 11 digits starting with 1 → "+13104935197"
      // "310-493-5197" → 10 digits → "+13104935197"
      if (digits.length === 10) {
        digits = "+1" + digits;
      } else if (digits.length === 11 && digits.startsWith("1")) {
        digits = "+" + digits;
      } else {
        // Fallback: just prepend + if not already there
        digits = "+" + digits;
      }
      searchBody.CellPhone = digits;
      console.log("Searching member by phone:", searchBody.CellPhone);
    } else {
      searchBody.Email = search_value.trim();
      console.log("Searching member by email:", searchBody.Email);
    }

    const res = await fetch(`${ENGAGE_BASE_URL}/api/member/search`, {
      method: "POST",
      headers: {
        "X-API-KEY": ENGAGE_API_KEY,
        "user-agent": USER_AGENT,
        "Content-Type": "application/json",
        accept: "*/*",
      },
      body: JSON.stringify(searchBody),
    });

    // Check for non-JSON response
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      console.error("Non-JSON response from /member/search:", res.status);
      return jsonResponse({
        found: false,
        message: "Member search unavailable — we'll follow up manually.",
      });
    }

    const data = await res.json();
    console.log("Member search response:", res.status, JSON.stringify(data));

    // Extract results — API returns { status: true, data: { ... } } for a match
    let member: Record<string, unknown> | null = null;
    if (data?.status === true && data?.data && typeof data.data === "object" && !Array.isArray(data.data)) {
      // Single member object
      member = data.data as Record<string, unknown>;
    } else if (Array.isArray(data)) {
      member = data.length > 0 ? (data[0] as Record<string, unknown>) : null;
    } else if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
      member = data.data[0] as Record<string, unknown>;
    }

    if (member) {
      const firstName = (member.FirstName || member.first_name || "") as string;
      const lastName = (member.LastName || member.last_name || "") as string;
      const memberId = (member.ID || member.id || 0) as number;
      const refId = (member.RefID || member.ExID || "") as string;
      const email = (member.Email || member.email || "") as string;
      const cellPhone = (member.CellPhone || member.cell_phone || "") as string;

      console.log("Member found:", firstName, lastName, "ID:", memberId, "RefID:", refId, "Email:", email);
      return jsonResponse({
        found: true,
        member: {
          id: memberId,
          first_name: firstName,
          last_name: lastName,
          ref_id: refId,
          email: email,
          cell_phone: cellPhone,
        },
        message: `Found member: ${firstName} ${lastName}`,
      });
    } else {
      console.log("No member found for:", search_value);
      return jsonResponse({
        found: false,
        message: "No member found with that information.",
      });
    }
  } catch (err) {
    console.error("Referral validation error:", err);
    return jsonResponse(
      {
        found: false,
        error: "Validation service unavailable",
      },
      500
    );
  }
});
