import React from 'react';

interface CourseDetailPageProps {
  params: Promise<{
    courseSlug: string;
  }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseSlug } = await params;
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Detail Kursus</h1>
      <p className="text-gray-600">Mempelajari detail untuk kursus: <span className="font-semibold text-blue-600">{courseSlug}</span></p>
    </div>
  );
}