import React from 'react';

interface BelajarPageProps {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
}

export default async function BelajarPage({ params }: BelajarPageProps) {
  const { courseSlug, lessonSlug } = await params;
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Course Workspace</h1>
      <div className="bg-gray-50 p-4 rounded-md border">
        <p className="font-semibold text-gray-700">Course: <span className="text-blue-600">{courseSlug}</span></p>
        <p className="font-semibold text-gray-700">Lesson: <span className="text-blue-600">{lessonSlug}</span></p>
      </div>
    </div>
  );
}