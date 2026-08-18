<?php
/**
 * Snippet: Renamed-page 301 redirects
 * Where:   WPCode snippet ID 9951, "Run Everywhere", ACTIVE
 * Status:  ✅ APPLIED & VERIFIED LIVE 2026-08-13 — all three old URLs now
 *          return 301 to the correct target. They had been returning 404.
 *
 * Why this exists
 * ---------------
 * Three pages were renamed without redirects. The old URLs return 404 and
 * are the largest category in Search Console's Page Indexing report
 * (13 pages, found 2026-08-07):
 *
 *     /junior-programs/  ->  /youth-programs/
 *     /food-services/    ->  /food-beverage/
 *     /banquets/         ->  /events/
 *
 * Fixing the nav menu stops new visitors hitting the dead links. This
 * snippet is the other half: it rescues inbound links from Google, the
 * Google Business Profile, old emails, printed material and anyone's
 * bookmarks, and passes the accumulated ranking signal to the live page.
 *
 * Why PHP and not .htaccess
 * -------------------------
 * GoDaddy Managed WordPress ignores .htaccess. Any redirect placed there
 * fails silently. See CLAUDE.md.
 *
 * Safety
 * ------
 * Guarded by is_404(), so it can only ever act on a request that was
 * already going to fail. It cannot shadow a live page, and if any of
 * these slugs is recreated later the snippet becomes inert on its own.
 *
 * After applying: GoDaddy Quick Links -> Flush Cache, then verify with
 * curl (NOT the browser -- the browser lies about cache):
 *
 *   for u in junior-programs food-services banquets; do
 *     curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" \
 *       "https://southendclub.com/$u/"
 *   done
 *
 * Expect "301 -> https://southendclub.com/<new>/" for all three.
 */

add_action( 'template_redirect', function () {

	// Only ever touch requests that are already 404ing.
	if ( ! is_404() ) {
		return;
	}

	$map = array(
		'junior-programs' => 'youth-programs',
		'food-services'   => 'food-beverage',
		'banquets'        => 'events',
	);

	$path = wp_parse_url( $_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH );
	$slug = strtolower( trim( (string) $path, '/' ) );

	if ( ! isset( $map[ $slug ] ) ) {
		return;
	}

	$target = home_url( '/' . $map[ $slug ] . '/' );

	// Preserve any query string (utm_*, ref=, etc.) so campaign
	// attribution survives the redirect.
	$query = wp_parse_url( $_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY );
	if ( $query ) {
		$target .= '?' . $query;
	}

	wp_safe_redirect( $target, 301 );
	exit;
} );
