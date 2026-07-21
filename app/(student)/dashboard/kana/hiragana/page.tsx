import type { Metadata } from 'next';
import { KanaChartPage } from '@/features/kana/components/kana-chart-page';

export const metadata: Metadata = {
  title: 'Hiragana — JepangKu LMS',
  description: 'Chart Hiragana interaktif: gojūon, dakuten, dan yōon.',
};

export default function DashboardKanaHiraganaRoutePage() {
  return <KanaChartPage script="hiragana" />;
}
