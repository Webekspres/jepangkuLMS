import type { Metadata } from 'next';
import { SignUpPage } from '@/features/auth/components';

export const metadata: Metadata = {
  title: 'Daftar — JepangKu LMS',
  description: 'Buat akun JepangKu gratis dan mulai belajar bahasa Jepang.',
};

export default function SignUpCatchAllPage() {
  return <SignUpPage />;
}
