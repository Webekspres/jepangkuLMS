import type { Metadata } from 'next';
import { LoginPage } from '@/features/auth/components';

export const metadata: Metadata = {
  title: 'Masuk — JepangKu LMS',
  description: 'Login ke akun JepangKu dan lanjutkan perjalanan belajar bahasa Jepang.',
};

export default function SignInCatchAllPage() {
  return <LoginPage />;
}
