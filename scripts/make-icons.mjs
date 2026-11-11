// Renders the app icon to the PNG sizes iOS and the manifest need.
// Run with: npm run icons   (needs Playwright's Chromium available)
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const HEART =
  'M12.1 20.3c-.3 0-.6-.1-.8-.3-3.9-3.1-7.7-6.3-7.8-10.4C3.4 6.900 5.3 4.700 7.900 4.600c1.700 0 3.100.9 4.100 2.400.9-1.600 2.500-2.600 4.300-2.500 2.600.2 4.400 2.500 4.200 5.300-.3 4-3.900 7.100-7.600 10.200-.2.200-.5.300-.8.300Z';

/** A 3x3 board coloured like an eye: dark at the rim, light in the middle, a heart at the centre. */
function icon(size, pad) {
  const inner = size * (1 - pad * 2);
  const gap = inner * 0.055;
  const cell = (inner - gap * 2) / 3;
  const r = cell * 0.2;
  const tones = ['#245a82', '#4a8db8', '#245a82', '#4a8db8', '#e3eff5', '#4a8db8', '#245a82', '#4a8db8', '#245a82'];
  let cells = '';
  for (let i = 0; i < 9; i++) {
    const x = size * pad + (i % 3) * (cell + gap);
    const y = size * pad + Math.floor(i / 3) * (cell + gap);
    cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${r}" fill="${tones[i]}"/>`;
  }
  const hs = cell * 0.62;
  const hx = size / 2 - hs / 2;
  const hy = size / 2 - hs / 2 + cell * 0.015;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#12324a"/>
    ${cells}
    <g transform="translate(${hx} ${hy}) scale(${hs / 24})"><path d="${HEART}" fill="#d9788e"/></g>
  </svg>`;
}

const out = new URL('../public/icons/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const jobs = [
  ['icon-180.png', 180, 0.17],
  ['icon-192.png', 192, 0.17],
  ['icon-512.png', 512, 0.17],
  ['maskable-512.png', 512, 0.24],
];
for (const [name, size, pad] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>body{margin:0}svg{display:block}</style>${icon(size, pad)}`);
  await page.screenshot({ path: out + name, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  console.log('wrote', name);
}
await browser.close();
