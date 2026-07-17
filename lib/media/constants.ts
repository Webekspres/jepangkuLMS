export const R2_OBJECT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export const BADGE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const BADGE_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** Cover kursus / live class — sama batas MIME & ukuran dengan badge. */
export const COVER_IMAGE_MAX_BYTES = BADGE_IMAGE_MAX_BYTES;
export const COVER_IMAGE_MIME_TYPES = BADGE_IMAGE_MIME_TYPES;

/** Rasio kartu cover di katalog & detail (≈ 16:9). */
export const COVER_IMAGE_ASPECT = 16 / 9;
export const COVER_IMAGE_RECOMMENDED_WIDTH = 1280;
export const COVER_IMAGE_RECOMMENDED_HEIGHT = 720;
