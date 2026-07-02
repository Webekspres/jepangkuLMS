-- Add optional rich-learning fields for kanji materials.
ALTER TABLE "MaterialKanji"
ADD COLUMN "mnemonik" TEXT,
ADD COLUMN "strokeGifUrl" TEXT;
