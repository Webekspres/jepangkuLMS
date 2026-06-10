import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { loadStudentCoreData } from '@/features/student/lib/load-student-core-data';
import { EMPTY_STUDENT_CORE_DATA } from '@/features/student/types/student-core-data';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await loadStudentCoreData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(EMPTY_STUDENT_CORE_DATA);
  }
}
