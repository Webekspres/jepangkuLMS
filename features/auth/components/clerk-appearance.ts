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

/** OAuth — light: 3D outline (globals.css); dark: flat & bersih */
const clerkSocialButtonLight = [
  'clerk-auth-social-btn',
  'h-11 w-full !rounded-xl !border !border-border !bg-background !text-foreground',
  '!text-sm !font-semibold !shadow-none',
  'transition-colors duration-150 hover:!bg-muted/50',
].join(' ');

const clerkSocialButtonDark = [
  'clerk-auth-social-btn',
  'h-11 w-full !rounded-xl !border !border-border',
  '!bg-muted/20 !text-foreground !shadow-none',
  '!text-sm !font-semibold',
  'transition-colors duration-150 hover:!bg-muted/40 active:!bg-muted/50',
  '!scale-100 hover:!scale-100 active:!translate-y-0',
].join(' ');

const clerkLastUsedBadgeClass = [
  'rounded-full border border-border bg-muted px-2 py-0.5',
  'text-[10px] font-medium leading-none text-muted-foreground shadow-none',
].join(' ');

function buildElements(isDark: boolean): NonNullable<ClerkAppearance['elements']> {
  return {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none bg-transparent',
    card: isDark
      ? 'flex flex-col gap-5 border-0 bg-transparent p-0 shadow-none'
      : 'flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-none',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsRoot: 'gap-3',
    socialButtons: 'gap-3',
    socialButtonsBlockButton: isDark ? clerkSocialButtonDark : clerkSocialButtonLight,
    socialButtonsBlockButtonText: '!text-sm !font-semibold !text-foreground',
    lastAuthenticationStrategyBadge: clerkLastUsedBadgeClass,
    dividerLine: 'bg-border',
    dividerText: 'text-xs font-medium text-muted-foreground',
    formFieldLabel: 'text-sm font-semibold text-foreground',
    formFieldInput: isDark
      ? 'rounded-xl border border-border bg-muted/15 px-4 py-3 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15'
      : 'rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-none focus:border-primary focus:ring-2 focus:ring-primary/20',
    formButtonPrimary: clerkPrimaryButtonClass,
    formButtonPrimaryIcon: '!hidden',
    footer: {
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
    footerPages: {
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
    baseTheme: shadcn,
    /** Hilangkan stripe oranye "Development mode" — hanya muncul di dev keys Clerk */
    unsafe_disableDevelopmentModeWarnings: true,
    variables: {
      colorPrimary: 'var(--primary)',
      colorDanger: 'var(--destructive)',
      colorSuccess: 'var(--primary)',
      borderRadius: '0.75rem',
      fontFamily: 'var(--font-sans), system-ui, sans-serif',
    },
    elements: buildElements(isDark),
  };
}

/** @deprecated Prefer `useClerkAppearance()` */
export const clerkAppearance = getClerkAppearance();
