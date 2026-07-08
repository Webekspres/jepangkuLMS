export type SupportedCourseImportTemplate =
  | {
      key: 'sensei-jlpt';
      version: 'v1';
      detectedBy: 'sheet-pattern';
    }
  | {
      key: 'official-course';
      version: 'v1';
      detectedBy: 'metadata';
    };

export type SupportedCourseImportTemplateKey = SupportedCourseImportTemplate['key'];
