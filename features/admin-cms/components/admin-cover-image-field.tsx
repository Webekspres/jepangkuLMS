'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Cropper, { type Area } from 'react-easy-crop';
import { CloudUpload, FileImage, Loader2, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  COVER_IMAGE_ASPECT,
  COVER_IMAGE_MAX_BYTES,
  COVER_IMAGE_MIME_TYPES,
  COVER_IMAGE_RECOMMENDED_HEIGHT,
  COVER_IMAGE_RECOMMENDED_WIDTH,
} from '@/lib/media/constants';
import { isUnoptimizedImageSrc, resolveMediaUrl } from '@/lib/media/image-src';
import { cn } from '@/lib/utils';

export type AdminCoverImageFieldState = {
  file: File | null;
  removeCover: boolean;
};

type AdminCoverImageFieldProps = {
  id?: string;
  label?: string;
  existingUrl?: string | null;
  disabled?: boolean;
  /** Untuk form native (live class) — file & removeCover ikut submit otomatis */
  nativeForm?: boolean;
  inputName?: string;
  onChange?: (state: AdminCoverImageFieldState) => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function syncNativeFileInput(input: HTMLInputElement | null, file: File | null) {
  if (!input) return;
  if (!file) {
    input.value = '';
    return;
  }
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
}

export function AdminCoverImageField({
  id: idProp,
  label = 'Cover Image',
  existingUrl = null,
  disabled = false,
  nativeForm = false,
  inputName = 'coverImage',
  onChange,
}: AdminCoverImageFieldProps) {
  const autoId = useId();
  const fieldId = idProp ?? `cover-image-${autoId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const filePreviewRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState('cover.webp');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);

  const resolvedExisting = resolveMediaUrl(existingUrl) ?? existingUrl?.trim() ?? null;
  const hasCustomCover = Boolean(file || (resolvedExisting && !removeCover));
  const previewSrc = filePreviewUrl
    ? filePreviewUrl
    : removeCover
      ? null
      : resolvedExisting;

  const notifyChange = useCallback(
    (next: AdminCoverImageFieldState) => {
      onChange?.(next);
    },
    [onChange],
  );

  const revokeFilePreview = useCallback(() => {
    if (filePreviewRef.current) {
      URL.revokeObjectURL(filePreviewRef.current);
      filePreviewRef.current = null;
    }
    setFilePreviewUrl(null);
  }, []);

  useEffect(
    () => () => {
      if (filePreviewRef.current) URL.revokeObjectURL(filePreviewRef.current);
    },
    [],
  );

  const closeCropModal = () => {
    setCropModalOpen(false);
    setCropImageSrc(null);
    setCroppedAreaPixels(null);
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
    if (inputRef.current) inputRef.current.value = '';
  };

  const openCropModal = (picked: File) => {
    setError(null);
    if (picked.size > COVER_IMAGE_MAX_BYTES) {
      setError('Ukuran gambar maksimal 2 MB.');
      return;
    }
    if (!COVER_IMAGE_MIME_TYPES.includes(picked.type as (typeof COVER_IMAGE_MIME_TYPES)[number])) {
      setError('Format gambar harus PNG, JPEG, atau WebP.');
      return;
    }

    const baseName = picked.name.replace(/\.[^.]+$/, '') || 'cover';
    setPendingFileName(`${baseName}.jpg`);

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      setCropModalOpen(true);
    };
    reader.onerror = () => setError('Gagal membaca file gambar.');
    reader.readAsDataURL(picked);
  };

  const commitFile = (nextFile: File) => {
    revokeFilePreview();
    const previewUrl = URL.createObjectURL(nextFile);
    filePreviewRef.current = previewUrl;
    setFilePreviewUrl(previewUrl);
    setFile(nextFile);
    setRemoveCover(false);
    if (nativeForm) syncNativeFileInput(inputRef.current, nextFile);
    notifyChange({ file: nextFile, removeCover: false });
  };

  const handleApplyCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    setIsApplyingCrop(true);
    try {
      const { getCroppedImg } = await import('@/features/student/lib/crop-image');
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels, rotation);
      if (!croppedBlob) {
        setError('Gagal memotong gambar.');
        return;
      }
      const croppedFile = new File([croppedBlob], pendingFileName, {
        type: 'image/jpeg',
      });
      if (croppedFile.size > COVER_IMAGE_MAX_BYTES) {
        setError('Hasil potongan melebihi 2 MB. Perkecil zoom atau pilih gambar lain.');
        return;
      }
      commitFile(croppedFile);
      closeCropModal();
    } catch {
      setError('Gagal memproses potongan gambar.');
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0];
    if (!picked) return;
    openCropModal(picked);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = () => {
    revokeFilePreview();
    setFile(null);
    setRemoveCover(true);
    setError(null);
    if (nativeForm) syncNativeFileInput(inputRef.current, null);
    else if (inputRef.current) inputRef.current.value = '';
    notifyChange({ file: null, removeCover: true });
  };

  const statusLabel = file
    ? `${file.name} · ${formatFileSize(file.size)}`
    : resolvedExisting && !removeCover
      ? 'Cover tersimpan'
      : null;

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Unggah cover image"
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (!disabled) handleFiles(event.dataTransfer.files);
          }}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'relative m-3 aspect-video cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors',
            dragOver
              ? 'border-secondary bg-secondary/10'
              : 'border-secondary/50 bg-secondary/5 hover:border-secondary hover:bg-secondary/10',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          {hasCustomCover && previewSrc ? (
            <>
              <Image
                src={previewSrc}
                alt="Pratinjau cover"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40rem"
                unoptimized={Boolean(file) || isUnoptimizedImageSrc(previewSrc)}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white">
                <CloudUpload className="size-10 drop-shadow-md" />
                <p className="text-sm font-semibold drop-shadow-sm">Klik atau seret untuk ganti file</p>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <CloudUpload className="size-10 text-secondary" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Jelajahi file untuk unggah</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPEG, atau WebP · maks. 2 MB
                </p>
              </div>
            </div>
          )}
        </div>

        {statusLabel ? (
          <div className="flex items-center gap-3 border-t border-border bg-muted/40 px-4 py-3">
            <FileImage className="size-5 shrink-0 text-secondary" aria-hidden />
            <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{statusLabel}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              disabled={disabled}
              aria-label="Hapus cover"
              onClick={(event) => {
                event.stopPropagation();
                handleRemove();
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        name={nativeForm ? inputName : undefined}
        accept={COVER_IMAGE_MIME_TYPES.join(',')}
        className="hidden"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />

      {nativeForm && removeCover ? (
        <input type="hidden" name="removeCover" value="on" />
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <p className="text-xs text-muted-foreground">
        Rekomendasi: {COVER_IMAGE_RECOMMENDED_WIDTH}×{COVER_IMAGE_RECOMMENDED_HEIGHT} px (rasio 16:9),
        format WebP/JPEG/PNG, maks. 2 MB. Gambar akan dipotong agar pas sebelum diunggah.
      </p>

      {cropModalOpen && cropImageSrc ? (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${fieldId}-crop-title`}
            className="relative flex w-full max-w-xl flex-col rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4">
              <h2 id={`${fieldId}-crop-title`} className="text-lg font-bold text-foreground">
                Sesuaikan Cover Image
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Geser dan perbesar agar pas di bingkai 16:9 ({COVER_IMAGE_RECOMMENDED_WIDTH}×
                {COVER_IMAGE_RECOMMENDED_HEIGHT} px).
              </p>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={COVER_IMAGE_ASPECT}
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Perbesar (Zoom)</span>
                  <span>{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-secondary"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Putar</span>
                  <span>{rotation}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(event) => setRotation(Number(event.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-secondary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="ghost" disabled={isApplyingCrop} onClick={closeCropModal}>
                Batal
              </Button>
              <Button
                type="button"
                disabled={isApplyingCrop || !croppedAreaPixels}
                onClick={() => void handleApplyCrop()}
              >
                {isApplyingCrop ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memproses…
                  </>
                ) : (
                  'Terapkan'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
