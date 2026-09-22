/**
 * Manifest of the site's photography.
 *
 * Every image is served from a generated WebP derivative in /images/opt (see
 * scripts/optimize-images.sh) with the original file kept as the fallback
 * source for browsers without WebP support.
 *
 * Keep `widths` in sync with scripts/optimize-images.sh - if a width is listed
 * here but not generated, the browser will request a file that does not exist.
 */

export interface ImageAsset {
  /** Basename of the generated WebP set in /images/opt. */
  name: string;
  /** Generated widths, ascending. Must match scripts/optimize-images.sh. */
  widths: number[];
  /** Original file, used by browsers that cannot decode WebP. */
  fallback: string;
  /** Intrinsic aspect ratio, used to reserve layout space and avoid jank. */
  aspect: readonly [number, number];
}

export const IMAGES = {
  /** Brand mark with transparency: 48px in the nav, 128px in the footer. */
  logo: {
    name: 'logo',
    widths: [128, 256, 384],
    fallback: '/images/locsbywogggg.png',
    aspect: [1536, 1024],
  },

  /** Portrait of finished locs - the portfolio carousel opener. */
  locsPortrait: {
    name: 'locs-portrait',
    widths: [600, 1000],
    fallback: '/images/55764726-E9FA-4DD5-BE69-6E0EF95080E7.jpeg',
    aspect: [1024, 1536],
  },

  /** Close-up braid detail. */
  braidsCloseup: {
    name: 'braids-closeup',
    widths: [600],
    fallback: '/images/8D00B2A9-ECC2-486F-A168-F1A03A587A76_1_102_o.jpeg',
    aspect: [720, 1280],
  },

  /** Tall full-length style shot. */
  styleTall: {
    name: 'style-tall',
    widths: [600, 1000],
    fallback: '/images/IMG_1319.JPG',
    aspect: [1238, 2200],
  },

  /** Smaller source: only one useful size is generated for this one. */
  styleSoft: {
    name: 'style-soft',
    widths: [360],
    fallback: '/images/D41E79E1-2CB9-4DCF-95FC-C84481C152D4_4_5005_c.jpeg',
    aspect: [360, 480],
  },

  /** Happy client, also reused in the testimonials block. */
  clientHappy: {
    name: 'client-happy',
    widths: [600],
    fallback: '/images/F0100147-6D85-46E0-869E-030A0181C118.jpeg',
    aspect: [750, 1000],
  },

  /** Salon work shot, originally a 12MP camera file. */
  salonWork: {
    name: 'salon-work',
    widths: [600, 1000],
    fallback: '/images/IMG_6897.jpeg',
    aspect: [4032, 3024],
  },

  /** Display style shot, originally stored as a 2.5MB PNG. */
  styleDisplay: {
    name: 'style-display',
    widths: [600, 1000],
    fallback: '/images/anotherdisplayimage.png',
    aspect: [1024, 1536],
  },
} as const satisfies Record<string, ImageAsset>;

export function srcSetFor(asset: ImageAsset): string {
  return asset.widths
    .map((w) => `/images/opt/${asset.name}-${w}.webp ${w}w`)
    .join(', ');
}
