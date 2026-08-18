# -*- coding: utf-8 -*-
"""
Regenerates security/2026-08-18-supabase-rls-exposure.pdf

Security audit record for the RLS exposure on Supabase project
zngbawafqjntciafhxgr: finding, root cause, remediation and verification.

Deliberately contains NO customer PII and NO API keys -- row counts, policy
definitions and HTTP status codes only. See security/README.md.

Run:  python security/generate-rls-audit-record.py
"""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, HRFlowable)

OUT = "security/2026-08-18-supabase-rls-exposure.pdf"

ss = getSampleStyleSheet()
H1 = ParagraphStyle('H1', parent=ss['Title'], fontSize=17, leading=21,
                    alignment=0, spaceAfter=2, textColor=colors.HexColor('#1a1a1a'))
SUB = ParagraphStyle('SUB', parent=ss['Normal'], fontSize=9.5, leading=13,
                     textColor=colors.HexColor('#666666'), spaceAfter=10)
H2 = ParagraphStyle('H2', parent=ss['Heading2'], fontSize=12, leading=15,
                    spaceBefore=14, spaceAfter=5, textColor=colors.HexColor('#8a1a1a'))
BODY = ParagraphStyle('BODY', parent=ss['Normal'], fontSize=9.5, leading=13.5,
                      spaceAfter=6)
MONO = ParagraphStyle('MONO', parent=ss['Code'], fontSize=7.6, leading=10.5,
                      leftIndent=10, textColor=colors.HexColor('#222222'),
                      backColor=colors.HexColor('#f4f4f4'), spaceBefore=3,
                      spaceAfter=7, borderPadding=5)
BULLET = ParagraphStyle('BULLET', parent=BODY, leftIndent=14, bulletIndent=4,
                        spaceAfter=3)
GOOD = ParagraphStyle('GOOD', parent=BODY, fontSize=9, leading=12.5,
                      backColor=colors.HexColor('#eaf6ea'), borderPadding=7,
                      borderWidth=0.5, borderColor=colors.HexColor('#7ab07a'))
NOTE = ParagraphStyle('NOTE', parent=BODY, fontSize=9, leading=12.5,
                      backColor=colors.HexColor('#fff8e1'), borderPadding=7,
                      borderWidth=0.5, borderColor=colors.HexColor('#e0c060'))
FOOT = ParagraphStyle('FOOT', parent=BODY, fontSize=8,
                      textColor=colors.HexColor('#777777'))

S = []


def p(t, st=BODY):
    S.append(Paragraph(t, st))


def bul(t):
    S.append(Paragraph(t, BULLET, bulletText='-'))


def mono(t):
    S.append(Paragraph(t.replace('\n', '<br/>').replace(' ', '&nbsp;'), MONO))


def rule():
    S.append(HRFlowable(width="100%", thickness=0.6,
                        color=colors.HexColor('#cccccc'),
                        spaceBefore=6, spaceAfter=6))


