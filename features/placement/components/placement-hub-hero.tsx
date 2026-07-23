type PlacementHubHeroProps = {
  totalQuestions: number;
};

export function PlacementHubHero({ totalQuestions }: PlacementHubHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-brand-hero-navy px-6 py-10 text-center text-white sm:px-10">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-red/20 blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-8 h-32 w-32 rounded-full bg-primary/20 blur-[60px]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-xl">
        <p className="mb-2 text-xs font-bold tracking-[0.18em] text-white/50 uppercase">
          Program · Tes Penempatan
        </p>
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold text-white">
          Temukan jalur belajar yang pas
        </h1>
        <p className="mx-auto mt-3 text-sm text-white/70">
          Tes singkat {totalQuestions} soal untuk rekomendasi jalur N5 atau N4.
        </p>
      </div>
    </section>
  );
}
