'use client';

import Image from 'next/image';
import { useIsClient } from '@/lib/hooks/use-is-client';
import { cn } from '@/lib/utils';

type ProfileAvatarProps = {
    className?: string;
    imageUrl: string | null | undefined;
    initial: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
};

const SIZE_CLASSES = {
    sm: 'size-7 rounded-lg text-xs',
    md: 'size-10 rounded-xl text-sm',
    lg: 'size-12 rounded-xl text-lg',
    xl: 'size-24 rounded-2xl text-4xl sm:size-28 sm:text-5xl',
} as const;

const PIXEL_SIZES = {
    sm: 28,
    md: 40,
    lg: 48,
    xl: 112,
} as const;

/**
 * Avatar with initials fallback — defers photo until after hydration so Clerk/session
 * cache URLs do not mismatch SSR (span) vs client (img).
 */
export function ProfileAvatar({
    className,
    imageUrl,
    initial,
    size = 'md',
}: ProfileAvatarProps) {
    const isClient = useIsClient();
    const sizeClass = SIZE_CLASSES[size];
    const pixels = PIXEL_SIZES[size];

    if (isClient && imageUrl) {
        const isR2 = imageUrl.includes('.r2.dev');
        return (
            <Image
                src={imageUrl}
                alt=""
                width={pixels}
                height={pixels}
                unoptimized={isR2}
                className={cn('shrink-0 object-cover shadow-md', sizeClass, className)}
            />
        );
    }

    return (
        <span
            className={cn(
                'flex shrink-0 items-center justify-center bg-linear-to-br from-primary to-brand-orange font-bold text-primary-foreground shadow-md',
                sizeClass,
                className,
            )}
            aria-hidden
        >
            {initial}
        </span>
    );
}
