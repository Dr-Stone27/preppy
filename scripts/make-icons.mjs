// Builds the app icons from assets/icon-bowl.svg (the Party Jollof bowl from the app's own engine).
// Run: node scripts/make-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";

const bowl = readFileSync(new URL("../assets/icon-bowl.svg", import.meta.url));
const CREAM = { r: 255, g: 240, b: 232, alpha: 1 }; // accent-soft, so the cream bowl stands off the background

async function icon(size, bowlShare, out) {
  const b = Math.round(size * bowlShare);
  const art = await sharp(bowl, { density: 300 }).resize(b, b).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: CREAM } })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toFile(out);
}

await icon(192, 0.86, "public/icons/icon-192.png");
await icon(512, 0.86, "public/icons/icon-512.png");
// Maskable icons are cropped to a circle or squircle, so keep the bowl inside the safe zone.
await icon(512, 0.66, "public/icons/maskable-512.png");
await icon(180, 0.82, "src/app/apple-icon.png");
await icon(64, 0.94, "src/app/icon.png");
console.log("icons written");
