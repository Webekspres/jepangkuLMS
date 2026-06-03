import React from 'react';

interface KuisHasilProps {
  params: Promise<{
    lessonSlug: string;
  }>;
}

export default async function KuisHasilPage({ params }: KuisHasilProps) {
  const { lessonSlug } = await params;
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Hasil Evaluasi Kuis</h1>
      <p className="text-gray-600">Review skor dan pembahasan kuis untuk: <span className="font-semibold text-blue-600">{lessonSlug}</span></p>
    </div>
  );
}