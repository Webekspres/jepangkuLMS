import Image from 'next/image';
import Link from 'next/link';
import { BRAND_LOGO } from '@/lib/brand-logo';
import { motion } from 'motion/react';
import {
  AUTH_STATS,
  AUTH_VALUE_PROPS,
  FLOATING_KANJI,
  SEIGAIHA,
} from './auth-shared';

type AuthBrandPanelProps = {
  badge?: string;
  title: React.ReactNode;
  description: string;
};

export function AuthBrandPanel({
  badge = '日本語を楽しく学ぼう',
  title,
  description,
}: AuthBrandPanelProps) {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-brand-navy via-secondary to-brand-navy lg:flex lg:w-1/2">
      <div
        className="absolute inset-0 opacity-60"
        style={{ backgroundImage: SEIGAIHA, backgroundSize: '60px 60px' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_65%)]" />

      {FLOATING_KANJI.map((char, i) => (
        <motion.div
          key={char}
          className="pointer-events-none absolute select-none text-white/5"
          style={{
            fontSize: `${60 + (i % 3) * 40}px`,
            left: `${(i * 17 + 5) % 85}%`,
            top: `${(i * 23 + 8) % 80}%`,
          }}
          animate={{ y: [0, -16, 0], opacity: [0.04, 0.12, 0.04] }}
          transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.8 }}
        >
          {char}
        </motion.div>
      ))}

      <div className="relative z-10 flex h-full flex-col justify-between py-10 px-16">
        <Link href="/" className="inline-block">
          <Image
            src="/brand/logo-white.png"
            alt="JepangKu"
            width={BRAND_LOGO.authPanel.width}
            height={BRAND_LOGO.authPanel.height}
            className={BRAND_LOGO.authPanel.className}
            priority
          />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2">
            <span className="text-sm text-white/60">{badge}</span>
          </div>
          <h1 className="mb-4 text-[2.5rem] font-black leading-[1.15] text-white">{title}</h1>
          <p className="mb-8 max-w-sm text-base leading-relaxed text-white/60">{description}</p>

          <div className="grid grid-cols-2 gap-3">
            {AUTH_VALUE_PROPS.map((vp, i) => (
              <motion.div
                key={vp.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-brand-red">
                  <vp.icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{vp.title}</p>
                  <p className="mt-0.5 text-xs text-white/40">{vp.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-6"
        >
          {AUTH_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-black text-white">{s.val}</p>
              <p className="text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
