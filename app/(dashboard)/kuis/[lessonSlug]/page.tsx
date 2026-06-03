import React from 'react';

interface KuisWorkspaceProps {
  params: Promise<{
    lessonSlug: string;
  }>;
}

export default async function KuisWorkspacePage({ params }: KuisWorkspaceProps) {
  const { lessonSlug } = await params;
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Workspace Kuis (Focus Mode)</h1>
      <p className="text-gray-600">Mengerjakan kuis untuk lesson: <span className="font-semibold text-blue-600">{lessonSlug}</span></p>
    </div>
  );
}