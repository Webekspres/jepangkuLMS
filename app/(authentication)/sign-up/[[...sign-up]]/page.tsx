import type { Metadata } from 'next';
import { SignUpPage } from '@/features/auth/components';

export const metadata: Metadata = {
  title: 'Daftar — JepangKu LMS',
  description: 'Buat akun JepangKu gratis dan mulai belajar bahasa Jepang dari N5 hingga N1.',
};

export default function SignUpRoutePage() {
  return <SignUpPage />;
}
