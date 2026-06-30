import * as XLSX from 'xlsx';
import type { PrismaClient } from '@prisma/client';
import { levelJlptSchema } from '@/lib/validations/shared';
import { dedupeSlugInSet, slugBaseFromTitle } from '@/lib/lms/slug';
import {
    importCourseSyllabusTree,
    type CourseSyllabusTree,
} from '@/prisma/lib/import-syllabus-tree';
import {
    type CourseImportPreview,
    type CourseImportResult,
    type CourseImportRowError,
    MAX_IMPORT_BYTES,
    MAX_IMPORT_ROWS,
} from '@/features/admin-cms/lib/course-import-types';
import {
    formatTabError,
    parsePositiveInt,
    parseYesNo,
    pickField,
    readXlsxBuffer,
    sheetToRecords,
} from '@/features/admin-cms/lib/xlsx-workbook';

const TAB = {
    kursus: 'Kursus',
    modul: 'Modul',
    pelajaran: 'Pelajaran',
    video: 'Video',
    flashcard: 'Flashcard',
    kuis: 'Kuis',
} as const;

type LessonBucket = {
    noKursus: number;
    noModul: number;
    noPelajaran: number;
    title: string;
    order: number;
    content: string | null;
    videoUrl: string | null;
    slug: string;
    kosakatas: CourseSyllabusTree['course']['modules'][0]['lessons'][0]['kosakatas'];
    kanjis: CourseSyllabusTree['course']['modules'][0]['lessons'][0]['kanjis'];
    tataBahasas: CourseSyllabusTree['course']['modules'][0]['lessons'][0]['tataBahasas'];
    questions: CourseSyllabusTree['course']['modules'][0]['lessons'][0]['questions'];
};

type CourseMeta = {
    no: number;
    title: string;
    level: string;
    description?: string;
    isPublished: boolean;
    category: string;
    priceIdr: number;
    slug: string;
};

type ModuleMeta = {
    noKursus: number;
    noModul: number;
    title: string;
    order: number;
    description?: string;
    slug: string;
};

function emptyPreview(): Omit<CourseImportPreview, 'ok'> {
    return {
        rowCount: 0,
        courseCount: 0,
        moduleCount: 0,
        lessonCount: 0,
        kosakataCount: 0,
        kanjiCount: 0,
        tataBahasaCount: 0,
        questionCount: 0,
        courses: [],
        errors: [],
        warnings: [],
    };
}

function pushError(errors: CourseImportRowError[], sheet: string, row: number, message: string) {
    errors.push({ sheet, row, message: formatTabError(sheet, row, message) });
}

function parseJlpt(raw: string): string | null {
    const parsed = levelJlptSchema.safeParse(raw.trim().toUpperCase());
    return parsed.success ? parsed.data : null;
}

function parseFlashcardType(raw: string): 'kosakata' | 'kanji' | 'tatabahasa' | null {
    const v = raw.trim().toLowerCase();
    if (v.includes('kosakata') || v === 'kosa') return 'kosakata';
    if (v.includes('kanji')) return 'kanji';
    if (v.includes('tata') || v.includes('bahasa') || v.includes('bunpou')) return 'tatabahasa';
    return null;
}

