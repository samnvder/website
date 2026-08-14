<?php
/**
 * Snippet: Noindex internal & utility pages
 * Where:   WPCode snippet ID 9934, "Run Everywhere", priority 10, ACTIVE
 * Status:  ✅ VERBATIM EXPORT — copied from WPCode 2026-08-13.
 *
 * The real thing, not a reconstruction. Reformatted from two dense single-line
 * filters for readability ONLY — logic, IDs, hook names and priorities are
 * unchanged.
 *
 * Why this exists
 * ---------------
 * Eight pages are internal tools, expired event pages or boilerplate. Left
 * indexable they dilute the site's topical focus and compete for crawl budget
 * with the 18 commercial pages.
 *
 * Why BOTH filters are needed
 * ---------------------------
 * Yoast builds page-sitemap.xml from stored postmeta, not from the runtime
 * robots value. A robots filter alone leaves the pages listed in the sitemap
 * while serving "noindex" — so you invite Google to crawl a page and then tell
 * it not to index what it finds. Both filters, or neither.
 *
 * To index one of these again, remove its ID from BOTH arrays.
 *
 * ⚠️ Two real fragilities in this snippet, worth knowing before you touch it
 * ------------------------------------------------------------------------
 * 1. The ID list is DUPLICATED — written out twice, once per filter. Edit one
 *    and forget the other and you get the exact broken half-state the section
 *    above warns about: noindexed but still in the sitemap, or removed from
 *    the sitemap but still indexable. There is no shared constant.
 *
 * 2. The sitemap filter REPLACES the exclusion list rather than merging into
 *    it — `return array(...)` discards whatever was passed in. If Yoast or
 *    another plugin ever excludes a post by this filter, this snippet silently
 *    throws that exclusion away. It works today because nothing else uses the
 *    filter. Prefer array_merge if you rewrite it.
 *
 * Note it sets only $robots['index']; it does not touch 'follow'. Pages still
 * serve "noindex, follow" because 'follow' is Yoast's default — which is what
 * you want, since these pages link out to real ones.
 *
 * Post IDs, confirmed against the live site 2026-08-13:
 *   6671 social-media-landing-page   — link-in-bio page, thin content
 *   6685 privacy-policy              — boilerplate
 *   6693 terms-conditions            — boilerplate
 *   9451 brandon-pb                  — private offer landing page
 *   9642 pickelball-classic-hub      — internal tool (slug typo is live)
 *   9652 pickleball-classic-admin    — internal admin tool
 *   9662 pickleball-classic-rsvp     — event-specific, expired
 *   9674 pickelball-classic-check-in — internal tool (slug typo is live)
 *
 * All eight verified 2026-08-13: HTTP 200, serving "noindex, follow", none
 * present in page-sitemap.xml.
 *
 * Verify: GoDaddy Quick Links → Flush Cache, then curl (NOT the browser):
 *
 *   curl -s https://southendclub.com/privacy-policy/ | grep -i "name='robots'"
 *
 * Yoast emits robots with SINGLE quotes: <meta name='robots' ... />. Grepping
 * for content="..." returns nothing and reads as a false negative rather than
 * an error. This has wasted time before.
 */

add_filter( 'wpseo_robots_array', function ( $robots ) {

	if ( is_page( array( 6671, 6685, 6693, 9451, 9642, 9652, 9662, 9674 ) ) ) {
		$robots['index'] = 'noindex';
	}

	return $robots;
}, 20 );

add_filter( 'wpseo_exclude_from_sitemap_by_post_ids', function ( $ids ) {
	return array( 6671, 6685, 6693, 9451, 9642, 9652, 9662, 9674 );
} );
