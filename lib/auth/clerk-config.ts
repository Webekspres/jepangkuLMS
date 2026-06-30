/**
 * Clerk publishable key at runtime.
 * Docker env_file sets CLERK_PUBLISHABLE_KEY (pk_test on staging, pk_live on prod);
 * NEXT_PUBLIC_* is baked at image build and may drift — prefer server env when set.
 */
export function getClerkPublishableKey(): string {
    const key =
        process.env.CLERK_PUBLISHABLE_KEY?.trim() ||
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
    if (!key) {
        throw new Error('CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required');
    }
    return key;
}
