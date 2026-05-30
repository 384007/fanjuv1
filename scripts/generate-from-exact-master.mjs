#!/usr/bin/env node
/**
 * Generate ALL icon assets from the user's exact master logo image.
 * This must look pixel-identical to fanju-logo-master.png
 */
import sharp from '/Users/mac/Downloads/fanjuv1/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js';
import path from 'path';

const PUBLIC = path.join(process.cwd(), 'public');
const MASTER_TRANSPARENT = path.join(PUBLIC, 'fanju-logo-exact-transparent.png');
const MASTER_BLACK = path.join(PUBLIC, 'fanju-logo-exact-black.png');

const SIZES = [16, 32, 48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 384, 512];

async function generate() {
  console.log('Generating assets from EXACT user master (一模一样)...');

  // 1. OG Image 1200x630 — SKIPPED
  //    Current OG is manually maintained (20260530-b1):
  //    - Pure exact master 3D logo (fanju-logo-master.png), large + centered
  //    - Same #0A0A0A deep background as apple-icon (一模一样)
  //    - ZERO text → no 乱码 risk ever
  //    Do not regenerate OG from this script.

  // 2. Transparent web icons (for most sizes)
  for (const size of SIZES) {
    const outName = size <= 128 ? `icon-${size}x${size}.png` : `icon-${size}.png`;
    const targetSize = size === 16 || size === 32 ? Math.floor(size * 0.9) : Math.floor(size * 0.82);

    const resized = await sharp(MASTER_TRANSPARENT)
      .resize(targetSize, targetSize, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const meta = await sharp(resized).metadata();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
      .composite([{ input: resized, left: Math.floor((size - meta.width) / 2), top: Math.floor((size - meta.height) / 2) }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC, outName === `icon-${size}.png` ? `icon-${size}.png` : outName));

    if (size === 180) {
      await sharp(path.join(PUBLIC, 'icon-180x180.png')).toFile(path.join(PUBLIC, 'apple-icon.png'));
    }
    if (size === 192) {
      await sharp(path.join(PUBLIC, 'icon-192x192.png')).toFile(path.join(PUBLIC, 'icon-192.png'));
    }
    if (size === 512) {
      await sharp(path.join(PUBLIC, 'icon-512.png')).toFile(path.join(PUBLIC, 'icon-512.png'));
    }
  }
  console.log('✓ Transparent web icons (16~512)');

  // 3. Black background PWA icons (exact look on black)
  const pwaSizes = [192, 512];
  for (const size of pwaSizes) {
    const target = Math.floor(size * 0.82);
    const resized = await sharp(MASTER_BLACK)
      .resize(target, target, { fit: 'inside' })
      .toBuffer();
    const meta = await sharp(resized).metadata();

    await sharp({
      create: { width: size, height: size, channels: 3, background: '#000000' }
    })
      .composite([{ input: resized, left: Math.floor((size - meta.width) / 2), top: Math.floor((size - meta.height) / 2) }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC, `pwa-icon-${size}.png`));
  }
  console.log('✓ PWA black icons (192, 512)');

  // 4. Maskable icons (more padding for safe area)
  for (const size of [192, 512]) {
    const target = Math.floor(size * 0.65); // more padding for maskable
    const resized = await sharp(MASTER_TRANSPARENT)
      .resize(target, target, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    const meta = await sharp(resized).metadata();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
      .composite([{ input: resized, left: Math.floor((size - meta.width) / 2), top: Math.floor((size - meta.height) / 2) }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC, `maskable-icon-${size}.png`));
  }
  console.log('✓ Maskable icons');

  // 5. Microsoft tile
  const mstileSize = 270;
  const targetM = Math.floor(mstileSize * 0.72);
  const resizedM = await sharp(MASTER_TRANSPARENT)
    .resize(targetM, targetM, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const metaM = await sharp(resizedM).metadata();
  await sharp({
    create: { width: mstileSize, height: mstileSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: resizedM, left: Math.floor((mstileSize - metaM.width) / 2), top: Math.floor((mstileSize - metaM.height) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, 'mstile-270x270.png'));
  console.log('✓ mstile-270x270.png');

  // 6. Small favicons
  await sharp(MASTER_TRANSPARENT).resize(16, 16, { fit: 'inside' }).png().toFile(path.join(PUBLIC, 'favicon-16x16.png'));
  await sharp(MASTER_TRANSPARENT).resize(32, 32, { fit: 'inside' }).png().toFile(path.join(PUBLIC, 'favicon-32x32.png'));
  await sharp(MASTER_TRANSPARENT).resize(32, 32, { fit: 'inside' }).png().toFile(path.join(PUBLIC, 'favicon.png'));
  console.log('✓ favicon small sizes');

  // 7. Dark/light 32px
  await sharp(MASTER_TRANSPARENT).resize(32, 32, { fit: 'inside' }).png().toFile(path.join(PUBLIC, 'icon-dark-32x32.png'));
  await sharp(MASTER_TRANSPARENT).resize(32, 32, { fit: 'inside' }).png().toFile(path.join(PUBLIC, 'icon-light-32x32.png'));

  // 8. logo.png (large)
  await sharp(MASTER_TRANSPARENT).resize(512, 512, { fit: 'inside' }).png().toFile(path.join(PUBLIC, 'logo.png'));

  console.log('\n✅ All assets generated from EXACT master (一模一样).');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
