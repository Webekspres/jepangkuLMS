export type SenseiLevel = 'N4' | 'N5';

export type SenseiImportManifest = {
    level: SenseiLevel;
    course: {
        slug: string;
        title: string;
        description: string;
        level: SenseiLevel;
    };
    sheets: {
        kanji: string;
        kosakata: string;
        tataBahasa: string;
        quiz1: string;
        quiz2: string;
        placement?: string;
        tryout: string;
    };
    columns: {
        kanji: {
            no: string;
            category: string;
            huruf: string;
            furigana: string;
            romaji: string;
            arti: string;
            contohKunyomi: string;
            romajiKunyomi: string;
            artiKunyomi: string;
            contohOnyomi: string;
            romajiOnyomi: string;
            artiOnyomi: string;
            mnemonik?: string;
            strokeGif?: string;
        };
        kosakata: {
            no: string;
            category: string;
            kosakata: string;
            furigana: string;
            romaji: string;
            arti: string;
            contohKalimat: string;
        };
        tataBahasa: {
            no: string;
            category: string;
            tataBahasa: string;
            arti: string;
            contohKalimat: string;
        };
        quiz: {
            no: string;
            pertanyaan: string;
            pilihanJawaban: string;
            jawabanBenar: string;
            penjelasan: string;
        };
    };
};
