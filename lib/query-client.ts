import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

const STALE_TIME_MS = 60 * 1000;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Satu QueryClient per request di server; singleton di browser.
 * Gunakan saat prefetch/hydrate dari Server Components.
 */
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}
