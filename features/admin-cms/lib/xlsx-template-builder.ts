import ExcelJS from 'exceljs';
import { XLSX_COLORS } from '@/features/admin-cms/lib/xlsx-workbook';

type ColDef = { header: string; key: string; width: number; required?: boolean };

function applyHeaderStyle(cell: ExcelJS.Cell, required: boolean) {
    cell.font = {
        bold: true,
        color: { argb: required ? XLSX_COLORS.requiredHeaderText : 'FF334155' },
    };
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: required ? XLSX_COLORS.requiredHeaderBg : XLSX_COLORS.optionalHeaderBg },
    };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
}

function addGuideSheet(workbook: ExcelJS.Workbook, lines: string[]) {
    const sheet = workbook.addWorksheet('0. Panduan', {
        properties: { tabColor: { argb: 'FFF59E0B' } },
    });
    sheet.mergeCells('A1:F1');
    const title = sheet.getCell('A1');
    title.value = 'Panduan Pengisian';
    title.font = { bold: true, size: 14, color: { argb: XLSX_COLORS.mainHeaderBg } };
    title.alignment = { vertical: 'middle' };

    lines.forEach((line, i) => {
        const row = sheet.getRow(i + 3);
        row.getCell(1).value = line;
        row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: XLSX_COLORS.guideBg },
        };
        row.getCell(1).alignment = { wrapText: true };
        sheet.mergeCells(`A${i + 3}:F${i + 3}`);
    });

    sheet.getColumn(1).width = 90;
}

function addDataSheet(
    workbook: ExcelJS.Workbook,
    tabName: string,
    tabColor: string,
    guideLine: string,
    columns: ColDef[],
    exampleRow: Record<string, string | number>,
) {
    const sheet = workbook.addWorksheet(tabName, {
        properties: { tabColor: { argb: tabColor } },
        views: [{ state: 'frozen', ySplit: 3 }],
    });

    sheet.mergeCells(1, 1, 1, columns.length);
    const guide = sheet.getCell(1, 1);
    guide.value = guideLine;
    guide.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };
    guide.font = { italic: true, color: { argb: 'FF92400E' } };
    guide.alignment = { wrapText: true };

    sheet.mergeCells(2, 1, 2, columns.length);
    const legend = sheet.getCell(2, 1);
    legend.value =
        'Kolom berwarna kuning = wajib diisi · Baris hijau di bawah = contoh (boleh dihapus)';
    legend.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.guideBg } };
    legend.font = { size: 10, color: { argb: 'FF78350F' } };

    const headerRow = sheet.getRow(3);
    columns.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = col.header;
        applyHeaderStyle(cell, Boolean(col.required));
        sheet.getColumn(idx + 1).width = col.width;
    });

    const example = sheet.getRow(4);
    columns.forEach((col, idx) => {
        const cell = example.getCell(idx + 1);
        cell.value = exampleRow[col.key] ?? '';
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XLSX_COLORS.exampleRowBg } };
    });
}

