import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = resolve(import.meta.dirname, '..');

async function render(svg, output, width, height) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  await writeFile(resolve(root, output), png);
}

const mark = await readFile(resolve(root, 'public/assets/blokpakt-bp-mark.svg'), 'utf8');
await render(mark, 'public/apple-touch-icon.png', 180, 180);

await render(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#f4f8f5"/>
    <path d="M0 490C190 410 330 565 545 475S920 415 1200 505V630H0Z" fill="#1f7a4c"/>
    <rect x="86" y="76" width="124" height="124" rx="28" fill="#1f7a4c"/>
    <text x="148" y="160" fill="#ffffff" font-family="Arial, sans-serif" font-size="76" font-weight="800" letter-spacing="-6" text-anchor="middle">Bp</text>
    <text x="238" y="152" fill="#1f7a4c" font-family="Arial, sans-serif" font-size="46" font-weight="800" letter-spacing="-2">Blokpakt</text>
    <text x="86" y="294" fill="#173a2f" font-family="Arial, sans-serif" font-size="76" font-weight="800">Save $6 vs. solo.</text>
    <text x="86" y="362" fill="#47655a" font-family="Arial, sans-serif" font-size="33">Book home services with your neighbors.</text>
    <rect x="86" y="410" width="300" height="65" rx="12" fill="#dceee1"/>
    <text x="236" y="452" fill="#1f7a4c" font-family="Arial, sans-serif" font-size="27" font-weight="800" text-anchor="middle">More homes. Lower prices.</text>
  </svg>
`, 'public/assets/og-image.png', 1200, 630);