/** Ukuran logo brand — satu sumber untuk navbar, auth, dll. */
export const BRAND_LOGO = {
  /** Navbar landing & halaman publik */
  nav: {
    width: 220,
    height: 64,
    className: 'h-11 w-auto object-contain sm:h-12 md:h-14',
  },
  /** Logo di form login/register (mobile & panel kanan) */
  authForm: {
    width: 220,
    height: 64,
    className: 'h-12 w-auto object-contain sm:h-14',
  },
  /** Logo putih di panel brand kiri (desktop) */
  authPanel: {
    width: 260,
    height: 76,
    className: 'h-14 w-auto object-contain sm:h-16',
  },
} as const;
