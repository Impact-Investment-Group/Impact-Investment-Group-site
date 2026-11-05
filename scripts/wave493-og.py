"""Generate the homepage share card from the current supplied logo.

The proportional logo is centred at 960px wide on the existing 1200 by 630
white canvas. No text or artwork is added. Preserve the existing 300 KiB
output budget. Run without --check to regenerate the published PNG.
"""

import argparse
import io
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "images" / "brand" / "logo-lockup-20261105-v2.webp"
TARGET = ROOT / "public" / "images" / "brand" / "og-default-20261105-v2.png"

CANVAS = (1200, 630)
GROUND = (255, 255, 255)
LOCKUP_WIDTH = 960
MAX_BYTES = 300 * 1024


def render() -> bytes:
    with Image.open(SOURCE) as source:
        art = source.convert("RGBA")
    height = round(art.height * LOCKUP_WIDTH / art.width)
    art = art.resize((LOCKUP_WIDTH, height), Image.LANCZOS)
    card = Image.new("RGBA", CANVAS, GROUND + (255,))
    left = (CANVAS[0] - LOCKUP_WIDTH) // 2
    top = (CANVAS[1] - height) // 2
    card.alpha_composite(art, (left, top))
    out = io.BytesIO()
    card.convert("RGB").save(out, "PNG", optimize=True)
    print(f"lockup {LOCKUP_WIDTH} by {height} at ({left}, {top}) on a {CANVAS[0]} by {CANVAS[1]} card")
    return out.getvalue()


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    data = render()
    if len(data) > MAX_BYTES:
        print(f"{len(data)} bytes, over the {MAX_BYTES} WhatsApp reads. Not written.")
        return 1
    if args.check:
        same = TARGET.exists() and TARGET.read_bytes() == data
        print(f"{TARGET.relative_to(ROOT)} {'matches' if same else 'DOES NOT MATCH'} this script's output")
        return 0 if same else 1
    TARGET.write_bytes(data)
    print(f"wrote {TARGET.relative_to(ROOT)}, {len(data)} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
