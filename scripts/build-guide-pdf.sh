#!/usr/bin/env bash
# Gabungkan panduan .md → satu file → PDF untuk distribusi non-developer.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GUIDE_DIR="$ROOT/docs/handover/guide"
OUT_MD="$GUIDE_DIR/JepangKu-LMS-Panduan-Lengkap.md"
OUT_PDF="$GUIDE_DIR/JepangKu-LMS-Panduan-Lengkap.pdf"
CSS="$GUIDE_DIR/guide-pdf.css"

PARTS=(
  README.md
  01-login-dan-akses.md
  02-panduan-siswa.md
  03-panduan-admin-ringkas.md
  04-mengelola-kursus-dan-pelajaran.md
  05-impor-konten.md
  06-program-dan-enrollment.md
  07-faq-troubleshooting.md
)

{
  cat <<'COVER'
---
pdf_options:
  format: A4
  printBackground: true
  margin:
    top: 18mm
    right: 16mm
    bottom: 22mm
    left: 16mm
stylesheet:
  - guide-pdf.css
---

# Panduan Lengkap JepangKu LMS

<div class="cover-meta">

**Platform belajar bahasa Jepang (JLPT N5–N1)**  
kursus.jepangku.com

Serah terima · September 2026

*Buku panduan operasional untuk siswa, sensei/admin, dan staf.*

</div>

<div class="page-break"></div>

COVER

  for part in "${PARTS[@]}"; do
    echo ""
    echo "---"
    echo ""
    # Skip duplicate title block from README except its body after first heading
    if [[ "$part" == "README.md" ]]; then
      tail -n +3 "$GUIDE_DIR/README.md" | sed '1,/^---$/d'
    else
      cat "$GUIDE_DIR/$part"
    fi
    echo ""
    echo '<div class="page-break"></div>'
  done
} > "$OUT_MD"

cd "$GUIDE_DIR"
bunx --yes md-to-pdf "$OUT_MD" --stylesheet "$CSS"

if [[ -f "$OUT_PDF" ]]; then
  echo "OK: $OUT_PDF ($(du -h "$OUT_PDF" | cut -f1))"
else
  echo "ERROR: PDF not created" >&2
  exit 1
fi
