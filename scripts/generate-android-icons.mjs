import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const OUT = join(ROOT, "resources", "launcher", "res");

const SIZES = {
  "mipmap-mdpi": { launcher: 48, foreground: 108 },
  "mipmap-hdpi": { launcher: 72, foreground: 162 },
  "mipmap-xhdpi": { launcher: 96, foreground: 216 },
  "mipmap-xxhdpi": { launcher: 144, foreground: 324 },
  "mipmap-xxxhdpi": { launcher: 192, foreground: 432 },
};

function markSvg(size, { background, pad = 0.22 } = {}) {
  const inner = size * (1 - pad * 2);
  const scale = inner / 44;
  const x = (size - 40 * scale) / 2;
  const y = (size - 44 * scale) / 2;
  const stroke = 8.4 * scale;
  const bg = background
    ? `<rect width="${size}" height="${size}" fill="#121410"/>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <g fill="none" stroke="#b7c9bf" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${x} ${y}) scale(${scale})">
    <path d="M10 21 H31 A6.5 6.5 0 0 0 37.5 14.5 V8.2 A6.5 6.5 0 0 0 31 1.7 H10.2 A6.5 6.5 0 0 0 3.7 8.2 V14"/>
    <path d="M30 23 H9 A6.5 6.5 0 0 0 2.5 29.5 V35.8 A6.5 6.5 0 0 0 9 42.3 H29.8 A6.5 6.5 0 0 0 36.3 35.8 V30"/>
  </g>
</svg>`;
}

async function raster(page, size, svg, transparent) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`,
    { waitUntil: "load" },
  );
  return page.screenshot({
    type: "png",
    omitBackground: transparent,
    clip: { x: 0, y: 0, width: size, height: size },
  });
}

function write(rel, data) {
  const path = join(OUT, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}

const ADAPTIVE = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

const BG_COLOR = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#121410</color>
</resources>
`;

const browser = await chromium.launch();
const page = await browser.newPage();

for (const [folder, { launcher, foreground }] of Object.entries(SIZES)) {
  const full = await raster(
    page,
    launcher,
    markSvg(launcher, { background: true, pad: 0.18 }),
    false,
  );
  const fg = await raster(
    page,
    foreground,
    markSvg(foreground, { background: false, pad: 0.24 }),
    true,
  );
  write(`${folder}/ic_launcher.png`, full);
  write(`${folder}/ic_launcher_round.png`, full);
  write(`${folder}/ic_launcher_foreground.png`, fg);
}

write("mipmap-anydpi-v26/ic_launcher.xml", ADAPTIVE);
write("mipmap-anydpi-v26/ic_launcher_round.xml", ADAPTIVE);
write("values/ic_launcher_background.xml", BG_COLOR);

await browser.close();
console.log("Wrote Android launcher icons to resources/launcher/res");
