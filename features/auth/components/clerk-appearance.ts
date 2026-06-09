/**
 * Primary CTA — mirror `components/ui/button.tsx` default variant (3D retro press).
 * Detail visual di `app/globals.css` (`.clerk-auth-primary-btn`) agar mengalahkan inline Clerk.
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

/** Google / OAuth — mirror `button.tsx` outline variant */
const clerkSocialButtonClass = [
  'clerk-auth-social-btn',
  'h-auto w-full !rounded-sm !border !border-slate-300',
  '!bg-linear-to-b !from-white !to-slate-100 !text-slate-800',
  '!py-3.5 !text-sm !font-semibold',
  'transition-[transform,box-shadow,filter] duration-150 ease-out',
  'hover:scale-[1.03] hover:brightness-105',
  'active:translate-y-[3px] active:scale-[0.995]',
  '!shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_2px_0_0_rgba(255,255,255,0.7)_inset,0_4px_0_0_#e2e8f0,0_5px_0_0_#94a3b8,0_8px_14px_-10px_rgba(15,23,42,0.18)]',
  'hover:!shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_2px_0_0_rgba(255,255,255,0.7)_inset,0_5px_0_0_#cbd5e1,0_6px_0_0_#94a3b8,0_11px_18px_-10px_rgba(15,23,42,0.22)]',
  'active:!shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_2px_0_0_rgba(255,255,255,0.7)_inset,0_2px_0_0_#cbd5e1,0_3px_0_0_#94a3b8,0_5px_10px_-10px_rgba(15,23,42,0.18)]',
].join(' ');

/** Clerk prebuilt UI — selaras token brand JepangKu (DESIGN.md / globals.css) */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#EC1D24',
    colorText: '#12112d',
    colorTextSecondary: '#6b6b80',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#12112d',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'gap-4 shadow-none border-0 bg-transparent p-0',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton: clerkSocialButtonClass,
    socialButtonsBlockButtonText: '!text-sm !font-semibold !text-slate-800',
    dividerLine: 'bg-border',
    dividerText: 'text-xs font-medium text-muted-foreground',
    formFieldLabel: 'text-sm font-semibold text-foreground',
    formFieldInput:
      'rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-none focus:border-primary focus:ring-2 focus:ring-primary/20',
    formButtonPrimary: clerkPrimaryButtonClass,
    formButtonPrimaryIcon: '!hidden',
    footerActionLink: 'font-bold text-primary hover:underline',
    footerActionText: 'text-sm text-muted-foreground',
    identityPreviewEditButton: 'text-primary',
    formFieldAction: 'text-xs font-medium text-primary',
    alert: 'rounded-xl border border-destructive/30 bg-destructive/5 text-destructive',
    alertText: 'text-sm',
  },
} as const;
