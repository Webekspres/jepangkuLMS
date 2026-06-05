import type { Metadata } from 'next';
import { ContactPage } from '@/features/marketing/components/contact-page';

export const metadata: Metadata = {
  title: 'Hubungi Kami — JepangKu LMS',
  description:
    'Hubungi admin JepangKu via WhatsApp untuk pertanyaan kursus, pembayaran, atau bantuan teknis.',
};

export default function HubungiPage() {
  return <ContactPage />;
}
