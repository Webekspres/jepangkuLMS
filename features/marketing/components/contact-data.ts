import type { LucideIcon } from 'lucide-react';
import { BookOpen, CreditCard, HelpCircle, UserPlus } from 'lucide-react';
import { ADMIN_CONTACT, buildWhatsAppUrl } from '@/lib/admin-contact';

export const CONTACT_HERO = {
  badge: 'お問い合わせ',
  title: 'Hubungi Kami',
  subtitle:
    'Punya pertanyaan tentang kursus, pembayaran, atau akses akun? Tim admin JepangKu siap membantu via WhatsApp.',
} as const;

export const CONTACT_DEFAULT_MESSAGE =
  'Halo, saya ingin bertanya tentang JepangKu LMS. Bisa dibantu?';

export type ContactTopic = {
  icon: LucideIcon;
  title: string;
  desc: string;
  message: string;
};

export const CONTACT_TOPICS: ContactTopic[] = [
  {
    icon: UserPlus,
    title: 'Daftar & Akses Akun',
    desc: 'Bantuan membuat akun, login, atau aktivasi setelah daftar.',
    message:
      'Halo, saya ingin bertanya tentang pendaftaran dan akses akun JepangKu LMS.',
  },
  {
    icon: BookOpen,
    title: 'Info Kursus & Materi',
    desc: 'Pertanyaan seputar level JLPT, silabus, atau ketersediaan modul.',
    message: 'Halo, saya ingin konsultasi mengenai kursus dan materi belajar di JepangKu.',
  },
  {
    icon: CreditCard,
    title: 'Pembayaran & Paket',
    desc: 'Konfirmasi transfer, harga paket, atau invoice pembayaran.',
    message:
      'Halo, saya ingin konfirmasi / bertanya tentang pembayaran kursus JepangKu.',
  },
  {
    icon: HelpCircle,
    title: 'Kendala Teknis',
    desc: 'Video tidak bisa diputar, kuis error, atau masalah di platform.',
    message:
      'Halo, saya mengalami kendala teknis di JepangKu LMS. Mohon bantuannya.',
  },
];

export const CONTACT_FAQ: { q: string; a: string }[] = [
  {
    q: 'Berapa lama admin membalas pesan?',
    a: `Kami membalas pada ${ADMIN_CONTACT.hours.toLowerCase()}. ${ADMIN_CONTACT.responseNote}.`,
  },
  {
    q: 'Apakah bisa konsultasi sebelum membeli kursus?',
    a: 'Ya. Gunakan tombol WhatsApp di halaman ini atau di detail kursus untuk tanya level yang cocok.',
  },
  {
    q: 'Bagaimana cara konfirmasi pembayaran?',
    a: 'Kirim bukti transfer via WhatsApp dengan nama kursus yang dipilih. Admin akan verifikasi dan mengaktifkan akses.',
  },
];

export { ADMIN_CONTACT, buildWhatsAppUrl };

export const CONTACT_WA_DEFAULT_URL = buildWhatsAppUrl(CONTACT_DEFAULT_MESSAGE);

export function getTopicWhatsAppUrl(message: string): string {
  return buildWhatsAppUrl(message);
}
