<?php
/**
 * Snippet: Correct the stale phone number in page-content JSON-LD
 * Where:   Was WPCode snippet ID 9952, "Run Everywhere"
 * Status:  APPLIED 2026-08-13, VERIFIED WORKING, THEN DELETED. Not currently
 *          on the site.
 *
 * It did work — all six occurrences disappeared from live output after a cache
 * flush. It was removed on purpose, because it masks rather than fixes: while
 * it is active the verification curl passes whether or not the source was ever
 * corrected, which destroys your ability to detect the real state.
 *
 * ⚠️ THE UNDERLYING PROBLEM IS STILL LIVE. As of the end of 2026-08-13 all six
 * stale numbers remain in post_content on those five pages. Fix it at source —
 * see SEO/TODO.md §10 for the recommended WP-CLI approach and a post-mortem of
 * the three approaches that failed.
 *
 * Only re-apply this if you need a temporary cover-up (e.g. Google is actively
 * recrawling and the real fix is days away). Delete it again immediately after.
 *
 * What this fixes
 * ---------------
 * Five pages serve an obsolete phone number inside the JSON-LD block that was
 * pasted into Thrive as page content:
 *
 *     /corporate-membership/   1 x  "telephone": "+1-310-325-8000"
 *     /wellness/               1 x
 *     /fitness/                1 x
 *     /pools/                  1 x
 *     /events/                 2 x  (telephone + ContactPoint.telephone)
 *
 * The correct number is +1-310-530-0630. Verified 2026-08-13.
 *
 * Scope — read this before deciding it is urgent
 * ----------------------------------------------
 * The bad number is ONLY inside <script type="application/ld+json">. It is not
 * in any visible text and not in any tel: link. Checked on all five pages:
 * visible text and click-to-call already show the correct number. No visitor
 * has ever seen or dialled the wrong one.
 *
 * So this is schema hygiene, not a customer-facing fault. What it costs you is
 * that Google reads two different phone numbers for one business: the correct
 * one from the <head> Organization node (WPCode snippet 9935) and this stale
 * one from the page body. Google does parse JSON-LD in <body>, so both are
 * eligible. Consistent NAP is a local-ranking signal, so it is worth cleaning
 * up — but it ranks below the Google Business Profile work in SEO/TODO.md §1.
 *
 * Why a snippet at all
 * --------------------
 * The proper fix is to correct the JSON-LD at source, in Thrive Architect, on
 * those five pages. The repo copies under Website/Pages/ are ALREADY correct,
 * so a re-paste from the repo also fixes it.
 *
 * This snippet exists because that requires Thrive skills and carries the usual
 * risk of editing a built page. This does not: it is a narrow, exact-string
 * replacement that cannot match anything else on the site, because the string
 * "+1-310-325-8000" appears nowhere else in any output.
 *
 * It is a STOPGAP. It masks the stale data rather than removing it. Prefer the
 * Thrive fix when someone has time, and delete this snippet afterwards — the
 * verification step below will still pass once the source is clean, so leaving
 * it in place indefinitely hides whether the real fix ever happened.
 *
 * Safety
 * ------
 * - Exact string match, not a regex. No pattern can over-match.
 * - Idempotent: running it twice changes nothing the second time.
 * - Runs on the_content at a late priority, after Thrive has assembled the
 *   page, so it sees the final content string.
 * - Touches only front-end rendering. It does not write to the database, so
 *   the stored page content is untouched and this is fully reversible by
 *   deactivating the snippet.
 *
 * Applying and verifying
 * ----------------------
 * 1. Paste into WPCode, set "Run Everywhere", activate.
 * 2. GoDaddy Quick Links → Flush Cache. Without this you will verify stale
 *    HTML and reach the wrong conclusion.
 * 3. Verify with curl, NOT the browser — the browser lies about cache:
 *
 *      for p in corporate-membership wellness fitness pools events; do
 *        printf '%s: ' "$p"
 *        curl -s "https://southendclub.com/$p/" | grep -c '325-8000'
 *      done
 *
 *    Expect 0 on all five. /events/ is the one to watch: it has TWO
 *    occurrences, so a partial fix still shows a non-zero count there.
 *
 * If the counts are still non-zero
 * --------------------------------
 * Then Thrive is rendering this content outside the_content filter, and the
 * targeted hook never sees it. In that case switch to the output-buffer
 * fallback at the bottom of this file — it is commented out because it is the
 * heavier, more invasive option and should not be the first thing tried.
 */

define( 'SOUTHEND_STALE_PHONE', '+1-310-325-8000' );
define( 'SOUTHEND_REAL_PHONE',  '+1-310-530-0630' );

/**
 * Primary approach: rewrite the page content.
 *
 * Priority 99 so it runs after Thrive Architect has built the content. Only
 * touches front-end page requests — no admin screens, no feeds, no REST.
 */
add_filter( 'the_content', function ( $content ) {

	if ( is_admin() || ! is_singular() ) {
		return $content;
	}

	if ( strpos( $content, SOUTHEND_STALE_PHONE ) === false ) {
		return $content;
	}

	return str_replace( SOUTHEND_STALE_PHONE, SOUTHEND_REAL_PHONE, $content );

}, 99 );


/*
 * ---------------------------------------------------------------------------
 * FALLBACK — only if the curl check above still returns non-zero.
 *
 * Buffers the whole page and replaces the string in the final HTML. This
 * catches the number wherever Thrive renders it, but it buffers every
 * front-end response, so use it only if the_content genuinely does not work.
 *
 * ⚠️ CONFIRMED CONFLICT RISK. Snippet 9936 (WebP/AVIF delivery) does exactly
 * this too — verified from its source 2026-08-13: ob_start() inside an
 * add_action('template_redirect', ..., 1). So this fallback would register a
 * second buffer at the same hook and priority. Nested buffers do work, but the
 * ordering is not something to leave to chance. After activating, re-verify
 * that <picture> tags are still being emitted:
 *
 *     curl -s https://southendclub.com/ | grep -c '<picture'
 *
 * Compare against the count before you activate this. If it drops, the two
 * snippets are fighting over the buffer and you should fix the JSON-LD in
 * Thrive instead of stacking rewrites.
 *
 * To use: delete the opening and closing comment markers around the block.
 *
add_action( 'template_redirect', function () {

	if ( is_admin() ) {
		return;
	}

	ob_start( function ( $html ) {
		return str_replace( SOUTHEND_STALE_PHONE, SOUTHEND_REAL_PHONE, $html );
	} );

}, 1 );
 *
 * ---------------------------------------------------------------------------
 */
