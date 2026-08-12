"use client";

/**
 * Spatial colour sampling: what colour is the image, and *where*.
 *
 * A single average colour throws away the thing that makes an ambient wash
 * look like it belongs to the photograph — that the blue is on the left
 * because the blue is on the left. This samples a grid instead and keeps each
 * cell's position, so the surround can be rebuilt as a soft map of the image.
 *
 * The grid comes from `drawImage` downscaling to N×N. The browser's own
 * resampler does the averaging, so an N×N sample costs one draw call and N²
 * pixel reads regardless of the source resolution.
 *
 * The source goes through `/_next/image`, which is same-origin, so the canvas
 * is never tainted and `getImageData` is legal. Reading straight from
 * cdn.shopify.com would throw a SecurityError.
 *
 * Nothing here is per-product or per-palette: every colour and every position
 * is measured off whatever image it is handed.
 */

export interface PaletteCell {
  /** Cell centre, 0–1 across the image. */
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  /** Distance from grey, 0–255. Drives how strongly the cell shows. */
  chroma: number;
}

const cache = new Map<string, Promise<PaletteCell[] | null>>();

/** Same transform `next/image` applies, so we hit its cache, not Shopify's. */
function optimized(src: string, width = 128): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

export function imagePalette(
  src: string,
  grid = 3,
): Promise<PaletteCell[] | null> {
  const key = `${src}@${grid}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const promise = new Promise<PaletteCell[] | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = grid;
        canvas.height = grid;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);

        ctx.drawImage(image, 0, 0, grid, grid);
        const { data } = ctx.getImageData(0, 0, grid, grid);

        const cells: PaletteCell[] = [];
        for (let y = 0; y < grid; y++) {
          for (let x = 0; x < grid; x++) {
            const i = (y * grid + x) * 4;
            const r = data[i]!;
            const g = data[i + 1]!;
            const b = data[i + 2]!;
            const mean = (r + g + b) / 3;
            cells.push({
              x: (x + 0.5) / grid,
              y: (y + 0.5) / grid,
              r,
              g,
              b,
              chroma: Math.max(
                Math.abs(r - mean),
                Math.abs(g - mean),
                Math.abs(b - mean),
              ),
            });
          }
        }
        resolve(cells);
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = optimized(src);
  });

  cache.set(key, promise);
  return promise;
}

interface WashOptions {
  /** How far the map spreads across the layer, as a percentage of its box. */
  spread?: number;
  /** Radius of each blob, as a percentage of the layer. */
  radius?: number;
  /** Alpha of the most saturated cell. */
  strength?: number;
  /** Floor on the normalising divisor, so a flat image is not amplified. */
  chromaFloor?: number;
  /** Weight the least saturated cell still gets. */
  minWeight?: number;
}

/**
 * Build a CSS `background-image` that lays each sampled cell back down in the
 * position it was measured.
 *
 * Two decisions worth stating:
 *
 *   - Alpha scales with the cell's chroma RELATIVE TO THIS IMAGE'S OWN
 *     maximum. Weighing against a fixed threshold looks correct until it
 *     meets a real catalogue: measured across these product shots, per-cell
 *     chroma runs from 1 to 20, so a fixed cut either erased two thirds of
 *     the products or turned the studio sweep into a grey haze. Normalising
 *     per image means the most colourful part of whatever is on screen always
 *     reads, and the flatter areas of the same photo still fall away.
 *
 *   - `chromaFloor` stops that normalisation amplifying nothing. A genuinely
 *     greyscale photo has no ratio worth taking, so dividing by the floor
 *     rather than its own tiny maximum keeps it faint instead of inventing
 *     colour that is not there.
 *
 *   - Saturation is pushed away from that cell's own mean. A muted photo
 *     still has direction to its colour; multiplying the distance from grey
 *     keeps that direction and makes it legible at this alpha.
 */
export function paletteWash(
  cells: PaletteCell[],
  {
    spread = 86,
    radius = 46,
    strength = 0.24,
    chromaFloor = 20,
    minWeight = 0.22,
  }: WashOptions = {},
): string {
  const peak = Math.max(chromaFloor, ...cells.map((cell) => cell.chroma));

  return cells
    // Strongest last: CSS paints the first layer on top, so the most
    // saturated cells need to be at the front of the list.
    .slice()
    .sort((a, b) => b.chroma - a.chroma)
    .map((cell) => {
      const weight = Math.max(minWeight, Math.min(1, cell.chroma / peak));
      const alpha = (strength * weight).toFixed(3);

      const mean = (cell.r + cell.g + cell.b) / 3;
      const push = (channel: number) =>
        Math.max(
          0,
          Math.min(255, Math.round(mean + (channel - mean) * 2.2)),
        );

      // Map the cell's position in the image onto the layer, expanded around
      // the centre so the colour sits around the card rather than under it.
      const px = (50 + (cell.x - 0.5) * spread).toFixed(1);
      const py = (50 + (cell.y - 0.5) * spread).toFixed(1);

      return (
        `radial-gradient(circle at ${px}% ${py}%, ` +
        `rgba(${push(cell.r)}, ${push(cell.g)}, ${push(cell.b)}, ${alpha}) 0%, ` +
        `rgba(${push(cell.r)}, ${push(cell.g)}, ${push(cell.b)}, 0) ${radius}%)`
      );
    })
    .join(", ");
}
