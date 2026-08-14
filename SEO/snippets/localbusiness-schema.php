<?php
/**
 * Snippet: LocalBusiness schema (NAP, geo, hours)
 * Where:   WPCode snippet ID 9935, "Run Everywhere", priority 10, ACTIVE
 * Status:  ✅ VERBATIM EXPORT — copied from WPCode 2026-08-13.
 *
 * This is the real thing, not a reconstruction. The live snippet is written as
 * two dense single-line filters; it has been reformatted here for readability
 * ONLY. Logic, values, hook names and priorities are unchanged. If you paste
 * this back, it behaves identically.
 *
 * Why this exists
 * ---------------
 * This is what makes Google understand the club as a physical local business:
 * name, address, phone, coordinates, opening hours, service area. It is the
 * schema half of ranking for "2800 Skypark Dr" and "health club Torrance".
 *
 * It filters the Organization node in Yoast's schema graph rather than
 * emitting a second <script> block — which is why the live page has only ONE
 * application/ld+json block in <head>. Two competing LocalBusiness nodes would
 * be worse than one, so keep it that way.
 *
 * Two things worth knowing before you edit it
 * -------------------------------------------
 * 1. It registers the SAME filter twice, at priorities 20 and 21. The split is
 *    not meaningful — it is how it was built up over two edits. Merging them
 *    into one filter would be safe, but there is no reason to.
 *
 * 2. It appends ONLY TikTok to sameAs. Facebook, Instagram and Yelp come from
 *    Yoast → Settings → Site representation, not from here. So if a social
 *    profile goes missing from the rendered JSON-LD, check Yoast settings
 *    first — this snippet is not where three of the four live.
 *
 * Verify after any change: GoDaddy Quick Links → Flush Cache, then curl (NOT
 * the browser — the browser lies about cache):
 *
 *   curl -s https://southendclub.com/ | grep -o '"telephone":"[^"]*"'
 *
 * Expect "+1-310-530-0630" from the <head> block. Note that five pages ALSO
 * serve "+1-310-325-8000" in a <body> JSON-LD block pasted through Thrive —
 * that number is stale, it is live, and this snippet does not control it.
 * See SEO/TODO.md §10.
 */

add_filter( 'wpseo_schema_organization', function ( $data ) {

	$data['@type'] = array( 'Organization', 'HealthClub', 'SportsActivityLocation' );

	$data['telephone']  = '+1-310-530-0630';
	$data['email']      = 'info@southendclub.com';
	$data['priceRange'] = '$$';

	$data['address'] = array(
		'@type'           => 'PostalAddress',
		'streetAddress'   => '2800 Skypark Dr',
		'addressLocality' => 'Torrance',
		'addressRegion'   => 'CA',
		'postalCode'      => '90505',
		'addressCountry'  => 'US',
	);

	$data['geo'] = array(
		'@type'     => 'GeoCoordinates',
		'latitude'  => 33.8358,
		'longitude' => -118.3406,
	);

	$data['hasMap'] = 'https://www.google.com/maps/search/?api=1&query=2800+Skypark+Dr+Torrance+CA+90505';

	$data['openingHoursSpecification'] = array(
		array(
			'@type'     => 'OpeningHoursSpecification',
			'dayOfWeek' => array( 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday' ),
			'opens'     => '06:00',
			'closes'    => '21:00',
		),
		array(
			'@type'     => 'OpeningHoursSpecification',
			'dayOfWeek' => array( 'Saturday', 'Sunday' ),
			'opens'     => '07:00',
			'closes'    => '18:00',
		),
	);

	$data['areaServed'] = array(
		'Torrance',
		'Redondo Beach',
		'Manhattan Beach',
		'Hermosa Beach',
		'Palos Verdes Estates',
		'Rancho Palos Verdes',
		'Rolling Hills Estates',
		'Carson',
		'Gardena',
		'South Bay Los Angeles',
	);

	return $data;
}, 20 );

add_filter( 'wpseo_schema_organization', function ( $d ) {

	$d['description'] = 'South End Racquet & Health Club is the South Bay family-focused health, racquet and social club, set on seven acres at the base of the Palos Verdes Peninsula in Torrance, California. Amenities include 9 lighted tennis courts, 9 pickleball courts, padel, racquetball and the only squash courts within 20 miles, a heated 25-yard pool and beach-entry family pool, a full fitness center with a women-only gym, sauna, steam room and jacuzzis, on-site dining, youth camps and child care, and a 4,000 sq ft banquet hall for weddings and corporate events.';

	if ( ! isset( $d['sameAs'] ) || ! is_array( $d['sameAs'] ) ) {
		$d['sameAs'] = array();
	}

	$d['sameAs'][] = 'https://www.tiktok.com/@southendhealthclub';

	return $d;
}, 21 );

/*
 * ---------------------------------------------------------------------------
 * REFERENCE: the Organization node as actually rendered on 2026-08-13.
 * ---------------------------------------------------------------------------
 *
 * "@type":  ["Organization","HealthClub","SportsActivityLocation"]
 * "name":   "South End Racquet and Health Club"      <- see drift note below
 * "alternateName": "South End Club"
 * "sameAs": [ facebook, instagram, yelp, tiktok ]    <- only tiktok from here
 * "telephone": "+1-310-530-0630"
 * "email": "info@southendclub.com"
 * "priceRange": "$$"
 * "address": 2800 Skypark Dr, Torrance, CA 90505, US
 * "geo": 33.8358, -118.3406
 * "openingHoursSpecification": Mon-Fri 06:00-21:00, Sat-Sun 07:00-18:00
 * "areaServed": 10 cities
 *
 * KNOWN DRIFT — "name" is still "South End Racquet and Health Club".
 * SEO/YOAST-SHEET.md section A specifies the ampersand form. That value comes
 * from Yoast → Settings → Site representation, NOT from this snippet, so it
 * cannot be fixed here.
 */
