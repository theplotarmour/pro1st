#!/usr/bin/env python3
"""
Prepare event photographs for the Our Story gallery.

Drop phone photos into public/img/ and run:

    python3 scripts/optimize-events.py

Every loose JPEG/PNG in public/img/ is resized and written to
public/img/events/ as WebP. The gallery reads that directory at build time, so
adding a photograph is a file copy and a re-run — no code change.

Originals are left where they are and are kept out of git (see .gitignore).
They are 4160px phone captures at over a megabyte each; serving them would
mean shipping ~6MB of imagery to render a strip of thumbnails, and Next's
image optimiser would still have to re-encode every one on first request.

Output names are derived from the source filename rather than numbered, so
re-running is stable: existing photographs keep their URLs and a new upload
only adds a file. The filenames carry a capture timestamp, which is also what
gives the gallery a sensible default order.
"""

from __future__ import annotations

import pathlib
import re
import sys

from PIL import Image, ImageOps

SOURCE = pathlib.Path("public/img")
TARGET = SOURCE / "events"
# Wide enough for a full-bleed tile on a 2x display without carrying phone
# sensor resolution around.
MAX_WIDTH = 1800
QUALITY = 78
# Camera formats only. WebP is excluded deliberately: it is this script's own
# output format, and other WebP assets live in public/img/ (the hero poster,
# for one) which are not event photographs.
SUFFIXES = {".jpg", ".jpeg", ".png", ".heic"}


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def main() -> int:
    if not SOURCE.is_dir():
        print(f"{SOURCE} not found — run from the project root", file=sys.stderr)
        return 1

    TARGET.mkdir(parents=True, exist_ok=True)
    written = 0

    for path in sorted(SOURCE.iterdir()):
        if not path.is_file() or path.suffix.lower() not in SUFFIXES:
            continue

        out = TARGET / f"{slug(path.stem)}.webp"
        if out.exists() and out.stat().st_mtime >= path.stat().st_mtime:
            continue

        # exif_transpose honours the phone's rotation flag; without it
        # portrait captures land on their side.
        image = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        if image.width > MAX_WIDTH:
            height = round(image.height * MAX_WIDTH / image.width)
            image = image.resize((MAX_WIDTH, height), Image.LANCZOS)

        image.save(out, "WEBP", quality=QUALITY, method=6)
        written += 1
        print(f"{path.name}  ->  {out.name}  ({out.stat().st_size // 1024}kB)")

    print(f"{written} written, {len(list(TARGET.glob('*.webp')))} in {TARGET}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
