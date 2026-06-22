import { BADGE_IMAGE_MAX_BYTES } from '@/lib/media/constants';

export type OptimizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxBytes?: number;
};

export type OptimizedImageResult = {
  file: File;
  previewUrl: string;
  originalSize: number;
  optimizedSize: number;
};

const DEFAULT_OPTIONS: Required<OptimizeImageOptions> = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.85,
  maxBytes: BADGE_IMAGE_MAX_BYTES,
};

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar.'));
    img.src = src;
  });
}

function scaleDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Konversi WebP gagal.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality,
    );
  });
}

function replaceExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return `${base || 'image'}.${ext}`;
}

/**
 * Resize and convert an image to WebP in the browser before upload.
 * Falls back to the original file when canvas/WebP is unavailable.
 */
export async function optimizeImageFileForUpload(
  file: File,
  options: OptimizeImageOptions = {},
): Promise<OptimizedImageResult> {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      file,
      previewUrl: URL.createObjectURL(file),
      originalSize: file.size,
      optimizedSize: file.size,
    };
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImageElement(objectUrl);
    const { width, height } = scaleDimensions(
      img.naturalWidth,
      img.naturalHeight,
      merged.maxWidth,
      merged.maxHeight,
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas tidak didukung di browser ini.');
    }

    ctx.drawImage(img, 0, 0, width, height);

    let quality = merged.quality;
    let blob = await canvasToWebpBlob(canvas, quality);

    while (blob.size > merged.maxBytes && quality > 0.45) {
      quality -= 0.1;
      blob = await canvasToWebpBlob(canvas, quality);
    }

    const optimizedFile = new File([blob], replaceExtension(file.name, 'webp'), {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      previewUrl: URL.createObjectURL(blob),
      originalSize: file.size,
      optimizedSize: optimizedFile.size,
    };
  } catch {
    return {
      file,
      previewUrl: objectUrl,
      originalSize: file.size,
      optimizedSize: file.size,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
