import { Prisma } from '@prisma/client';
import type { CourseImportRowError } from '@/features/admin-cms/lib/course-import-types';

export type MappedImportPersistenceError = {
  message: string;
  errors: CourseImportRowError[];
};

function uniqueTargetFields(meta: unknown): string[] {
  if (!meta || typeof meta !== 'object' || !('target' in meta)) return [];
  const target = (meta as { target?: unknown }).target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === 'string') return [target];
  return [];
}

export function mapPrismaImportError(error: unknown): MappedImportPersistenceError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;

  if (error.code === 'P2002') {
    const fields = uniqueTargetFields(error.meta);
    const fieldLabel = fields.length > 0 ? fields.join(', ') : 'unik';

    if (fields.includes('courseId') && fields.includes('order')) {
      return {
        message:
          'Impor gagal: kursus dengan ID atau slug yang sama sudah ada, dan urutan modul bentrok dengan data lama. Impor ulang seharusnya menimpa kursus tersebut — coba lagi. Jika masih gagal, hapus kursus lama di halaman Kelola Kursus lalu impor ulang.',
        errors: [
          {
            row: 0,
            code: 'MODULE_ORDER_CONFLICT',
            message:
              'Urutan modul bentrok dengan modul yang sudah ada di kursus ini (courseId + order).',
            sheet: '2. Module',
          },
        ],
      };
    }

    if (fields.includes('slug')) {
      const isLesson = fields.includes('moduleId') || fieldLabel.includes('Lesson');
      return {
        message: isLesson
          ? 'Impor gagal: slug pelajaran bentrok dengan pelajaran lain di database. Ubah judul/ID eksternal pelajaran di workbook atau hapus pelajaran lama yang bentrok.'
          : 'Impor gagal: slug URL bentrok dengan data yang sudah ada. Ubah judul kursus/modul di workbook atau hapus entri lama di admin.',
        errors: [
          {
            row: 0,
            code: 'SLUG_CONFLICT',
            message: `Pelanggaran unik pada kolom: ${fieldLabel}.`,
          },
        ],
      };
    }

    if (fields.includes('courseExternalId') || fields.includes('moduleExternalId') || fields.includes('lessonExternalId')) {
      return {
        message:
          'Impor gagal: ID eksternal bentrok dengan data lain. Pastikan ID eksternal unik di workbook, atau hapus kursus lama yang memakai ID yang sama.',
        errors: [
          {
            row: 0,
            code: 'EXTERNAL_ID_CONFLICT',
            message: `Pelanggaran unik pada kolom: ${fieldLabel}.`,
          },
        ],
      };
    }

    return {
      message: `Impor gagal: data bentrok dengan catatan yang sudah ada (${fieldLabel}). Periksa ID eksternal/slug di workbook atau hapus data lama di admin.`,
      errors: [
        {
          row: 0,
          code: 'UNIQUE_CONSTRAINT',
          message: `Pelanggaran unik database: ${fieldLabel}.`,
        },
      ],
    };
  }

  if (error.code === 'P2003') {
    return {
      message: 'Impor gagal: referensi data tidak valid (relasi ke kursus/modul/pelajaran hilang). Periksa konsistensi ID eksternal antar tab workbook.',
      errors: [
        {
          row: 0,
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Foreign key constraint gagal saat menyimpan impor.',
        },
      ],
    };
  }

  return {
    message: `Impor gagal karena error database (${error.code}). Hubungi tim dev jika masalah berulang.`,
    errors: [
      {
        row: 0,
        code: error.code,
        message: error.message,
      },
    ],
  };
}
