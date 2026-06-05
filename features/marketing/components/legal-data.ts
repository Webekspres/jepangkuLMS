export type LegalSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  badge: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export const TERMS_DOCUMENT: LegalDocument = {
  slug: 'syarat-ketentuan',
  title: 'Syarat & Ketentuan',
  badge: '利用規約',
  lastUpdated: '1 Juni 2026',
  intro:
    'Dokumen ini mengatur penggunaan platform JepangKu LMS (kursus.jepangku.com). Dengan mendaftar atau menggunakan layanan, Anda dianggap telah membaca dan menyetujui syarat berikut.',
  sections: [
    {
      heading: '1. Definisi Layanan',
      paragraphs: [
        'JepangKu LMS adalah platform pembelajaran bahasa Jepang berbasis kurikulum JLPT yang menyediakan materi video, kuis, try out, dan fitur gamifikasi XP.',
        'Layanan ini merupakan bagian dari ekosistem JepangKu. Autentikasi akun dapat diintegrasikan dengan layanan Core JepangKu (SSO).',
      ],
    },
    {
      heading: '2. Pendaftaran & Akun',
      paragraphs: [
        'Pengguna wajib memberikan data yang benar saat mendaftar. Anda bertanggung jawab menjaga kerahasiaan kredensial akun.',
        'Satu akun hanya digunakan oleh satu individu. Dilarang membagikan akses login kepada pihak lain tanpa persetujuan admin.',
      ],
      list: [
        'Usia minimum pengguna: 13 tahun (dengan persetujuan wali jika di bawah 18 tahun).',
        'Admin berhak menangguhkan akun yang melanggar ketentuan.',
      ],
    },
    {
      heading: '3. Akses Kursus & Pembayaran',
      paragraphs: [
        'Beberapa kursus tersedia gratis; kursus berbayar memerlukan konfirmasi pembayaran melalui kanal resmi (misalnya WhatsApp admin) sebelum akses penuh diaktifkan.',
        'Harga, paket, dan ketersediaan modul dapat berubah seiring pengembangan produk. Perubahan akan diinformasikan melalui platform atau kanal resmi JepangKu.',
      ],
    },
    {
      heading: '4. Penggunaan yang Diperbolehkan',
      paragraphs: ['Anda setuju untuk tidak:'],
      list: [
        'Menyalin, mendistribusikan, atau menjual kembali materi tanpa izin.',
        'Menggunakan bot, scraper, atau cara otomatis untuk mengakses layanan.',
        'Mengganggu pengalaman belajar pengguna lain atau sistem platform.',
        'Mengunggah konten yang melanggar hukum atau hak pihak ketiga.',
      ],
    },
    {
      heading: '5. Hak Kekayaan Intelektual',
      paragraphs: [
        'Seluruh materi kursus, desain, logo, dan konten platform adalah milik JepangKu atau pemberi lisensi. Lisensi pengguna bersifat personal dan non-komersial untuk tujuan belajar.',
      ],
    },
    {
      heading: '6. Pembatasan Tanggung Jawab',
      paragraphs: [
        'JepangKu berupaya menjaga ketersediaan layanan, namun tidak menjamin platform bebas gangguan teknis. Hasil belajar dan kelulusan ujian JLPT bergantung pada usaha masing-masing pengguna.',
        'Platform disediakan "sebagaimana adanya" dalam lingkup MVP pengembangan berkelanjutan.',
      ],
    },
    {
      heading: '7. Perubahan & Kontak',
      paragraphs: [
        'Syarat & Ketentuan dapat diperbarui. Versi terbaru akan dipublikasikan di halaman ini.',
        'Pertanyaan terkait syarat layanan dapat diajukan melalui halaman Kontak atau WhatsApp admin resmi.',
      ],
    },
  ],
};

export const PRIVACY_DOCUMENT: LegalDocument = {
  slug: 'kebijakan-privasi',
  title: 'Kebijakan Privasi',
  badge: 'プライバシー',
  lastUpdated: '1 Juni 2026',
  intro:
    'JepangKu LMS menghormati privasi pengguna. Kebijakan ini menjelaskan data apa yang kami kumpulkan, bagaimana data digunakan, dan hak Anda sebagai pengguna.',
  sections: [
    {
      heading: '1. Data yang Kami Kumpulkan',
      paragraphs: ['Kami dapat memproses data berikut saat Anda menggunakan layanan:'],
      list: [
        'Data identitas: nama, alamat email, dan informasi profil dasar.',
        'Data autentikasi: dikelola melalui penyedia auth (misalnya Clerk / Core SSO) sesuai integrasi aktif.',
        'Data belajar: progres lesson, skor kuis, XP, badge, dan riwayat try out.',
        'Data teknis: log akses, perangkat, dan informasi diagnostik untuk keamanan sistem.',
      ],
    },
    {
      heading: '2. Tujuan Penggunaan Data',
      paragraphs: ['Data digunakan untuk:'],
      list: [
        'Menyediakan dan mempersonalisasi pengalaman belajar.',
        'Mengelola akses kursus dan validasi pembayaran.',
        'Menampilkan progres, leaderboard, dan fitur gamifikasi.',
        'Meningkatkan keamanan, mencegah penyalahgunaan, dan dukungan pengguna.',
        'Mengirim informasi penting terkait akun atau layanan (bukan spam promosi tanpa persetujuan).',
      ],
    },
    {
      heading: '3. Penyimpanan & Keamanan',
      paragraphs: [
        'Data disimpan pada infrastruktur yang kami anggap aman, dengan kontrol akses terbatas pada personel yang berwenang.',
        'Kami menerapkan praktik keamanan wajar, namun tidak ada sistem yang 100% bebas risiko. Segera laporkan jika Anda mencurigai akses tidak sah ke akun Anda.',
      ],
    },
    {
      heading: '4. Berbagi Data dengan Pihak Ketiga',
      paragraphs: [
        'Kami tidak menjual data pribadi pengguna. Data dapat dibagikan hanya kepada:',
      ],
      list: [
        'Penyedia layanan teknis (hosting, autentikasi, analitik operasional) yang terikat kewajiban kerahasiaan.',
        'Otoritas hukum jika diwajibkan oleh peraturan yang berlaku.',
      ],
    },
    {
      heading: '5. Cookie & Teknologi Serupa',
      paragraphs: [
        'Platform dapat menggunakan cookie atau penyimpanan lokal untuk sesi login, preferensi UI, dan keamanan. Anda dapat mengatur browser untuk menolak cookie, namun beberapa fitur mungkin tidak berfungsi optimal.',
      ],
    },
    {
      heading: '6. Hak Pengguna',
      paragraphs: ['Anda berhak untuk:'],
      list: [
        'Mengakses dan memperbarui data profil melalui pengaturan akun (saat fitur tersedia).',
        'Meminta koreksi data yang tidak akurat melalui kontak admin.',
        'Meminta penghapusan akun sesuai ketentuan hukum dan kebutuhan operasional platform.',
      ],
    },
    {
      heading: '7. Perubahan Kebijakan',
      paragraphs: [
        'Kebijakan Privasi dapat diperbarui seiring perkembangan produk dan regulasi. Tanggal pembaruan terakhir tercantum di bagian atas halaman ini.',
        'Untuk pertanyaan privasi, hubungi kami melalui halaman Kontak.',
      ],
    },
  ],
};
