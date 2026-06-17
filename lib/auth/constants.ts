/** HttpOnly cookie — Core JWT setelah exchange Clerk → Core */
export const CORE_JWT_COOKIE = 'jepangku_core_jwt';

/** Max age cookie — selaras Core token (7 hari) */
export const CORE_JWT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const AUTH_ROUTES = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  /** Unified OAuth callback — satu URL untuk Clerk allow-list */
  ssoCallback: '/auth/sso-callback',
  signInSsoCallback: '/sign-in/sso-callback',
  signUpSsoCallback: '/sign-up/sso-callback',
  authComplete: '/auth/complete',
  dashboard: '/dashboard',
} as const;

export const ADMIN_ROUTES = {
  dashboard: '/admin/dashboard',
  pembayaran: '/admin/pembayaran',
  kursus: '/admin/kursus',
  kursusForm: '/admin/kursus/form',
  lesson: '/admin/lesson',
  lessonForm: '/admin/lesson/form',
  quiz: '/admin/quiz',
  quizImport: '/admin/quiz/import',
} as const;
