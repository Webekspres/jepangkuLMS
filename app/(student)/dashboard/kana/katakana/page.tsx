import type { Metadata } from 'next';
import { KanaChartPage } from '@/features/kana/components/kana-chart-page';

export const metadata: Metadata = {
  title: 'Katakana — JepangKu LMS',
  description: 'Chart Katakana interaktif: gojūon, dakuten, dan yōon.',
};

export default function DashboardKanaKatakanaRoutePage() {
  return <KanaChartPage script="katakana" />;
}
