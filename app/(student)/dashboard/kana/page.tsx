import type { Metadata } from 'next';
import { KanaHubPage } from '@/features/kana/components/kana-hub-page';

export const metadata: Metadata = {
  title: 'Hiragana & Katakana — JepangKu LMS',
  description:
    'Chart interaktif Hiragana dan Katakana dengan audio, animasi penulisan, dan contoh kosakata.',
};

export default function DashboardKanaHubRoutePage() {
  return <KanaHubPage />;
}
