import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s — Admin JepangKu LMS',
    default: 'Admin — JepangKu LMS',
  },
  description: 'CMS admin JepangKu LMS — kursus, materi, kuis, dan validasi enrollment.',
};

/** Admin area shell — sidebar/nav CMS akan ditambahkan di Slice 0 admin CMS. */
export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-muted/30">{children}</div>;
}
