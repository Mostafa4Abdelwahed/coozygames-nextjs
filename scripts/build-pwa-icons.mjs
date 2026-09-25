// Generates the PWA icon set from the master brand artwork.
//
// The source (assets/coozygames-icon.svg) is an SVG wrapper around an embedded
// base64 PNG, so the real pixels are pulled straight out of it and rasterised
// with sharp. Rerun after swapping the artwork:
//
//   node scripts/build-pwa-icons.mjs
//
// Output:
//   public/icons/icon-192.png          installable icon, keeps transparency
//   public/icons/icon-512.png          installable icon, keeps transparency
//   public/icons/icon-maskable-192.png maskable (Android adaptive), night bg
//   public/icons/icon-maskable-512.png maskable (Android adaptive), night bg
//   app/apple-icon.png                 iOS home-screen icon, 180x180
//   app/favicon.ico                    16/32/48/256, transparency kept
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "assets", "coozygames-icon.svg");
const iconsDir = path.join(root, "public", "icons");

// The artwork is a rounded square whose fill is a near-constant purple; sampled
// from the source edges so the maskable bleed below is seamless. (Distinct from
// --color-brand-100 in globals.css, which is the lighter UI accent.)
const BRAND_PURPLE = "#3a30fa";

/** Pulls the embedded PNG bytes out of the SVG wrapper. */
async function readSourcePng() {
  const svg = await readFile(source, "utf8");
  const match = svg.match(/base64,([A-Za-z0-9+/=\s]+)/);
  if (!match) throw new Error(`No base64 payload found in ${source}`);
  return Buffer.from(match[1].replace(/\s/g, ""), "base64");
}

const png = await readSourcePng();
const meta = await sharp(png).metadata();
console.log(
  `[pwa-icons] source ${meta.width}x${meta.height} ${meta.format} alpha=${meta.hasAlpha}`,
);

if (meta.width !== meta.height) {
  throw new Error(
    `Source artwork must be square, got ${meta.width}x${meta.height}`,
  );
}

await mkdir(iconsDir, { recursive: true });

// Android crops a maskable icon to an arbitrary shape (circle, squircle, ...)
// and may shrink it, so the art sits inside the centre 80% safe zone and the
// surrounding square is flooded with the artwork's own purple to stay seamless.
const MASKABLE_SCALE = 0.8;

const plain = (size, dest) =>
  sharp(png)
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toFile(dest)
    .then(() => console.log(`[pwa-icons] ${path.relative(root, dest)} ${size}x${size}`));

const maskable = async (size, dest) => {
  const inner = await sharp(png)
    .resize(Math.round(size * MASKABLE_SCALE), Math.round(size * MASKABLE_SCALE), {
      fit: "contain",
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND_PURPLE,
    },
  })
    .composite([{ input: inner, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(dest);

  console.log(
    `[pwa-icons] ${path.relative(root, dest)} ${size}x${size} (maskable, ${BRAND_PURPLE})`,
  );
};

// iOS composites transparency onto black and applies its own rounded mask, so
// this one ships opaque; on the artwork's purple the logo's rounded square
// simply becomes the full tile.
const apple = path.join(root, "app", "apple-icon.png");
await sharp(png)
  .resize(180, 180, { fit: "contain" })
  .flatten({ background: BRAND_PURPLE })
  .png({ compressionLevel: 9 })
  .toFile(apple);
console.log(`[pwa-icons] ${path.relative(root, apple)} 180x180 (opaque)`);

await plain(192, path.join(iconsDir, "icon-192.png"));
await plain(512, path.join(iconsDir, "icon-512.png"));
await maskable(192, path.join(iconsDir, "icon-maskable-192.png"));
await maskable(512, path.join(iconsDir, "icon-maskable-512.png"));

// Next's favicon file convention: this path is what gets served at /favicon.ico.
// A second copy in public/ would collide with it, so there is deliberately none.
const ICO_SIZES = [16, 32, 48, 256];
const icoFrames = await Promise.all(
  ICO_SIZES.map((s) =>
    sharp(png)
      .resize(s, s, { fit: "contain" })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ),
);

const icoHeader = Buffer.alloc(6 + ICO_SIZES.length * 16);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(ICO_SIZES.length, 4);

let offset = icoHeader.length;
ICO_SIZES.forEach((s, i) => {
  const e = 6 + i * 16;
  icoHeader.writeUInt8(s >= 256 ? 0 : s, e);
  icoHeader.writeUInt8(s >= 256 ? 0 : s, e + 1);
  icoHeader.writeUInt8(0, e + 2);
  icoHeader.writeUInt8(0, e + 3);
  icoHeader.writeUInt16LE(1, e + 4);
  icoHeader.writeUInt16LE(32, e + 6);
  icoHeader.writeUInt32LE(icoFrames[i].length, e + 8);
  icoHeader.writeUInt32LE(offset, e + 12);
  offset += icoFrames[i].length;
});

const favicon = path.join(root, "app", "favicon.ico");
await writeFile(favicon, Buffer.concat([icoHeader, ...icoFrames]));
console.log(
  `[pwa-icons] ${path.relative(root, favicon)} ${ICO_SIZES.join("/")} (transparency kept)`,
);
