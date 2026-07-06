// Runs before any other client-side code, including Next.js's own dev-overlay
// error listeners — required so the Vidstack "provider destroyed" teardown
// rejection (see lib/vidstack/suppress-provider-destroyed-rejection.ts) is
// suppressed before Next's overlay reacts to it.
import '@/lib/vidstack/suppress-provider-destroyed-rejection';
