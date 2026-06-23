# UAT Checklist — JepangKu LMS (Fase 1 MVP)

> Berdasarkan **Webekspres §7C** (`docs/JepangKu x Webekspres.md`) — fokus alur LMS + integrasi Core.

**PIC UAT:** Tim JepangKu  
**Target:** Soft launch akhir Juni 2026

---

## Legenda

| Simbol | Arti |
| :---: | :--- |
| ⬜ | Belum diuji |
| ✅ | Lulus |
| ❌ | Gagal / blocker |

---

## End-to-end happy path (prioritas §7C)

1. Register/login → dashboard  
2. Enroll kursus N5  
3. Buka lesson → complete → flashcard → quiz  
4. Cek XP Mingguan, level (Core), poin (LMS), leaderboard  
5. Tryout (opsional)  
6. Kursus berbayar → transfer → admin approve  
7. Badge di Pencapaian  

**Verifikasi Core:** `bun run verify:core-gamification`

---

## Checklist ringkas

| Area | Item | Status |
| :--- | :--- | :---: |
| Auth | Register/login SSO | ⬜ |
| Kursus | Enroll gratis & berbayar | ⬜ |
| Belajar | Lesson + flashcard + quiz | ⬜ |
| Gamifikasi | XP Core + poin LMS + badge | ⬜ |
| Leaderboard | Podium + rank 4–10 mobile | ⬜ |
| Admin | Enrollment + badge CMS + R2 | ⬜ |
| Payment | Transfer manual | ⬜ |
