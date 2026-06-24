'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AdminConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

/** Tombol dialog — tanpa efek 3D game agar cocok di modal. */
const dialogBtnClass =
  'rounded-lg shadow-none hover:scale-100 hover:brightness-100 active:translate-y-0 active:scale-100';

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Hapus',
  loading = false,
  onConfirm,
}: AdminConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader className="gap-2 pr-10 text-left">
          <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className={cn(dialogBtnClass, 'min-w-22 border-border bg-background')}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={loading}
            className={cn(
              dialogBtnClass,
              'min-w-22 border border-destructive/20 bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90',
            )}
            onClick={() => void onConfirm()}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
