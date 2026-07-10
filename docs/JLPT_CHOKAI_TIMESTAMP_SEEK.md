# Choukai timestamp seek — Phase 1 spike notes

**Date:** 2026-07-10  
**Implementation:** [`features/tryout/lib/chokai-audio.ts`](../features/tryout/lib/chokai-audio.ts) + [`ChokaiAudioPlayer`](../features/tryout/components/chokai-media.tsx)

## Approach

- Master MP3 stored on `ListeningStimulus` (`audioUrl` / R2).
- Playback seeks to `audioStartMs` / stops at `audioEndMs` via `HTMLAudioElement.currentTime` + `timeupdate`.
- One-shot lock key: `stimulus:{id}`.

## Mobile Safari / CBR guidance

| Risk | Mitigation |
|------|------------|
| VBR seek inaccuracy | Prefer **CBR MP3** in teacher guidelines / import docs |
| `currentTime` before metadata | Bind on `loadedmetadata`; re-seek on `play` |
| Large master download | Accept for Phase 1; Phase 2 may pre-slice derived clips without schema change |
| iOS autoplay | User gesture required (existing “Putar audio” button) |

## Manual QA checklist

1. Import stimulus with `mulai`/`selesai` mid-file → play starts at range, ends at `endMs`.
2. Navigate Q1→Q2 same stimulus → audio stays “sudah diputar”.
3. Navigate to next stimulus → new play allowed.
4. Safari iOS + Chrome Android: seek within ±0.5s of marked start (CBR file).

## Phase 2 (optional)

Background ffmpeg clip cache keyed by stimulus id; UI still addresses stimulus, not raw files.
