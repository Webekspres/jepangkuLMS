import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/features/marketing/components/legal-document-page';
import { PRIVACY_DOCUMENT } from '@/features/marketing/components/legal-data';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — JepangKu LMS',
  description: 'Kebijakan privasi dan perlindungan data pengguna JepangKu LMS.',
};

export default function KebijakanPrivasiPage() {
  return <LegalDocumentPage document={PRIVACY_DOCUMENT} />;
}
