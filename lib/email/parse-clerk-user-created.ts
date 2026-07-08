export type ClerkUserCreatedPayload = {
  userId: string;
  email: string;
  name: string;
};

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserCreatedData = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
};

function resolveDisplayName(data: ClerkUserCreatedData, email: string): string {
  const parts = [data.first_name, data.last_name]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  if (parts.length > 0) {
    return parts.join(' ');
  }

  const local = email.split('@')[0]?.trim();
  if (local) {
    return local;
  }

  return 'Kawan JepangKu';
}

function resolvePrimaryEmail(data: ClerkUserCreatedData): string | null {
  const addresses = data.email_addresses ?? [];
  if (addresses.length === 0) return null;

  const primaryId = data.primary_email_address_id;
  if (primaryId) {
    const primary = addresses.find((row) => row.id === primaryId);
    if (primary?.email_address) return primary.email_address;
  }

  return addresses[0]?.email_address ?? null;
}

/** Extract welcome-email fields from Clerk `user.created` webhook body. */
export function parseClerkUserCreatedEvent(
  evt: unknown,
): ClerkUserCreatedPayload | null {
  if (!evt || typeof evt !== 'object') return null;

  const type = 'type' in evt ? String((evt as { type?: string }).type) : '';
  if (type !== 'user.created') return null;

  const rawData = 'data' in evt ? (evt as { data?: unknown }).data : null;
  if (!rawData || typeof rawData !== 'object') return null;

  const data = rawData as ClerkUserCreatedData;
  if (!data.id?.trim()) return null;

  const email = resolvePrimaryEmail(data);
  if (!email) return null;

  return {
    userId: data.id,
    email,
    name: resolveDisplayName(data, email),
  };
}
