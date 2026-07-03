# Metrik JepangKu LMS

Dokumen ini mendefinisikan metrik-metrik utama yang digunakan dalam JepangKu LMS untuk mengukur progres belajar siswa dan penggunaan platform.

## 1. Kursus Aktif (Active Course)

### Definisi
**Kursus Aktif** adalah kursus yang sedang diikuti oleh seorang siswa dengan status enrollment yang aktif (`ACTIVE`). Ini mengecualikan kelas live (Live Class) dan simulasi ujian (Tryout) serta pendaftaran yang masih menunggu persetujuan/verifikasi (`PENDING`).

### Logika Query Prisma
Untuk menghitung atau mengambil daftar Kursus Aktif bagi pengguna tertentu:

```typescript
const activeEnrollments = await prisma.enrollment.findMany({
  where: {
    userId: userId,
    status: 'ACTIVE',
    type: 'COURSE',
  },
  include: {
    course: true,
  },
});
```

Untuk menghitung total Kursus Aktif secara global di seluruh platform:

```typescript
const globalActiveEnrollmentsCount = await prisma.enrollment.count({
  where: {
    status: 'ACTIVE',
    type: 'COURSE',
  },
});
```

---

## 2. Progres Belajar (Learning Progress)

### Definisi
**Progres Belajar** adalah persentase penyelesaian materi dalam suatu kursus oleh siswa. Dihitung berdasarkan jumlah pelajaran (`Lesson`) yang telah ditandai selesai (`isCompleted`) dibagi dengan total pelajaran dalam kursus tersebut.

### Logika Query Prisma
```typescript
const totalLessons = await prisma.lesson.count({
  where: {
    module: {
      courseId: courseId,
    },
  },
});

const completedLessons = await prisma.userProgress.count({
  where: {
    userId: userId,
    isCompleted: true,
    lesson: {
      module: {
        courseId: courseId,
      },
    },
  },
});

const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
```