def table(data, widths, header=True):
    t = Table(data, colWidths=widths, hAlign='LEFT')
    style = [
        ('FONTSIZE', (0, 0), (-1, -1), 8.2),
        ('LEADING', (0, 0), (-1, -1), 10.5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#cccccc')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]
    if header:
        style += [('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ececec')),
                  ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold')]
    t.setStyle(TableStyle(style))
    S.append(t)
    S.append(Spacer(1, 8))


# ---------------------------------------------------------------- header
p("Security Audit Record: Supabase Row Level Security Exposure", H1)
p("South End Racquet &amp; Health Club (southendclub.com) &nbsp;|&nbsp; "
  "Supabase project <b>zngbawafqjntciafhxgr</b><br/>"
  "Found, remediated and verified: <b>2026-08-18</b> &nbsp;|&nbsp; "
  "Status: <b>REMEDIATED -- verified in production</b>", SUB)

p("<b>This document contains no customer personal data and no API keys.</b> "
  "Exposure is evidenced by row counts, policy definitions and HTTP status codes "
  "only. It is safe to store in the repository and to share with counsel or an insurer.",
  NOTE)
S.append(Spacer(1, 4))

# ---------------------------------------------------------------- summary
p("1. Summary", H2)
p("Two tables holding customer personal data were readable, modifiable and deletable "
  "by any member of the public. The cause was a single misconfigured Row Level Security "
  "policy on each table, granted to the Postgres <font face='Courier'>public</font> role "
  "instead of to <font face='Courier'>service_role</font>. Both policies have been "
  "replaced with correctly scoped equivalents and the closure verified against "
  "production.")
p("<b>Classification: broken access control (misconfigured authorisation policy). "
  "Not a credential leak.</b> The Supabase <font face='Courier'>anon</font> key that "
  "reached these tables is embedded in public page source by design, and its disclosure "
  "is not a defect. Rotating it would not have reduced the exposure and was explicitly "
  "excluded from remediation.")
p("Discovered incidentally on 2026-08-18 during unrelated work removing a test booking "
  "row. Deleting that row required no privileged access, which is what revealed the "
  "problem. There is no access log establishing whether the data was retrieved by a "
  "third party at any point before remediation; absence of evidence of retrieval is not "
  "evidence of absence. Whether the 231 affected individuals require notification is a "
  "disclosure decision for the owner and, if pursued, for counsel -- the club operates "
  "in California, so the CCPA applies, and the records carry marketing contact-consent "
  "flags.")

# ---------------------------------------------------------------- root cause
p("2. Root cause", H2)
p("Row Level Security was <b>already enabled on all 45 tables</b> in the "
  "<font face='Courier'>public</font> schema. The exposure did not come from RLS being "
  "switched off. It came from the content of two policies:")
mono("tablename       policyname                              roles       cmd  qual  with_check\n"
     "tour_bookings   Service role full access                {public}    ALL  true  true\n"
     "tour_referrals  Service role full access on referrals    {public}    ALL  true  true")
p("Both are named for the service role, but both are granted <b>TO "
  "<font face='Courier'>public</font></b>. In PostgreSQL, <font face='Courier'>public</font> "
  "is not a synonym for the service role -- it denotes <i>every</i> role, including the "
  "unauthenticated <font face='Courier'>anon</font> role used by the public website. "
  "Combined with <font face='Courier'>cmd = ALL</font> and an unconditional "
  "<font face='Courier'>qual = true</font>, each policy granted anonymous users "
  "unrestricted SELECT, INSERT, UPDATE and DELETE.")
p("The remaining 43 tables in the schema are written correctly, as "
  "<font face='Courier'>service_role_all ... {service_role}</font>. These two were the "
  "only tables in the database where the service-role policy was scoped to "
  "<font face='Courier'>public</font> -- consistent with a policy created without an "
  "explicit <font face='Courier'>TO</font> clause, which defaults to "
  "<font face='Courier'>public</font>, rather than with a deliberate grant.")
p("<b>The failure mode is worth recording separately from the incident.</b> The policy "
  "was not missing and did not look wrong in a listing: it carried a reassuring name "
  "describing the intent of its author. Any review that read policy names rather than "
  "policy roles would have passed this database. Naming is not access control.")

# ---------------------------------------------------------------- exposure
p("3. Exposure prior to remediation", H2)
p("Measured by live request against production using only the publicly published "
  "<font face='Courier'>anon</font> key, with a count-only probe "
  "(<font face='Courier'>select=id</font>, <font face='Courier'>Prefer: count=exact</font>, "
  "<font face='Courier'>Range: 0-0</font>) that returns totals in the response header and "
  "no row data.")
table([
    ["Table", "Rows", "Personal data held", "Anon access granted"],
    ["public.tour_bookings", "231",
     "First/last name, email, cell phone, preferred date and time, how-heard, "
     "interests, free-text note, gender, contact-consent flags, CRM prospect id, "
     "source page, UTM parameters",
     "SELECT, INSERT, UPDATE, DELETE"],
    ["public.tour_referrals", "30",
     "Name, email and phone for BOTH referrer and referee -- two identifiable "
     "individuals per row, including existing members",
     "SELECT, INSERT, UPDATE, DELETE"],
], [1.20 * inch, 0.40 * inch, 2.70 * inch, 1.60 * inch])
p("<b>Individuals affected: 231 prospects, plus up to 60 further parties across the "
  "30 referral records.</b>")
p("<b>Disclosure.</b> All of the above was retrievable by a single unauthenticated "
  "HTTP request.")
p("<b>Destruction.</b> An unfiltered DELETE would have emptied either table. This was "
  "aggravated by the absence of any restore path: the Supabase project is on the Free "
  "plan, which the dashboard confirms includes neither scheduled backups nor "
  "point-in-time recovery. Separately, WordPress-side server backups exist but cannot be "
  "restored under the free migration plugin's approximately 512 MB import cap, and the "
  "hosting provider's managed backups have never been tested -- and those cover "
  "WordPress, not Supabase. The records therefore existed, and still exist, in exactly "
  "one place.")
p("<b>Tampering.</b> UPDATE was open, so appointment dates and times could have been "
  "rewritten silently, producing a staff calendar disagreeing with confirmation emails "
  "already sent, with no audit trail to reconstruct the original values.")

# ---------------------------------------------------------------- methodology
p("4. Correction to the original assessment methodology", H2)
p("The original finding inferred write exposure from HTTP status codes, reasoning that "
  "a protected table returns 401 or 403 to a DELETE regardless of filter, while an "
  "unprotected one returns 204; both returned 204. <b>That inference is invalid and is "
  "recorded here so it is not relied upon again.</b>")
p("Under RLS, a DELETE matching no visible row does not error. It succeeds against zero "
  "rows and returns <font face='Courier'>204</font> -- indistinguishable from a genuinely "
  "open table. The same applies to UPDATE. A control confirmed this: "
  "<font face='Courier'>central_departments</font> grants "
  "<font face='Courier'>anon</font> exactly one policy, "
  "<font face='Courier'>anon_select_departments</font> (SELECT only), and provably has no "
  "anon DELETE or UPDATE policy -- yet returns:")
mono("central_departments    DELETE(no-match)=204    PATCH(no-match)=204")
p("Two further corrections follow from the same cause. An INSERT rejected with HTTP 400 "
  "for a NOT NULL violation does not demonstrate that insert was permitted, because "
  "PostgreSQL evaluates column constraints before the RLS <font face='Courier'>WITH "
  "CHECK</font> clause. And a pass criterion of \"every request must return 401 or 403\" "
  "is wrong for SELECT: a correctly protected table returns <font face='Courier'>200</font> "
  "with an empty result set, which is precisely how the 34 locked-down tables in this "
  "schema behave. Applying that criterion literally would cause a successful remediation "
  "to be misread as a failure.")
p("<b>The write exposure was nevertheless real</b> -- established from the policy "
  "definitions in section 2, which grant DELETE and UPDATE outright. The original "
  "conclusion was correct; only its evidence was unsound.")

# ---------------------------------------------------------------- schema
p("5. Full schema review", H2)
p("The remediation plan directed that the PostgREST root document be walked to "
  "enumerate exposed tables. <b>That method does not work on this project</b> -- the root "
  "endpoint rejects the <font face='Courier'>anon</font> key with HTTP 401 and the hint "
  "that only the service-role key may be used. An earlier fallback that guessed "
  "approximately 60 plausible table names found nothing beyond the three already known, "
  "which was misleading: it missed 42 tables that exist.")
p("Authoritative enumeration was instead obtained by privileged query "
  "(<font face='Courier'>pg_class</font> joined to <font face='Courier'>pg_namespace</font>), "
  "then confirmed empirically by probing all 45 tables with the anon key. This revealed a "
  "second application in the same database -- 43 tables prefixed "
  "<font face='Courier'>central_</font> -- entirely absent from the original finding.")
p("<b>Result: 34 of 45 tables correctly deny anonymous reads.</b> Eleven were readable. "
  "Of those, nine are intentional and appropriate; two were the exposure.")
table([
    ["Table", "Rows", "Assessment"],
    ["tour_bookings", "231", "EXPOSURE -- customer PII. Remediated (section 6)."],
    ["tour_referrals", "30", "EXPOSURE -- PII for two parties per row. Remediated."],
    ["central_events", "124", "Intentional. Policy restricts to published + public."],
    ["central_module_columns", "43", "Reference/configuration data. Not sensitive."],
    ["central_departments", "12", "Non-sensitive operational data. Unconditional read."],
    ["central_option_lists", "9", "Configuration data. Not sensitive."],
    ["central_form_definitions", "7", "Form schemas. Unconditional read."],
    ["central_clubs", "3", "Club records. Unconditional read. See note below."],
    ["central_organizations", "3", "Organisation records. Unconditional read."],
    ["central_classes / central_polls / central_surveys", "1 each",
     "Intentional. Each gated on published status."],
], [1.85 * inch, 0.45 * inch, 3.60 * inch])
p("<b>Observation for later attention, not part of this incident.</b> The policy on "
  "<font face='Courier'>central_clubs</font> is named \"Anon can read clubs by slug\" but "
  "carries <font face='Courier'>qual = true</font>, so it returns every club rather than "
  "one matched by slug. The data is non-sensitive and the row count is 3, so this is not "
  "urgent. It is noted because it is the same class of defect as the root cause: a policy "
  "whose name asserts a restriction its definition does not implement.")

# ---------------------------------------------------------------- fix
p("6. Remediation applied", H2)
p("Each miswritten policy was dropped and replaced with an equivalent scoped to "
  "<font face='Courier'>service_role</font>, matching the pattern already used correctly "
  "by the other 43 tables:")
mono('drop policy "Service role full access" on public.tour_bookings;\n'
     'create policy "service_role_all" on public.tour_bookings\n'
     '  for all to service_role using (true) with check (true);\n\n'
     'drop policy "Service role full access on referrals" on public.tour_referrals;\n'
     'create policy "service_role_all" on public.tour_referrals\n'
     '  for all to service_role using (true) with check (true);')
p("<b>One pre-existing policy was deliberately left in place:</b> "
  "<font face='Courier'>\"Anon can insert bookings\"</font> on "
  "<font face='Courier'>tour_bookings</font> ({anon}, INSERT, "
  "<font face='Courier'>with_check = true</font>). It grants no "
  "<font face='Courier'>USING</font> clause and therefore no read, so it cannot disclose "
  "or destroy data; its worst case is injection of spurious rows. Retaining it meant the "
  "remediation could not break the booking flow under any hypothesis, including the "
  "competing one considered in section 7. Closing a disclosure and destruction hole "
  "immediately, and evaluating a low-severity spam vector separately, was judged the "
  "correct order of operations. <b>It remains open and is listed in section 9.</b>")
p("The exact rollback was prepared before the change was applied and was not needed:")
mono('drop policy if exists "service_role_all" on public.tour_bookings;\n'
     'create policy "Service role full access" on public.tour_bookings\n'
     '  for all to public using (true) with check (true);\n'
     '-- and the equivalent for tour_referrals')

# ---------------------------------------------------------------- safety
p("7. The remediation-safety question, and a recorded disagreement", H2)
p("The remediation was safe only if no live widget reads or writes these tables "
  "directly. This was verified in the repository rather than assumed. A search for "
  "<font face='Courier'>rest/v1</font> across <font face='Courier'>live/</font>, "
  "<font face='Courier'>patches/</font> and <font face='Courier'>Website/Pages</font> "
  "returned no matches; a search for edge-function references returned exactly three "
  "(<font face='Courier'>book-tour</font>, <font face='Courier'>check-availability</font>, "
  "<font face='Courier'>validate-referral</font>). An additional check not called for by "
  "the plan searched for supabase-js SDK usage "
  "(<font face='Courier'>createClient</font>, <font face='Courier'>.from(</font>), which "
  "would construct <font face='Courier'>/rest/v1</font> URLs without that literal string "
  "appearing in source; no SDK is loaded anywhere in the repository. All three call sites "
  "pass the anon key as a header on a POST to an edge function, never to a table.")
p("<b>7.1 Recorded disagreement.</b> During execution it was proposed that the "
  "remediation must retain an explicit INSERT grant for <font face='Courier'>anon</font>, "
  "on the reasoning that the booking form writes with that key and would otherwise fail "
  "silently. The evidence above indicated otherwise: the form posts to an edge function, "
  "which supplies its own service-role credential server-side. Granting "
  "<font face='Courier'>anon</font> broad table access to preserve the booking flow would "
  "have reinstated part of the very hole under repair.")
p("The proposal was nonetheless partly well-founded, and is recorded rather than "
  "dismissed: an explicit <font face='Courier'>\"Anon can insert bookings\"</font> policy "
  "does exist, so an anon INSERT path had at some point been deliberately created. The "
  "resolution was to close the disclosure hole while leaving that policy untouched, which "
  "satisfied both positions without either having to be assumed correct. The question was "
  "then settled by measurement rather than by argument -- see section 8.")
p("<b>Limits of the repository evidence.</b> The edge-function source is not held in "
  "this repository (<font face='Courier'>Components/Backend/supabase/functions/book-tour/</font> "
  "exists but is empty) and the repository is known to lag production. The searches above "
  "evidence the repository only. Production evidence is in section 8.")

# ---------------------------------------------------------------- verification
p("8. Verification against production", H2)
p("All verification was performed by command-line request. Browser verification is "
  "unreliable against this stack because of caching and was not accepted as evidence.")
p("<b>8.1 Anonymous access is closed.</b> Both tables now return an empty result set "
  "and a count of zero, against a pre-change baseline of 231 and 30:")
mono("BEFORE   tour_bookings   HTTP/1.1 206   Content-Range: 0-0/231\n"
     "         tour_referrals  HTTP/1.1 206   Content-Range: 0-0/30\n\n"
     "AFTER    tour_bookings   HTTP/1.1 200   Content-Range: */0     body: []\n"
     "         tour_referrals  HTTP/1.1 200   Content-Range: */0     body: []")
p("Response bodies were inspected directly and are empty arrays, confirming the zero "
  "count is genuine filtering rather than a header artefact. Status codes for GET, PATCH "
  "and DELETE across the three tables are 200/204/204, which -- per section 4 -- is the "
  "correct signature of a protected table, not of an open one.")
p("<b>8.2 The booking flow still works, proven positively.</b> The "
  "<font face='Courier'>check-availability</font> edge function returns "
  "<font face='Courier'>\"success\":true</font> with fully populated slot lists. A "
  "success response alone would have been weak evidence, because a function silently "
  "reading as <font face='Courier'>anon</font> would now see zero bookings and report "
  "every slot free -- succeeding while double-booking tours. A date sweep was therefore "
  "run to find a date with an existing booking:")
mono("2026-08-23    \"booked_slots\":[\"10:30 AM\"]")
p("<b>This is the decisive result.</b> The edge function returned a booking that the "
  "<font face='Courier'>anon</font> role provably cannot see, since the same key returns "
  "an empty array from the table. The function therefore reads with credentials that "
  "bypass RLS, confirmed in production rather than inferred from the repository. It also "
  "settles section 7.1 on evidence: the read path requires no anon table access.")

# ---------------------------------------------------------------- outstanding
p("9. Outstanding items", H2)
table([
    ["Item", "Severity", "Status"],
    ["End-to-end booking write test (book-tour) not performed",
     "Medium",
     "Requires owner authorisation: writes a real record, sends a real "
     "confirmation email and places an appointment on the staff calendar. The read "
     "path is proven (8.2); the write path is inferred from the same function "
     "deployment and remains formally untested."],
    ["\"Anon can insert bookings\" policy retained",
     "Low",
     "Grants INSERT only, no read. Permits injection of spurious rows. Deliberately "
     "left in place during remediation (section 6); should be removed once the write "
     "path is confirmed to run through the edge function."],
    ["No backup or restore path for the Supabase project",
     "High",
     "Free plan provides neither scheduled backups nor point-in-time recovery. "
     "261 records of personal data exist in exactly one place. Independent of this "
     "incident and outlasts it."],
    ["central_clubs policy name does not match its definition",
     "Informational",
     "Non-sensitive data, 3 rows. Same defect class as the root cause."],
    ["Whether affected individuals require notification",
     "Owner decision",
     "Not an engineering determination. No access log exists to establish whether "
     "the data was retrieved during the exposure window."],
    ["Prior test booking's CRM appointment (id 831)",
     "Housekeeping",
     "Outstanding from earlier work; unrelated to this finding."],
], [1.60 * inch, 0.72 * inch, 3.58 * inch])

p("The exposure window cannot be bounded from below. The misconfiguration's creation "
  "date was not established, so the data should be treated as having been reachable for "
  "an unknown period ending 2026-08-18.", NOTE)

# ---------------------------------------------------------------- chain
p("10. Actions taken and not taken", H2)
table([
    ["Action", "Status"],
    ["Repository verification of the remediation-safety assumption, incl. SDK check",
     "DONE"],
    ["Pre-change exposure baseline captured (counts only)", "DONE"],
    ["Backup facility checked in the Supabase dashboard",
     "DONE -- none available (Free plan)"],
    ["Manual export of the two personal-data tables",
     "NOT DONE -- deliberate owner decision to proceed without one"],
    ["Pre-change policy state captured and recorded", "DONE"],
    ["Full 45-table schema enumerated and probed", "DONE"],
    ["Two miswritten policies dropped and replaced", "DONE"],
    ["Post-change verification of anonymous access", "DONE -- closed"],
    ["Post-change verification of the booking read path", "DONE -- working"],
    ["End-to-end booking write test", "NOT DONE -- not authorised by owner"],
    ["Rotation of the anon key", "NONE -- out of scope by design"],
    ["Customer personal data read, exported or copied at any point",
     "NONE -- counts and status codes only"],
], [4.20 * inch, 1.70 * inch])

p("The remediation was applied by the site owner in the Supabase SQL editor. "
  "Verification was performed independently by command-line request against production. "
  "No customer personal data was read, exported or copied during this work.", GOOD)

rule()
p("Source of record: <font face='Courier'>handoffs/lock-down-supabase-rls.md</font>. "
  "Regenerate with <font face='Courier'>python security/generate-rls-audit-record.py</font>. "
  "Handling rules: <font face='Courier'>security/README.md</font>.", FOOT)

SimpleDocTemplate(OUT, pagesize=LETTER,
                  leftMargin=0.85 * inch, rightMargin=0.85 * inch,
                  topMargin=0.8 * inch, bottomMargin=0.8 * inch,
                  title="Security Audit Record - Supabase RLS Exposure - 2026-08-18",
                  author="South End Racquet & Health Club").build(S)
print("wrote " + OUT)
