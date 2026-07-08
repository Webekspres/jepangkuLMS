import type { CourseImportPreview } from '@/features/admin-cms/lib/course-import-types';

export function buildCourseImportReportText(preview: CourseImportPreview): string {
  const lines: string[] = [
    'Laporan Impor Kursus — JepangKu LMS',
    `Dibuat: ${new Date().toLocaleString('id-ID')}`,
  ];

  if (preview.template) {
    lines.push(`Template: ${preview.template.key} ${preview.template.version} (${preview.template.detectedBy})`);
  }

  lines.push(
    `Ringkasan: ${preview.courseCount} kursus, ${preview.moduleCount} modul, ${preview.lessonCount} pelajaran`,
    `Status: ${preview.ok ? 'Siap diimpor' : 'Ada error — perlu diperbaiki'}`,
    '',
  );

  if (preview.errors.length > 0) {
    lines.push('=== ERROR ===');
    for (const error of preview.errors) {
      const code = error.code ? `[${error.code}] ` : '';
      lines.push(`${code}${error.message}`);
    }
    lines.push('');
  }

  const structuredWarnings = preview.structuredWarnings ?? [];
  if (structuredWarnings.length > 0) {
    lines.push('=== PERINGATAN ===');
    for (const warning of structuredWarnings) {
      const code = warning.code ? `[${warning.code}] ` : '';
      lines.push(`${code}${warning.message}`);
    }
    lines.push('');
  } else if (preview.warnings.length > 0) {
    lines.push('=== PERINGATAN ===');
    for (const warning of preview.warnings) {
      lines.push(warning);
    }
    lines.push('');
  }

  if (preview.modulePreview && preview.modulePreview.length > 0) {
    lines.push('=== STRUKTUR MODUL ===');
    for (const module of preview.modulePreview) {
      lines.push(`Modul ${module.order}: ${module.moduleTitle} (${module.moduleExternalId})`);
      for (const lesson of module.lessons) {
        lines.push(`  - [${lesson.lessonType}] ${lesson.title} (${lesson.lessonExternalId})`);
      }
    }
  }

  return lines.join('\n');
}
