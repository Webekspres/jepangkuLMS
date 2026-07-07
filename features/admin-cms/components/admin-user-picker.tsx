'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { Check, Loader2, Search, User, X } from 'lucide-react';
import { searchAdminUsersAction } from '@/features/admin-cms/actions/cms-user-actions';
import type { AdminUserSearchResult } from '@/features/admin-cms/lib/search-admin-users';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CLERK_USER_ID_PATTERN = /^user_[a-zA-Z0-9]+$/;
const SEARCH_DEBOUNCE_MS = 350;
const MIN_SEARCH_LENGTH = 2;

type AdminUserPickerProps = {
  id?: string;
  label?: string;
  value: string;
  onValueChange: (userId: string) => void;
  onUserSelected?: (user: AdminUserSearchResult | null) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Sembunyikan hint di bawah field (untuk form yang punya hint global). */
  showHint?: boolean;
  /** Sembunyikan label internal — parent menyediakan label di grid. */
  hideLabel?: boolean;
};

export function AdminUserPicker({
  id,
  label = 'Siswa',
  value,
  onValueChange,
  onUserSelected,
  disabled = false,
  required = false,
  className,
  showHint = true,
  hideLabel = false,
}: AdminUserPickerProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchSeqRef = useRef(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminUserSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserSearchResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!value) {
      setSelectedUser(null);
      return;
    }
    if (selectedUser?.id === value) return;

    if (CLERK_USER_ID_PATTERN.test(value)) {
      setSelectedUser({
        id: value,
        resolvedDisplayName: value,
        displayName: null,
        ssoDisplayName: null,
      });
    }
  }, [value, selectedUser?.id]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_SEARCH_LENGTH || CLERK_USER_ID_PATTERN.test(trimmed)) {
      setResults([]);
      setHasSearched(false);
      setOpen(false);
      return;
    }

    const seq = ++searchSeqRef.current;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await searchAdminUsersAction(trimmed);
        if (seq !== searchSeqRef.current) return;

        if (result.ok) {
          setResults(result.users);
          setHasSearched(true);
          setOpen(true);
        }
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  function selectUser(user: AdminUserSearchResult) {
    setSelectedUser(user);
    onValueChange(user.id);
    onUserSelected?.(user);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setOpen(false);
    searchSeqRef.current += 1;
  }

  function clearSelection() {
    setSelectedUser(null);
    onValueChange('');
    onUserSelected?.(null);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setOpen(false);
    searchSeqRef.current += 1;
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    const trimmed = next.trim();

    if (CLERK_USER_ID_PATTERN.test(trimmed)) {
      const directUser: AdminUserSearchResult = {
        id: trimmed,
        resolvedDisplayName: trimmed,
        displayName: null,
        ssoDisplayName: null,
      };
      setSelectedUser(directUser);
      onValueChange(trimmed);
      onUserSelected?.(directUser);
      setResults([]);
      setHasSearched(false);
      setOpen(false);
      searchSeqRef.current += 1;
      return;
    }

    if (selectedUser) {
      setSelectedUser(null);
      onValueChange('');
      onUserSelected?.(null);
    }
  }

  const trimmedQuery = query.trim();
  const showDropdown =
    open &&
    !disabled &&
    !selectedUser &&
    trimmedQuery.length >= MIN_SEARCH_LENGTH &&
    !CLERK_USER_ID_PATTERN.test(trimmedQuery);

  const showEmptyState = showDropdown && hasSearched && !isPending && results.length === 0;

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-2', className)}>
      {hideLabel ? null : <Label htmlFor={inputId}>{label}</Label>}

      {selectedUser ? (
        <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-none text-foreground">
              {selectedUser.resolvedDisplayName}
            </p>
            <p className="mt-0.5 truncate font-mono text-[10px] leading-none text-muted-foreground">
              {selectedUser.id}
            </p>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            disabled={disabled}
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Hapus pilihan siswa"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={inputId}
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onFocus={() => {
              if (results.length > 0 || showEmptyState) setOpen(true);
            }}
            placeholder="Cari nama atau Clerk ID…"
            className="h-10 pl-9 pr-9"
            disabled={disabled}
            required={required}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={`${inputId}-listbox`}
            aria-autocomplete="list"
          />
          {isPending ? (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}

          {showDropdown ? (
            <div
              id={`${inputId}-listbox`}
              role="listbox"
              className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md"
            >
              {results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected={value === user.id}
                  className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left transition-colors hover:bg-muted"
                  onClick={() => selectUser(user)}
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.resolvedDisplayName}
                    </p>
                    {user.displayName &&
                    user.ssoDisplayName &&
                    user.displayName.trim() !== user.ssoDisplayName.trim() ? (
                      <p className="truncate text-xs text-muted-foreground">
                        SSO: {user.ssoDisplayName}
                      </p>
                    ) : null}
                    <p className="truncate font-mono text-[10px] text-muted-foreground">{user.id}</p>
                  </div>
                  {value === user.id ? <Check className="mt-1 size-4 shrink-0 text-primary" /> : null}
                </button>
              ))}

              {showEmptyState ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Tidak ada pengguna ditemukan.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {showHint ? (
        <p className="text-[11px] leading-snug text-muted-foreground">
          Ketik min. {MIN_SEARCH_LENGTH} karakter untuk mencari, atau tempel Clerk ID.
        </p>
      ) : null}
    </div>
  );
}
