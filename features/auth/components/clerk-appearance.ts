import { shadcn } from '@clerk/themes';
import type { NextClerkProviderProps } from '@clerk/nextjs/types';

type ClerkAppearance = NonNullable<NextClerkProviderProps['appearance']>;

/**
 * Primary CTA — mirror `components/ui/button.tsx` default variant (3D retro press).
 * Detail visual di `app/globals.css` (`.clerk-auth-primary-btn`).
 */
const clerkPrimaryButtonClass = [
  'clerk-auth-primary-btn',
  'h-11 w-full !rounded-sm !border !border-[#c91d24]',
  '!bg-linear-to-b !from-[#f2343a] !to-[#EC1D24]',
  '!text-sm !font-bold !text-white',
  'transition-[transform,box-shadow,filter] duration-150 ease-out',
  'hover:scale-[1.03] hover:brightness-105',
  'active:translate-y-[3px] active:scale-[0.995]',
  '!shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_2px_0_0_rgba(255,255,255,0.1)_inset,0_5px_0_0_#b8151c,0_8px_16px_-8px_rgba(184,21,28,0.5)]',
  'hover:!shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_2px_0_0_rgba(255,255,255,0.1)_inset,0_6px_0_0_#b8151c,0_12px_20px_-8px_rgba(184,21,28,0.55)]',
  'active:!shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_2px_0_0_rgba(255,255,255,0.08)_inset,0_2px_0_0_#b8151c,0_4px_10px_-8px_rgba(184,21,28,0.45)]',
].join(' ');

/** Interaksi 3D — warna di globals.css via modifier --light / --dark */
const clerkSocialButtonShared = [
  'clerk-auth-social-btn',
  'h-11 w-full !rounded-sm',
  'transition-[transform,box-shadow,filter] duration-150 ease-out',
  'hover:scale-[1.03] hover:brightness-105',
  'active:translate-y-[3px] active:scale-[0.995]',
].join(' ');

/** Warna via `.btn-3d-outline` / `.btn-3d-outline-dark` di globals.css */
const clerkSocialButtonClass = `${clerkSocialButtonShared} btn-3d-outline`;
const clerkSocialButtonDarkClass = `${clerkSocialButtonShared} btn-3d-outline-dark`;

const clerkLastUsedBadgeClass = [
  'rounded-full border border-border bg-muted px-2 py-0.5',
  'text-[10px] font-medium leading-none text-muted-foreground shadow-none',
].join(' ');

const clerkCardLightClass =
  'clerk-auth-card--light flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-none';

const clerkCardDarkClass =
  'clerk-auth-card--dark flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-popover p-6 shadow-none';

function buildElements(isDark: boolean): NonNullable<ClerkAppearance['elements']> {
  return {
    rootBox: 'w-full',
    cardBox: isDark ? 'clerk-auth-card-box--dark w-full shadow-none bg-popover' : 'w-full shadow-none',
    card: isDark ? clerkCardDarkClass : clerkCardLightClass,
    main: isDark ? 'clerk-auth-main--dark bg-popover' : undefined,
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsRoot: 'gap-3',
    socialButtons: 'gap-3',
    socialButtonsBlockButton: isDark ? clerkSocialButtonDarkClass : clerkSocialButtonClass,
    socialButtonsBlockButtonText: isDark
      ? '!text-sm !font-semibold !text-[#f4f4f9]'
      : '!text-sm !font-semibold !text-slate-800',
    lastAuthenticationStrategyBadge: clerkLastUsedBadgeClass,
    dividerLine: 'bg-border',
    dividerText: 'text-xs font-medium text-muted-foreground',
    formFieldLabel: 'text-sm font-semibold text-foreground',
    formFieldInput: isDark
      ? 'rounded-xl border border-border bg-muted/15 px-4 py-3 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15'
      : 'rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-none focus:border-primary focus:ring-2 focus:ring-primary/20',
    formButtonPrimary: clerkPrimaryButtonClass,
    formButtonPrimaryIcon: '!hidden',
    footer: isDark
      ? {
          background: 'var(--popover)',
          marginTop: 0,
          paddingTop: '1rem',
          borderTop: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
        }
      : {
          background: 'transparent',
          marginTop: 0,
          paddingTop: '1rem',
          borderTop: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
        },
    footerItem: {
      background: 'transparent',
      width: '100%',
    },
    footerAction: 'pt-1',
    footerActionLink: 'font-bold text-primary hover:underline',
    footerActionText: 'text-sm text-muted-foreground',
    footerPages: isDark
      ? {
          background: 'var(--popover)',
          color: 'var(--muted-foreground)',
        }
      : {
          background: 'transparent',
          color: 'var(--muted-foreground)',
        },
    identityPreviewEditButton: 'text-primary',
    formFieldAction: 'text-xs font-medium text-primary',
    alert: 'rounded-xl border border-destructive/30 bg-destructive/5 text-destructive',
    alertText: 'text-sm',
    otpCodeFieldInput:
      'rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20',
    formResendCodeLink: 'text-primary hover:underline',
    navbar: 'bg-card',
    navbarButton: 'text-foreground hover:bg-muted',
  };
}

type ClerkAppearanceOptions = {
  isDark?: boolean;
};

/**
 * Clerk prebuilt UI — shadcn theme + token JepangKu (DESIGN.md / globals.css).
 * Hindari selector `.cl-*` di globals.css; pakai `elements` API resmi Clerk.
 */
export function getClerkAppearance({ isDark = false }: ClerkAppearanceOptions = {}): ClerkAppearance {
  return {
    theme: shadcn,
    options: {
      /** Hilangkan stripe oranye "Development mode" — hanya muncul di dev keys Clerk */
      unsafe_disableDevelopmentModeWarnings: true,
    },
    variables: {
      colorPrimary: 'var(--primary)',
      colorDanger: 'var(--destructive)',
      colorSuccess: 'var(--primary)',
      colorBackground: isDark ? 'var(--popover)' : 'var(--card)',
      colorInput: isDark ? 'var(--muted)' : 'var(--background)',
      colorForeground: 'var(--foreground)',
      colorMutedForeground: 'var(--muted-foreground)',
      colorInputForeground: 'var(--foreground)',
      borderRadius: '0.75rem',
      fontFamily: 'var(--font-sans), system-ui, sans-serif',
    },
    elements: buildElements(isDark),
  };
}

/** @deprecated Prefer `useClerkAppearance()` */
export const clerkAppearance = getClerkAppearance();
