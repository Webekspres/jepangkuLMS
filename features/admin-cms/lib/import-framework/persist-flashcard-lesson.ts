import type { CategoryType, Prisma, PrismaClient } from '@prisma/client';
import type {
  NormalizedFlashcardLessonContent,
  NormalizedLesson,
} from '@/features/admin-cms/lib/import-framework/normalized-import-types';

type Tx = Prisma.TransactionClient | PrismaClient;

async function upsertCategory(tx: Tx, name: string, type: CategoryType) {
  const category = await tx.category.upsert({
    where: { name_type: { name, type } },
    create: { name, type },
    update: {},
  });

  return category.id;
}

export async function persistFlashcardLesson(
  tx: Tx,
  lessonId: string,
  lesson: NormalizedLesson & { content: NormalizedFlashcardLessonContent },
) {
  await tx.lesson.update({
    where: { id: lessonId },
    data: {
      content: null,
      videoUrl: null,
    },
  });

  for (const [index, kanji] of lesson.content.kanjis.entries()) {
    const categoryId = kanji.categoryName
      ? await upsertCategory(tx, kanji.categoryName, 'KANJI')
      : null;
    await tx.materialKanji.create({
      data: {
        lessonId,
        categoryId,
        huruf: kanji.huruf,
        furigana: kanji.furigana ?? null,
        romaji: kanji.romaji ?? null,
        arti: kanji.arti,
        onyomi: kanji.onyomi ?? null,
        contohOnyomi: kanji.contohOnyomi ?? null,
        artiOnyomi: kanji.artiOnyomi ?? null,
        kunyomi: kanji.kunyomi ?? null,
        contohKunyomi: kanji.contohKunyomi ?? null,
        artiKunyomi: kanji.artiKunyomi ?? null,
        mnemonik: kanji.mnemonik ?? null,
        strokeGifUrl: kanji.strokeGifUrl ?? null,
        sortOrder: index + 1,
      },
    });
  }

  for (const [index, kosakata] of lesson.content.kosakatas.entries()) {
    const categoryId = kosakata.categoryName
      ? await upsertCategory(tx, kosakata.categoryName, 'KOSAKATA')
      : null;
    await tx.materialKosakata.create({
      data: {
        lessonId,
        categoryId,
        kosakata: kosakata.kosakata,
        furigana: kosakata.furigana ?? null,
        romaji: kosakata.romaji ?? null,
        arti: kosakata.arti,
        contohKalimat: kosakata.contohKalimat ?? null,
        sortOrder: index + 1,
      },
    });
  }

  for (const [index, tataBahasa] of lesson.content.tataBahasas.entries()) {
    const categoryId = tataBahasa.categoryName
      ? await upsertCategory(tx, tataBahasa.categoryName, 'TATA_BAHASA')
      : null;
    await tx.materialTataBahasa.create({
      data: {
        lessonId,
        categoryId,
        tataBahasa: tataBahasa.tataBahasa,
        arti: tataBahasa.arti,
        contohKalimat: tataBahasa.contohKalimat ?? null,
        sortOrder: index + 1,
      },
    });
  }
}
