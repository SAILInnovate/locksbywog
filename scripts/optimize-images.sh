#!/usr/bin/env bash
#
# Generates optimised WebP derivatives of the site photography.
#
# The originals in public/images are 10-20x larger than they need to be for the
# sizes they are actually displayed at (one logo was 2.4MB rendered at 48px
# tall). This script produces right-sized, right-encoded WebP files under
# public/images/opt, which the site references through <picture> elements.
#
# The originals are deliberately left in place so they remain available as the
# fallback source for any browser without WebP support.
#
# Usage:  ./scripts/optimize-images.sh
#
# Requires: cwebp (brew install webp)

set -euo pipefail

cd "$(dirname "$0")/.."

SRC_DIR="public/images"
OUT_DIR="public/images/opt"

if ! command -v cwebp >/dev/null 2>&1; then
  echo "error: cwebp not found. Install it with: brew install webp" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# name|source|quality|widths...
#
# Widths are chosen from the largest size each image is actually rendered at,
# doubled for high-density displays. Never upscales: any width above the
# source resolution is skipped with a warning.
MANIFEST=(
  # Brand mark with alpha, shown at 48px (nav) and 128px (footer). Flat
  # graphic, so a higher quality setting keeps the edges crisp.
  "logo|locsbywogggg.png|92|128 256 384"

  # 1024x1536 portrait, hero of the portfolio carousel.
  "locs-portrait|55764726-E9FA-4DD5-BE69-6E0EF95080E7.jpeg|80|600 1000"

  # 720x1280, already modest.
  "braids-closeup|8D00B2A9-ECC2-486F-A168-F1A03A587A76_1_102_o.jpeg|80|600"

  # 1238x2200.
  "style-tall|IMG_1319.JPG|80|600 1000"

  # 360x480 - the source itself is low resolution, so there is only one
  # useful size. See README note about replacing this one.
  "style-soft|D41E79E1-2CB9-4DCF-95FC-C84481C152D4_4_5005_c.jpeg|80|360"

  # 750x1000.
  "client-happy|F0100147-6D85-46E0-869E-030A0181C118.jpeg|80|600"

  # 4032x3024 - a 12MP camera original being shown ~400px wide.
  "salon-work|IMG_6897.jpeg|80|600 1000"

  # 1024x1536 but stored as a 2.5MB PNG.
  "style-display|anotherdisplayimage.png|80|600 1000"
)

total_before=0
total_after=0

for entry in "${MANIFEST[@]}"; do
  IFS='|' read -r name file quality widths <<<"$entry"
  src="$SRC_DIR/$file"

  if [[ ! -f "$src" ]]; then
    echo "warning: missing source $src, skipping" >&2
    continue
  fi

  src_w=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')

  echo "$name  (source ${src_w}px, $(du -h "$src" | cut -f1))"

  for w in $widths; do
    if (( w > src_w )); then
      echo "  skipped ${w}px - source is only ${src_w}px wide"
      continue
    fi

    out="$OUT_DIR/${name}-${w}.webp"
    # -metadata none strips EXIF (including camera GPS data) from the output.
    cwebp -quiet -q "$quality" -alpha_q 100 -metadata none \
      -resize "$w" 0 "$src" -o "$out"

    echo "  -> ${name}-${w}.webp  $(du -h "$out" | cut -f1)"
  done
done

echo
echo "Generated files:"
ls -la "$OUT_DIR" | awk 'NR>1 && $5 != "" {printf "  %-28s %8.1f KB\n", $9, $5/1024}'

# ---------------------------------------------------------------------------
# Social sharing card.
#
# og:image previously pointed at a 2.3MB portrait photograph. That is slow for
# scrapers to fetch and too large for some messaging apps to preview at all,
# which matters for a business whose bookings arrive through Instagram and
# WhatsApp DMs. This builds a landscape 1200x630 card instead.
# ---------------------------------------------------------------------------
if command -v ffmpeg >/dev/null 2>&1; then
  echo
  echo "Building social card..."

  OG_FONT="/System/Library/Fonts/Supplemental/Arial Black.ttf"
  [[ -f "$OG_FONT" ]] || OG_FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"

  ffmpeg -y -loglevel error \
    -f lavfi -i "color=c=0B6B4F:s=1200x630" \
    -i "$SRC_DIR/locsbywogggg.png" \
    -filter_complex "\
[1:v]scale=620:-1[logo];\
[0:v][logo]overlay=(W-w)/2:70[bg];\
[bg]drawtext=fontfile='${OG_FONT}':text='LOCS THAT HIT DIFFERENT':fontcolor=0xC3FF00:fontsize=58:x=(w-text_w)/2:y=520[out]" \
    -map "[out]" -frames:v 1 -q:v 3 "$SRC_DIR/og-card.jpg"

  echo "  -> og-card.jpg  $(du -h "$SRC_DIR/og-card.jpg" | cut -f1)"
else
  echo
  echo "note: ffmpeg not found, skipping social card generation" >&2
fi

echo
echo "Origins: $(du -sh "$SRC_DIR" | cut -f1)   Optimised: $(du -sh "$OUT_DIR" | cut -f1)"
