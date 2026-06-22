'use client';

import NextTopLoader from 'nextjs-toploader';

/** Indikator loading navigasi — warna primary (Japanese Red #EC1D24). */
export function AppTopLoader() {
  return (
    <NextTopLoader
      color="#EC1D24"
      showSpinner={false}
      height={3}
      shadow="0 0 10px #EC1D24,0 0 5px #EC1D24"
    />
  );
}
