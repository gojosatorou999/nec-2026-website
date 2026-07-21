// Grades the Idea Incubator bulb sequence from its as-shot bright-blue look
// into the site's ink palette. One transform has to serve the whole clip
// because the black logo and the lit bulb crossfade over frames 62-74.
//
//   dark pixels (the logo art, wherever it is)  -> light sky, so it reads on ink
//   warm pixels (filament, the logo's bulb)     -> amber glow, kept hot
//   everything else (the blue backdrop, glass)  -> deep navy, luminance-shaped
//
// The 80 graded frames it produces are committed under public/sequence, so
// this only needs re-running if the source clip or the grade changes. It needs
// sharp, which is not a project dependency — install it on demand:
//
//   npm i --no-save sharp
//   node scripts/grade-sequence.mjs ideaclublogoeffect/public/sequence public/sequence
//
// Add --preview=0,30,79 to render just those frames somewhere else while
// tuning the constants below.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const [, , SRC, OUT, ...rest] = process.argv;
const previewArg = rest.find((a) => a.startsWith('--preview'));
const previewFrames = previewArg
  ? previewArg.split('=')[1].split(',').map(Number)
  : null;

const FRAMES = 80;
const WIDTH = 1280;
const QUALITY = 74;

const hex = (h) => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

// site palette
const INK = hex('#05070d');
const NAVY = hex('#121d36'); // lifted navy with a peri cast, for the backdrop falloff
const COOL_HOT = hex('#dbeeff'); // glass glare — a cool reflection, not a light source
const AMBER_HOT = hex('#ffe9a8'); // the filament itself
const SKY = hex('#dff1ff'); // logo art reads as near-white sky

const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function gradePixel(r, g, b, out, o) {
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Composed as nested mixes rather than a weighted three-way split: with a
  // split, a pixel that is only half "glow" surrenders the other half to the
  // backdrop and comes out muddy. Each stage here paints over the last.

  // logo art — anything genuinely dark, whichever hue it sits under
  const d = 1 - smoothstep(0.1, 0.34, L);
  // any bright pixel is a light source. Keying glow on warmth alone missed the
  // filament entirely: its core is blown out to pure white, so r-b is 0.
  const hot = smoothstep(0.5, 0.92, L);
  // warmth only decides the *colour* of a highlight — amber filament vs the
  // cool blue-white glare coming off the glass.
  const warmth = smoothstep(-0.02, 0.12, r - b);
  // backdrop falloff
  const sink = smoothstep(0.05, 0.85, L);
  // clamp before the pow: a negative base with a fractional exponent is NaN,
  // and NaN coerces to 0 on the way into the Buffer — silently black.
  const logoI = Math.pow(Math.max(0, 1 - L / 0.34), 0.85);

  for (let c = 0; c < 3; c++) {
    const base = INK[c] + (NAVY[c] - INK[c]) * sink;
    const glow = COOL_HOT[c] + (AMBER_HOT[c] - COOL_HOT[c]) * warmth;
    const logo = INK[c] + (SKY[c] - INK[c]) * logoI;

    const lit = base + (glow - base) * hot;
    const v = lit + (logo - lit) * d;
    out[o + c] = Math.max(0, Math.min(255, Math.round(v * 255)));
  }
}

async function gradeFrame(i, srcDir, outDir) {
  const num = String(i).padStart(3, '0');
  const src = path.join(srcDir, `ideaclubanim(nowm)_${num}.jpg`);

  const { data, info } = await sharp(src)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.allocUnsafe(data.length);
  for (let p = 0; p < data.length; p += 3) {
    gradePixel(data[p] / 255, data[p + 1] / 255, data[p + 2] / 255, out, p);
  }

  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    .toFile(path.join(outDir, `bulb_${num}.jpg`));

  return num;
}

await mkdir(OUT, { recursive: true });
const list = previewFrames ?? Array.from({ length: FRAMES }, (_, i) => i);
for (const i of list) {
  const n = await gradeFrame(i, SRC, OUT);
  process.stdout.write(`${n} `);
}
console.log('\ndone');
