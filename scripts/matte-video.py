#!/usr/bin/env python3
"""
Cut a product out of a black-cyclorama clip and re-encode it with alpha.

Run this when the hero footage changes:

    python3 scripts/matte-video.py mixer.mp4 mixer-aj6

It writes public/video/<name>.webm (VP9 + alpha), public/video/<name>-alpha.mp4
(HEVC + alpha, for WebKit), public/video/<name>.mp4 (plain H.264 fallback) and
public/img/<name>-poster.webp. Requires ffmpeg, numpy, scipy and Pillow.

How the matte is built
----------------------
A luma/colour key is the obvious move on a black backdrop and it is wrong
here: the AJ6's faceplate, knobs and chassis are themselves black, so every
threshold that clears the backdrop also hollows out the mixer — the front
panel vanishes and each knob becomes a hole.

Connectivity fixes that but is not sufficient on its own. Two rules combine:

1. Connectivity, for the interior. The backdrop is one dark region touching
   the frame border; the product's own blacks are enclosed by its bright
   edges. Dark regions that never reach a border are forced fully opaque, so
   the faceplate stays solid however dark it is. This also survives the
   exploded frames, where the mixer becomes forty-odd separate parts and the
   real gaps between them do reach the border.

2. A luma ramp, for the transition. The footage is effectively premultiplied
   against black — the chassis front lip is a continuous gradient from grey
   into pure black, so there is no threshold that keeps it without also
   keeping the backdrop. Treating coverage as proportional to luma across a
   narrow band reproduces that falloff instead of cutting through it, which
   is what a binary matte was doing: it bit the whole front lip off the
   mixer.

The two are combined with max(), so enclosed blacks stay solid and open edges
fade. A median filter runs first because backdrop compression speckle reaches
~26/255 in places and would otherwise ramp up into visible noise.

Timing
------
The clip is retimed to double speed by replaying every frame at twice the
source rate — no frames are dropped. It is then written forward followed by
reverse, as one file: the first half explodes the mixer, the second half
rebuilds it. That is why the player can run the rebuild without ever seeking
backwards or asking for a negative playback rate, neither of which browsers
do well. The turnaround frame is duplicated so the midpoint lands exactly on
duration / 2, which is the only thing the player needs to know.
"""

from __future__ import annotations

import argparse
import pathlib
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage

# Dark regions at or below this are candidates for the backdrop. Only their
# connectivity matters, so it is set loosely.
DARK_THRESHOLD = 8
# Luma band over which coverage ramps from clear to solid. LO sits above the
# backdrop's own noise floor; HI is where the chassis reads as solid product.
RAMP_LO, RAMP_HI = 3.0, 30.0
# Backdrop speckle reaches ~26/255; a median of this size removes it without
# touching the front lip's coherent gradient.
DESPECKLE = 5
# Blur radius, in pixels, used to anti-alias the silhouette.
FEATHER = 0.6
SPEED = 2


def matte(rgb: np.ndarray) -> np.ndarray:
    """RGB uint8 HxWx3 -> alpha float HxW in 0..1."""
    # max, not mean: a saturated LED is bright in only one channel.
    luma = ndimage.median_filter(rgb.max(axis=2).astype(np.float32), size=DESPECKLE)

    labels, count = ndimage.label(luma <= DARK_THRESHOLD)
    if count == 0:
        interior = np.ones(luma.shape, dtype=np.float32)
    else:
        edge = np.concatenate(
            [labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]]
        )
        outside = np.unique(edge)
        interior = (~np.isin(labels, outside[outside != 0])).astype(np.float32)

    ramp = np.clip((luma - RAMP_LO) / (RAMP_HI - RAMP_LO), 0.0, 1.0)
    return ndimage.gaussian_filter(np.maximum(interior, ramp), FEATHER)


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=pathlib.Path)
    parser.add_argument("name")
    parser.add_argument("--width", type=int, default=1152)
    args = parser.parse_args()

    if shutil.which("ffmpeg") is None:
        print("ffmpeg not found on PATH", file=sys.stderr)
        return 1

    video = pathlib.Path("public/video")
    image = pathlib.Path("public/img")
    video.mkdir(parents=True, exist_ok=True)
    image.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        work = pathlib.Path(tmp)
        (work / "src").mkdir()
        (work / "rgba").mkdir()

        run("ffmpeg", "-y", "-v", "error", "-i", str(args.source),
            "-vf", f"scale={args.width}:-2:flags=lanczos",
            str(work / "src" / "%04d.png"))

        frames = sorted((work / "src").glob("*.png"))
        if not frames:
            print("no frames decoded from source", file=sys.stderr)
            return 1

        for index, frame in enumerate(frames, start=1):
            rgb = np.asarray(Image.open(frame).convert("RGB"))
            alpha = (matte(rgb) * 255).astype(np.uint8)
            Image.fromarray(np.dstack([rgb, alpha]), "RGBA").save(
                work / "rgba" / f"{index:04d}.png"
            )

        # Second half: the same frames backwards, so playing straight through
        # the file rebuilds the mixer. The turnaround frame is repeated so the
        # two halves are exactly equal and the midpoint is duration / 2.
        total = len(frames)
        for offset, index in enumerate(range(total, 0, -1), start=1):
            shutil.copyfile(
                work / "rgba" / f"{index:04d}.png",
                work / "rgba" / f"{total + offset:04d}.png",
            )

        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0",
             str(args.source)],
            check=True, capture_output=True, text=True,
        ).stdout.strip()
        num, _, den = probe.partition("/")
        rate = (float(num) / float(den or 1)) * SPEED

        seq = str(work / "rgba" / "%04d.png")
        common = ("ffmpeg", "-y", "-v", "error", "-framerate", f"{rate:g}",
                  "-i", seq)

        run(*common, "-vf", "format=yuva420p", "-c:v", "libvpx-vp9",
            "-crf", "48", "-b:v", "0", "-row-mt", "1", "-cpu-used", "2",
            "-deadline", "good", "-auto-alt-ref", "0",
            str(video / f"{args.name}.webm"))

        run(*common, "-vf", "format=bgra", "-c:v", "hevc_videotoolbox",
            "-alpha_quality", "0.6", "-b:v", "700k", "-tag:v", "hvc1",
            "-movflags", "+faststart", str(video / f"{args.name}-alpha.mp4"))

        run(*common, "-vf", "format=yuv420p", "-c:v", "libx264",
            "-profile:v", "high", "-crf", "30", "-preset", "slow",
            "-movflags", "+faststart", str(video / f"{args.name}.mp4"))

        Image.open(work / "rgba" / "0001.png").convert("RGBA").save(
            image / f"{args.name}-poster.webp", "WEBP", quality=82, method=6
        )

    print(f"wrote {args.name}.webm / -alpha.mp4 / .mp4 and the poster")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