function parseQuizOptions(record: Record<string, string>): string[] {
    const fromLetters = ['pilihan_a', 'pilihan_b', 'pilihan_c', 'pilihan_d'].map((k) =>
        pickField(record, [k]),
    );
    if (fromLetters.some(Boolean)) return fromLetters.filter(Boolean);

    const joined = pickField(record, ['pilihan', 'opsi', 'options']);
    if (!joined) return [];
    return joined
        .split(/\n|\\n/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function resolveQuizAnswer(
    raw: string,
    options: string[],
): { index: number } | { error: string } {
    const trimmed = raw.trim();
    if (!trimmed) return { error: 'Jawaban Benar wajib diisi.' };

    const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
    const letter = letterMap[trimmed.toLowerCase()];
    if (letter != null && letter < options.length) return { index: letter };

    const asNumber = Number(trimmed);
    if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= options.length) {
        return { index: asNumber - 1 };
    }

    const idx = options.findIndex((o) => o.toLowerCase() === trimmed.toLowerCase());
    if (idx >= 0) return { index: idx };

    return { error: `Jawaban Benar "${raw}" tidak cocok dengan pilihan yang ada.` };
}

function buildTreesFromWorkbook(
    workbook: ReturnType<typeof readXlsxBuffer>,
): { trees: CourseSyllabusTree[]; publishedBySlug: Record<string, boolean>; courseMetaBySlug: Record<string, CourseMeta> } | { errors: CourseImportRowError[] } {
    const errors: CourseImportRowError[] = [];

    const kursusSheet = sheetToRecords(workbook, ['kursus', '1. kursus'], ['no', 'nama_kursus']);
    if ('error' in kursusSheet) {
        return { errors: [{ row: 0, message: kursusSheet.error }] };
    }

    const modulSheet = sheetToRecords(workbook, ['modul', '2. modul'], ['no_kursus', 'no_modul', 'nama_modul']);
    if ('error' in modulSheet) {
        return { errors: [{ row: 0, message: modulSheet.error }] };
    }

    const pelajaranSheet = sheetToRecords(workbook, ['pelajaran', '3. pelajaran', 'pembelajaran'], [
        'no_kursus',
        'no_modul',
        'no_pelajaran',
        'nama_pelajaran',
    ]);
    if ('error' in pelajaranSheet) {
        return { errors: [{ row: 0, message: pelajaranSheet.error }] };
    }

    const videoSheet = sheetToRecords(workbook, ['video', '4. video'], ['no_pelajaran', 'link_video']);
    const flashcardSheet = sheetToRecords(workbook, ['flashcard', '5. flashcard'], [
        'no_pelajaran',
        'jenis_kartu',
    ]);
    const kuisSheet = sheetToRecords(workbook, ['kuis', 'quiz', '6. kuis'], ['no_pelajaran', 'pertanyaan']);

    const courses = new Map<number, CourseMeta>();
    const modules = new Map<string, ModuleMeta>();
    const lessons = new Map<number, LessonBucket>();

    const courseSlugUsed = new Set<string>();
    const moduleSlugUsed = new Set<string>();
    const lessonSlugUsed = new Set<string>();

    kursusSheet.records.forEach((record, index) => {
        const row = kursusSheet.headerRow + index + 1;
        const no = parsePositiveInt(pickField(record, ['no', 'nomor']));
        const title = pickField(record, ['nama_kursus', 'judul', 'kursus', 'nama']);
        const levelRaw = pickField(record, ['tingkat_jlpt', 'level', 'tingkat']);
        const level = parseJlpt(levelRaw);

        if (no == null) {
            pushError(errors, TAB.kursus, row, 'Nomor kursus wajib diisi (angka).');
            return;
        }
        if (!title) {
            pushError(errors, TAB.kursus, row, 'Nama Kursus wajib diisi.');
            return;
        }
        if (!level) {
            pushError(errors, TAB.kursus, row, `Tingkat JLPT "${levelRaw || '(kosong)'}" tidak valid (N5–N1).`);
            return;
        }

        const slug = dedupeSlugInSet(slugBaseFromTitle(title, 'kursus', no), courseSlugUsed);
        courses.set(no, {
            no,
            title,
            level,
            description: pickField(record, ['deskripsi']) || undefined,
            isPublished: parseYesNo(pickField(record, ['tampilkan_di_katalog_ya_tidak', 'publik'])),
            category: pickField(record, ['kategori']) || 'Kosa Kata',
            priceIdr: parsePositiveInt(pickField(record, ['harga_rp', 'harga']), 0) ?? 0,
            slug,
        });
    });

    modulSheet.records.forEach((record, index) => {
        const row = modulSheet.headerRow + index + 1;
        const noKursus = parsePositiveInt(pickField(record, ['no_kursus']));
        const noModul = parsePositiveInt(pickField(record, ['no_modul']));
        const title = pickField(record, ['nama_modul', 'judul', 'nama', 'isi']);
        const order = parsePositiveInt(pickField(record, ['urutan']));

        if (noKursus == null || noModul == null) {
            pushError(errors, TAB.modul, row, 'No Kursus dan No Modul wajib diisi.');
            return;
        }
        if (!courses.has(noKursus)) {
            pushError(errors, TAB.modul, row, `No Kursus ${noKursus} tidak ada di tab Kursus.`);
            return;
        }
        if (!title) {
            pushError(errors, TAB.modul, row, 'Nama Modul wajib diisi.');
            return;
        }
        if (order == null) {
            pushError(errors, TAB.modul, row, 'Urutan wajib diisi (angka).');
            return;
        }

        const key = `${noKursus}-${noModul}`;
        if (modules.has(key)) {
            pushError(errors, TAB.modul, row, `No Modul ${noModul} duplikat untuk kursus ${noKursus}.`);
            return;
        }

        const slug = dedupeSlugInSet(
            `${courses.get(noKursus)!.slug}-${slugBaseFromTitle(title, 'modul', order)}`,
            moduleSlugUsed,
        );

        modules.set(key, {
            noKursus,
            noModul,
            title,
            order,
            description: pickField(record, ['deskripsi']) || undefined,
            slug,
        });
    });

    pelajaranSheet.records.forEach((record, index) => {
        const row = pelajaranSheet.headerRow + index + 1;
        const noKursus = parsePositiveInt(pickField(record, ['no_kursus']));
        const noModul = parsePositiveInt(pickField(record, ['no_modul']));
        const noPelajaran = parsePositiveInt(pickField(record, ['no_pelajaran']));
        const title = pickField(record, ['nama_pelajaran', 'judul', 'nama', 'isi']);
        const order = parsePositiveInt(pickField(record, ['urutan']));

        if (noKursus == null || noModul == null || noPelajaran == null) {
            pushError(errors, TAB.pelajaran, row, 'No Kursus, No Modul, dan No Pelajaran wajib diisi.');
            return;
        }
        if (!modules.has(`${noKursus}-${noModul}`)) {
            pushError(errors, TAB.pelajaran, row, `Modul ${noModul} pada kursus ${noKursus} tidak ditemukan.`);
            return;
        }
        if (!title) {
            pushError(errors, TAB.pelajaran, row, 'Nama Pelajaran wajib diisi.');
            return;
        }
        if (order == null) {
            pushError(errors, TAB.pelajaran, row, 'Urutan wajib diisi.');
            return;
        }
        if (lessons.has(noPelajaran)) {
            pushError(errors, TAB.pelajaran, row, `No Pelajaran ${noPelajaran} sudah dipakai.`);
            return;
        }

        lessons.set(noPelajaran, {
            noKursus,
            noModul,
            noPelajaran,
            title,
            order,
            content: pickField(record, ['isi_materi', 'konten']) || null,
            videoUrl: null,
            slug: dedupeSlugInSet(slugBaseFromTitle(title, 'pelajaran', order), lessonSlugUsed),
            kosakatas: [],
            kanjis: [],
            tataBahasas: [],
            questions: [],
        });
    });

    if (!('error' in videoSheet)) {
        videoSheet.records.forEach((record, index) => {
            const row = videoSheet.headerRow + index + 1;
            const noPelajaran = parsePositiveInt(pickField(record, ['no_pelajaran']));
            const url = pickField(record, ['link_video', 'video']);
            if (noPelajaran == null) {
                pushError(errors, TAB.video, row, 'No Pelajaran wajib diisi.');
                return;
            }
            const lesson = lessons.get(noPelajaran);
            if (!lesson) {
                pushError(errors, TAB.video, row, `No Pelajaran ${noPelajaran} tidak ditemukan di tab Pelajaran.`);
                return;
            }
            if (url && !/^https?:\/\//i.test(url)) {
                pushError(errors, TAB.video, row, 'Link Video harus diawali http:// atau https://');
                return;
            }
            if (url) lesson.videoUrl = url;
        });
    }

    if (!('error' in flashcardSheet)) {
        flashcardSheet.records.forEach((record, index) => {
            const row = flashcardSheet.headerRow + index + 1;
            const noPelajaran = parsePositiveInt(pickField(record, ['no_pelajaran']));
            const jenis = parseFlashcardType(pickField(record, ['jenis_kartu', 'tipe']));
            if (noPelajaran == null) {
                pushError(errors, TAB.flashcard, row, 'No Pelajaran wajib diisi.');
                return;
            }
            const lesson = lessons.get(noPelajaran);
            if (!lesson) {
                pushError(errors, TAB.flashcard, row, `No Pelajaran ${noPelajaran} tidak ditemukan.`);
                return;
            }
            if (!jenis) {
                pushError(errors, TAB.flashcard, row, 'Jenis Kartu wajib: Kosakata, Kanji, atau Tata Bahasa.');
                return;
            }

            if (jenis === 'kosakata') {
                const kosakata = pickField(record, ['kata', 'kosakata', 'kata_kanji_pola', 'utama']);
                const arti = pickField(record, ['arti']);
                if (!kosakata || !arti) {
                    pushError(errors, TAB.flashcard, row, 'Kata dan Arti wajib diisi untuk kartu Kosakata.');
                    return;
                }
                lesson.kosakatas.push({
                    kosakata,
                    arti,
                    furigana: pickField(record, ['furigana']) || undefined,
                    romaji: pickField(record, ['romaji']) || undefined,
                    contohKalimat: pickField(record, ['contoh_kalimat', 'contoh']) || undefined,
                });
            } else if (jenis === 'kanji') {
                const huruf = pickField(record, ['kanji', 'huruf', 'kata_kanji_pola', 'utama']);
                const arti = pickField(record, ['arti']);
                if (!huruf || !arti) {
                    pushError(errors, TAB.flashcard, row, 'Kanji dan Arti wajib diisi.');
                    return;
                }
                lesson.kanjis.push({
                    huruf,
                    arti,
                    furigana: pickField(record, ['furigana']) || undefined,
                    romaji: pickField(record, ['romaji']) || undefined,
                    onyomi: pickField(record, ['onyomi']) || undefined,
                    kunyomi: pickField(record, ['kunyomi']) || undefined,
                });
            } else {
                const tataBahasa = pickField(record, ['pola_bahasa', 'tata_bahasa', 'kata_kanji_pola', 'utama']);
                const arti = pickField(record, ['arti']);
                if (!tataBahasa || !arti) {
                    pushError(errors, TAB.flashcard, row, 'Pola Bahasa dan Arti wajib diisi.');
                    return;
                }
                lesson.tataBahasas.push({
                    tataBahasa,
                    arti,
                    contohKalimat: pickField(record, ['contoh_kalimat', 'contoh']) || undefined,
                });
            }
        });
    }

    if (!('error' in kuisSheet)) {
        kuisSheet.records.forEach((record, index) => {
            const row = kuisSheet.headerRow + index + 1;
            const noPelajaran = parsePositiveInt(pickField(record, ['no_pelajaran']));
            const questionText = pickField(record, ['pertanyaan', 'soal']);
            if (noPelajaran == null) {
                pushError(errors, TAB.kuis, row, 'No Pelajaran wajib diisi.');
                return;
            }
            const lesson = lessons.get(noPelajaran);
            if (!lesson) {
                pushError(errors, TAB.kuis, row, `No Pelajaran ${noPelajaran} tidak ditemukan.`);
                return;
            }
            if (!questionText) {
                pushError(errors, TAB.kuis, row, 'Pertanyaan wajib diisi.');
                return;
            }

            const options = parseQuizOptions(record);
            if (options.length < 2) {
                pushError(errors, TAB.kuis, row, 'Isi minimal Pilihan A dan B.');
                return;
            }

            const resolved = resolveQuizAnswer(pickField(record, ['jawaban_benar', 'jawaban']), options);
            if ('error' in resolved) {
                pushError(errors, TAB.kuis, row, resolved.error);
                return;
            }

            const xp = parsePositiveInt(pickField(record, ['poin_xp', 'xp']), 10) ?? 10;
            lesson.questions.push({
                questionText,
                explanation: pickField(record, ['penjelasan']) || undefined,
                xpReward: xp,
                options: options.map((text, idx) => ({
                    text,
                    isCorrect: idx === resolved.index,
                })),
            });
        });
    }

    if (errors.length > 0) return { errors };
    if (courses.size === 0) {
        return { errors: [{ row: 0, message: 'Tidak ada data kursus di file.' }] };
    }
    if (lessons.size === 0) {
        return { errors: [{ row: 0, message: 'Tambahkan minimal satu pelajaran di tab Pelajaran.' }] };
    }

    const trees: CourseSyllabusTree[] = [];
    const publishedBySlug: Record<string, boolean> = {};

    for (const course of courses.values()) {
        const courseModules = [...modules.values()]
            .filter((m) => m.noKursus === course.no)
            .sort((a, b) => a.order - b.order);

        if (courseModules.length === 0) {
            errors.push({
                row: 0,
                message: formatTabError(TAB.kursus, 0, `Kursus "${course.title}" belum punya modul.`),
            });
            continue;
        }

        const treeModules = courseModules.map((mod) => {
            const modLessons = [...lessons.values()]
                .filter((l) => l.noKursus === course.no && l.noModul === mod.noModul)
                .sort((a, b) => a.order - b.order)
                .map((lesson) => ({
                    title: lesson.title,
                    slug: lesson.slug,
                    order: lesson.order,
                    content: lesson.content,
                    videoUrl: lesson.videoUrl,
                    kosakatas: lesson.kosakatas,
                    kanjis: lesson.kanjis,
                    tataBahasas: lesson.tataBahasas,
                    questions: lesson.questions,
                }));

            return {
                title: mod.title,
                slug: mod.slug,
                order: mod.order,
                description: mod.description,
                lessons: modLessons,
            };
        });

        if (treeModules.some((m) => m.lessons.length === 0)) {
            errors.push({
                row: 0,
                message: formatTabError(TAB.modul, 0, `Kursus "${course.title}" punya modul tanpa pelajaran.`),
            });
            continue;
        }

        publishedBySlug[course.slug] = course.isPublished;
        trees.push({
            course: {
                title: course.title,
                slug: course.slug,
                description: course.description,
                level: course.level as CourseSyllabusTree['course']['level'],
                modules: treeModules,
            },
        });
    }

    if (errors.length > 0) return { errors };
    if (trees.length === 0) {
        return { errors: [{ row: 0, message: 'Tidak ada kursus lengkap yang bisa diimpor.' }] };
    }

    return { trees, publishedBySlug, courseMetaBySlug: Object.fromEntries([...courses.values()].map((c) => [c.slug, c])) };
}

function countPreview(trees: CourseSyllabusTree[], rowCount: number): CourseImportPreview {
    let kosakataCount = 0;
    let kanjiCount = 0;
    let tataBahasaCount = 0;
    let questionCount = 0;
    let moduleCount = 0;
    let lessonCount = 0;

    const courses = trees.map((tree) => {
        moduleCount += tree.course.modules.length;
        for (const mod of tree.course.modules) {
            lessonCount += mod.lessons.length;
            for (const lesson of mod.lessons) {
                kosakataCount += lesson.kosakatas.length;
                kanjiCount += lesson.kanjis.length;
                tataBahasaCount += lesson.tataBahasas.length;
                questionCount += lesson.questions.length;
            }
        }
        return {
            slug: tree.course.slug,
            title: tree.course.title,
            level: tree.course.level,
            isPublished: false,
            moduleCount: tree.course.modules.length,
            lessonCount: tree.course.modules.reduce((s, m) => s + m.lessons.length, 0),
        };
    });

    return {
        ok: true,
        rowCount,
        courseCount: trees.length,
        moduleCount,
        lessonCount,
        kosakataCount,
        kanjiCount,
        tataBahasaCount,
        questionCount,
        courses,
        errors: [],
        warnings: [],
    };
}

export function previewCourseXlsxImport(buffer: Buffer): CourseImportPreview {
    if (buffer.byteLength > MAX_IMPORT_BYTES) {
        return { ok: false, ...emptyPreview(), errors: [{ row: 0, message: 'File terlalu besar (maks. 5 MB).' }] };
    }

    let workbook: ReturnType<typeof readXlsxBuffer>;
    try {
        workbook = readXlsxBuffer(buffer);
    } catch {
        return {
            ok: false,
            ...emptyPreview(),
            errors: [{ row: 0, message: 'File Excel tidak bisa dibaca. Pastikan format .xlsx.' }],
        };
    }

    const built = buildTreesFromWorkbook(workbook);
    if ('errors' in built) {
        return { ok: false, ...emptyPreview(), errors: built.errors };
    }

    const rowCount = workbook.SheetNames.reduce((sum, name) => {
        const sheet = workbook.Sheets[name];
        if (!sheet) return sum;
        return sum + (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]).length;
    }, 0);

    if (rowCount > MAX_IMPORT_ROWS) {
        return {
            ok: false,
            ...emptyPreview(),
            errors: [{ row: 0, message: `Terlalu banyak baris (maks. ${MAX_IMPORT_ROWS}).` }],
        };
    }

    return countPreview(built.trees, rowCount);
}

export async function importCoursesFromXlsxBuffer(
    prisma: PrismaClient,
    buffer: Buffer,
): Promise<CourseImportResult> {
    const preview = previewCourseXlsxImport(buffer);
    if (!preview.ok) {
        return { ok: false, preview, imported: [], errors: preview.errors };
    }

    const workbook = readXlsxBuffer(buffer);
    const built = buildTreesFromWorkbook(workbook);
    if ('errors' in built) {
        return {
            ok: false,
            preview: { ...preview, ok: false, errors: built.errors },
            imported: [],
            errors: built.errors,
        };
    }

    const imported = [];
    for (const tree of built.trees) {
        const result = await importCourseSyllabusTree(prisma, tree, {
            isPublished: built.publishedBySlug[tree.course.slug] ?? false,
        });
        const meta = built.courseMetaBySlug[tree.course.slug];
        if (meta) {
            await prisma.course.update({
                where: { id: result.courseId },
                data: { category: meta.category, priceIdr: meta.priceIdr },
            });
        }
        imported.push(result);
    }

    return { ok: true, preview, imported };
}
