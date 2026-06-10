import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/features/marketing/components/legal-document-page';
import { TERMS_DOCUMENT } from '@/features/marketing/components/legal-data';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — JepangKu LMS',
  description: 'Syarat dan ketentuan penggunaan platform JepangKu LMS.',
};

export default function SyaratKetentuanPage() {
  return <LegalDocumentPage document={TERMS_DOCUMENT} />;
}
