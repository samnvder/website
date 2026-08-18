<?php
/**
 * Snippet: Serve WebP/AVIF via <picture> tag
 * Where:   WPCode snippet ID 9936, "Run Everywhere", priority 10, ACTIVE
 * Status:  ✅ VERBATIM EXPORT — copied from WPCode 2026-08-13.
 *
 * The real thing. The live snippet is one dense single line with short
 * variable names; it has been reformatted and commented here for readability
 * ONLY. Logic, regexes, hook and priority are unchanged.
 *
 * This was the last completely unbacked-up snippet. Losing it would have been
 * silent: images would quietly revert to full-size JPEG/PNG with no error
 * anywhere and no visible breakage — just a slower site.
 *
 * Why this exists
 * ---------------
 * CompressX writes converted images to /wp-content/compressx-nextgen/uploads/
 * mirroring the normal uploads tree, but GoDaddy Managed WordPress ignores
 * .htaccess, so the usual rewrite-based delivery silently fails. This snippet
 * does the delivery in PHP instead: it buffers the page and wraps every <img>
 * whose converted twin actually exists on disk in a <picture> with AVIF and
 * WebP <source> tags. Browsers pick the best format they support; anything
 * else falls through to the original <img>.
 *
 * Result: 483 images converted, 58% smaller (8,851 KB → 3,629 KB across 25
 * homepage images).
 *
 * How it decides — the important safety property
 * ----------------------------------------------
 * $map() returns false unless file_exists() confirms the converted file is
 * really there. So a missing conversion degrades to the original image rather
 * than a broken <source>. It also skips any <img> already pointing at
 * compressx-nextgen, so it cannot double-wrap.
 *
 * srcset handling is all-or-nothing: if ANY candidate in a srcset lacks a
 * converted twin, the whole srcset is abandoned ($ok = false) and it falls
 * back to mapping the single src. That avoids serving a mixed-resolution
 * srcset with gaps.
 *
 * ⚠️ It buffers the entire front-end response (ob_start on template_redirect,
 * priority 1). Anything else that also buffers and rewrites HTML will
 * interact with this — see live/wpcode/retired/9952-fix-stale-phone-in-jsonld.php,
 * whose optional fallback does exactly that and carries a warning pointing
 * back here.
 *
 * Verify: GoDaddy Quick Links → Flush Cache, then curl (NOT the browser):
 *
 *   curl -s https://southendclub.com/ | grep -c '<picture'
 *
 * Expect a non-zero count. If it drops to 0 after some other change, this
 * snippet or the compressx-nextgen directory is the place to look.
 */

add_action( 'template_redirect', function () {

	if ( is_admin() || is_feed() || is_embed() ) {
		return;
	}

	$u  = wp_get_upload_dir();
	$bu = $u['baseurl'];
	$bd = $u['basedir'];

	// The CompressX output tree mirrors uploads/ one level up.
	$nu = dirname( $bu ) . '/compressx-nextgen/uploads';
	$nd = dirname( $bd ) . '/compressx-nextgen/uploads';

	/**
	 * Map an uploads URL to its converted twin, or false if there isn't one.
	 * The file_exists() check is what makes a missing conversion harmless.
	 */
	$map = function ( $x, $e ) use ( $bu, $nu, $nd ) {

		if ( strpos( $x, $bu ) !== 0 ) {
			return false;
		}

		$r = substr( $x, strlen( $bu ) );

		if ( ! preg_match( '#\.(jpe?g|png)$#i', $r ) ) {
			return false;
		}

		return file_exists( $nd . $r . '.' . $e ) ? $nu . $r . '.' . $e : false;
	};

	ob_start( function ( $h ) use ( $map ) {

		if ( stripos( $h, '<img' ) === false ) {
			return $h;
		}

		return preg_replace_callback( '#<img\b[^>]*?>#i', function ( $m ) use ( $map ) {

			$t = $m[0];

			// Never double-wrap an image we already rewrote.
			if ( stripos( $t, 'compressx-nextgen' ) !== false ) {
				return $t;
			}

			if ( ! preg_match( '#\ssrc="([^"]*)"#i', $t, $s ) ) {
				return $t;
			}

			$set = preg_match( '#\ssrcset="([^"]*)"#i', $t, $q ) ? $q[1] : '';
			$o   = '';

			foreach ( array( 'avif' => 'image/avif', 'webp' => 'image/webp' ) as $e => $ty ) {

				$done = false;

				if ( $set !== '' ) {

					$p  = array();
					$ok = true;

					foreach ( explode( ',', $set ) as $c ) {

						$c = trim( $c );
						if ( $c === '' ) {
							continue;
						}

						$b = preg_split( '#\s+#', $c, 2 );
						$n = $map( $b[0], $e );

						// All-or-nothing: one gap abandons the whole srcset.
						if ( $n === false ) {
							$ok = false;
							break;
						}

						$p[] = $n . ( isset( $b[1] ) ? ' ' . $b[1] : '' );
					}

					if ( $ok && $p ) {
						$o    .= '<source srcset="' . esc_attr( implode( ', ', $p ) ) . '" type="' . $ty . '">';
						$done  = true;
					}
				}

				if ( ! $done ) {
					$n = $map( $s[1], $e );
					if ( $n !== false ) {
						$o .= '<source srcset="' . esc_attr( $n ) . '" type="' . $ty . '">';
					}
				}
			}

			return $o === '' ? $t : '<picture>' . $o . $t . '</picture>';

		}, $h );
	} );

}, 1 );