export async function buildCourseImportTemplateBuffer(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'JepangKu LMS';

    addGuideSheet(workbook, [
        '1) Isi tab berurutan dari Kursus → Modul → Pelajaran → Video → Flashcard → Kuis.',
        '2) Nomor (No Kursus, No Modul, No Pelajaran) dipakai untuk menghubungkan antar tab — bebas, asal konsisten.',
        '3) Baris hijau = contoh. Header kuning = wajib.',
        '4) Simpan sebagai .xlsx lalu unggah di halaman Import Kursus.',
    ]);

    addDataSheet(
        workbook,
        '1. Kursus',
        'FF0F766E',
        'Satu baris = satu kursus. Tingkat JLPT: N5, N4, N3, N2, atau N1.',
        [
            { header: 'No', key: 'no', width: 6, required: true },
            { header: 'Nama Kursus', key: 'nama', width: 28, required: true },
            { header: 'Tingkat JLPT', key: 'level', width: 14, required: true },
            { header: 'Deskripsi', key: 'deskripsi', width: 36 },
            { header: 'Tampilkan di Katalog (Ya/Tidak)', key: 'publik', width: 26 },
            { header: 'Kategori', key: 'kategori', width: 16 },
            { header: 'Harga (Rp)', key: 'harga', width: 12 },
        ],
        {
            no: 1,
            nama: 'Hiragana & Katakana',
            level: 'N5',
            deskripsi: 'Pengenalan aksara Jepang',
            publik: 'Tidak',
            kategori: 'Kosa Kata',
            harga: 0,
        },
    );

    addDataSheet(
        workbook,
        '2. Modul',
        'FF059669',
        'Hubungkan ke No Kursus di tab sebelumnya.',
        [
            { header: 'No Kursus', key: 'no_kursus', width: 10, required: true },
            { header: 'No Modul', key: 'no_modul', width: 10, required: true },
            { header: 'Nama Modul', key: 'nama', width: 28, required: true },
            { header: 'Urutan', key: 'urutan', width: 8, required: true },
            { header: 'Deskripsi', key: 'deskripsi', width: 36 },
        ],
        { no_kursus: 1, no_modul: 1, nama: 'Modul 1 — Aksara', urutan: 1, deskripsi: '' },
    );

    addDataSheet(
        workbook,
        '3. Pelajaran',
        'FF0284C7',
        'Setiap pelajaran butuh No Kursus + No Modul + No Pelajaran (unik).',
        [
            { header: 'No Kursus', key: 'no_kursus', width: 10, required: true },
            { header: 'No Modul', key: 'no_modul', width: 10, required: true },
            { header: 'No Pelajaran', key: 'no_pelajaran', width: 12, required: true },
            { header: 'Nama Pelajaran', key: 'nama', width: 28, required: true },
            { header: 'Urutan', key: 'urutan', width: 8, required: true },
            { header: 'Isi Materi', key: 'isi', width: 40 },
        ],
        {
            no_kursus: 1,
            no_modul: 1,
            no_pelajaran: 1,
            nama: 'Pelajaran Hiragana Dasar',
            urutan: 1,
            isi: 'Pengenalan huruf あ–の',
        },
    );

    addDataSheet(
        workbook,
        '4. Video',
        'FF6366F1',
        'Opsional. No Pelajaran harus sudah ada di tab Pelajaran.',
        [
            { header: 'No Pelajaran', key: 'no_pelajaran', width: 12, required: true },
            { header: 'Link Video', key: 'link', width: 48, required: true },
        ],
        { no_pelajaran: 1, link: 'https://www.youtube.com/watch?v=contoh' },
    );

    addDataSheet(
        workbook,
        '5. Flashcard',
        'FF8B5CF6',
        'Jenis Kartu: Kosakata, Kanji, atau Tata Bahasa. Isi kolom yang relevan.',
        [
            { header: 'No Pelajaran', key: 'no_pelajaran', width: 12, required: true },
            { header: 'Jenis Kartu', key: 'jenis', width: 14, required: true },
            { header: 'Kata / Kanji / Pola', key: 'utama', width: 18 },
            { header: 'Furigana', key: 'furigana', width: 14 },
            { header: 'Romaji', key: 'romaji', width: 12 },
            { header: 'Arti', key: 'arti', width: 20, required: true },
            { header: 'Contoh Kalimat', key: 'contoh', width: 28 },
            { header: 'Onyomi', key: 'onyomi', width: 12 },
            { header: 'Kunyomi', key: 'kunyomi', width: 12 },
        ],
        {
            no_pelajaran: 1,
            jenis: 'Kosakata',
            utama: 'あ',
            furigana: 'あ',
            romaji: 'a',
            arti: 'Huruf a',
            contoh: '',
            onyomi: '',
            kunyomi: '',
        },
    );

    addDataSheet(
        workbook,
        '6. Kuis',
        'FFEC4899',
        'Jawaban Benar: tulis A, B, C, atau D (atau teks pilihan yang persis).',
        [
            { header: 'No Pelajaran', key: 'no_pelajaran', width: 12, required: true },
            { header: 'Pertanyaan', key: 'pertanyaan', width: 36, required: true },
            { header: 'Penjelasan', key: 'penjelasan', width: 28 },
            { header: 'Poin XP', key: 'xp', width: 10 },
            { header: 'Pilihan A', key: 'a', width: 16, required: true },
            { header: 'Pilihan B', key: 'b', width: 16, required: true },
            { header: 'Pilihan C', key: 'c', width: 16 },
            { header: 'Pilihan D', key: 'd', width: 16 },
            { header: 'Jawaban Benar', key: 'jawaban', width: 14, required: true },
        ],
        {
            no_pelajaran: 1,
            pertanyaan: 'Huruf apa ini: あ?',
            penjelasan: 'あ dibaca "a"',
            xp: 10,
            a: 'i',
            b: 'a',
            c: 'u',
            d: 'e',
            jawaban: 'B',
        },
    );

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

export async function buildTryoutImportTemplateBuffer(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'JepangKu LMS';

    addGuideSheet(workbook, [
        '1) Isi tab Info Sesi (satu baris) lalu soal di tab Kosakata & Kanji dan Tata Bahasa & Membaca.',
        '2) Kode Sesi unik — dipakai jika mengunggah ulang file yang sama.',
        '3) Bagian mendengarkan (Chokai) tidak termasuk — kelola terpisah di admin.',
        '4) Unggah file ini di halaman Impor Tryout.',
    ]);

    addDataSheet(
        workbook,
        '1. Info Sesi',
        'FF0F766E',
        'Satu baris = satu sesi tryout. Tingkat JLPT berlaku untuk semua soal di file ini.',
        [
            { header: 'Judul Sesi', key: 'judul', width: 32, required: true },
            { header: 'Kode Sesi', key: 'kode', width: 20, required: true },
            { header: 'Nama Fase', key: 'fase', width: 18, required: true },
            { header: 'Tingkat JLPT', key: 'level', width: 14, required: true },
            { header: 'Deskripsi', key: 'deskripsi', width: 36 },
            { header: 'Jadwal (YYYY-MM-DD)', key: 'jadwal', width: 20 },
            { header: 'Durasi (menit)', key: 'durasi', width: 14 },
            { header: 'Urutan Tampil', key: 'urutan', width: 14 },
            { header: 'Aktif (Ya/Tidak)', key: 'aktif', width: 16 },
        ],
        {
            judul: 'Tryout N5 Fase 1',
            kode: 'n5-fase-1',
            fase: 'Fase 1',
            level: 'N5',
            deskripsi: 'Simulasi JLPT N5',
            jadwal: '2026-07-01',
            durasi: 120,
            urutan: 1,
            aktif: 'Ya',
        },
    );

    const soalCols: ColDef[] = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Pertanyaan', key: 'pertanyaan', width: 40, required: true },
        { header: 'Penjelasan', key: 'penjelasan', width: 28 },
        { header: 'Pilihan A', key: 'a', width: 16, required: true },
        { header: 'Pilihan B', key: 'b', width: 16, required: true },
        { header: 'Pilihan C', key: 'c', width: 16 },
        { header: 'Pilihan D', key: 'd', width: 16 },
        { header: 'Jawaban Benar', key: 'jawaban', width: 14, required: true },
    ];

    addDataSheet(
        workbook,
        '2. Kosakata & Kanji',
        'FF059669',
        'Soal bagian Kosakata & Kanji (MOJI GOI).',
        soalCols,
        {
            no: 1,
            pertanyaan: '（　）に なにを いれますか。',
            penjelasan: 'Pilih partikel yang tepat.',
            a: 'を',
            b: 'に',
            c: 'で',
            d: 'が',
            jawaban: 'B',
        },
    );

    addDataSheet(
        workbook,
        '3. Tata Bahasa & Membaca',
        'FF0284C7',
        'Soal bagian Tata Bahasa & Membaca (BUNPOU DOKKAI).',
        soalCols,
        {
            no: 1,
            pertanyaan: '文章の 意味として ただしい ものは どれですか。',
            penjelasan: '',
            a: 'Pilihan A',
            b: 'Pilihan B',
            c: 'Pilihan C',
            d: 'Pilihan D',
            jawaban: 'A',
        },
    );

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
