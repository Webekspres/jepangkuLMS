export { getCoreApiBaseUrl, isCoreApiConfigured } from './client';
export {
  getGamificationFromClaims,
  getGamificationSummary,
  getLeaderboard,
  getUserProfile,
  getUserProfileFromClaims,
} from './user-profile';
export { getCoreSession } from './get-core-session';
export {
  fetchCoreBadgeCatalog,
  fetchCoreLeaderboard,
  fetchCoreUserBadges,
  fetchCoreUserMe,
  type CoreBadgeCatalogItem,
  type CoreLeaderboardItem,
  type CoreUserBadgeItem,
  type CoreUserProfileResponse,
} from './api';
export { buildSessionFromVerifiedJwt, hasRole } from './session';
export {
  getRolesFromClaims,
  mapClaimsToGamificationSummary,
  mapClaimsToUserProfile,
  parseJwtPayload,
  type JepangKuJwtClaims,
} from './jwt-claims';
export { awardLmsXp, isCoreAwardConfigured } from './gamification';
export { buildLmsIdempotencyKey, toCoreActivityType } from './activity-map';
export { getCoreServiceToken, CORE_APPLICATION_LMS } from './config';
export type { CoreSession } from './session';
export type {
  CoreGamificationSummary,
  CoreLeaderboardEntry,
  CoreUserProfile,
} from './types';
