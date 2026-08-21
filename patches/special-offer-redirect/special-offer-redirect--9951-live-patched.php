/**
 * SEO - Renamed-page 301 redirects
 *
 * Source of truth: SEO/snippets/renamed-page-redirects.php in the website repo.
 * Three pages were renamed without redirects; the old URLs returned 404 and were
 * the largest category in Search Console's Page Indexing report.
 *
 *   /junior-programs/  ->  /youth-programs/
 *   /food-services/    ->  /food-beverage/
 *   /banquets/         ->  /events/
 *
 * GoDaddy Managed WordPress ignores .htaccess, so this runs on template_redirect.
 * Guarded by is_404(), so it can only ever act on a request that was already going
 * to fail. It cannot shadow a live page, and if any of these slugs is recreated
 * later the snippet becomes inert on its own.
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
		'special-offer'   => 'memberships',
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
