import sharp from "sharp"
import pngToIco from "png-to-ico"
import { mkdir, writeFile } from "node:fs/promises"

const SRC = "public/fanju-logo-source.png"
const PUB = "public"

// Background is near-black (~21,20,26, max channel <=27). Logo (purple/red/gold)
// has much higher channel values. We derive alpha from the max channel so the
// dark background becomes transparent with smooth anti-aliased edges.
const BG_LOW = 34 // <= this => fully transparent
const BG_HIGH = 64 // >= this => fully opaque

async function makeTransparent() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const out = Buffer.from(data)
  for (let i = 0; i < width * height; i++) {
    const o = i * channels
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const lum = Math.max(r, g, b)
    let a
    if (lum <= BG_LOW) a = 0
    else if (lum >= BG_HIGH) a = 255
    else a = Math.round(((lum - BG_LOW) / (BG_HIGH - BG_LOW)) * 255)
    out[o + 3] = a
  }
  return sharp(out, { raw: { width, height, channels } }).png()
}

async function run() {
  await mkdir(PUB, { recursive: true })

  // 1) Transparent master (full 1024 logo with text) -> website logo
  const transparent = await makeTransparent()
  const transBuf = await transparent.toBuffer()

  // Website logo (transparent, keeps text) for header / og fallback
  await sharp(transBuf).resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(`${PUB}/logo.png`)

  // favicon.ico style PNGs (transparent) - browsers tab icon
  await sharp(transBuf).resize(32, 32).png().toFile(`${PUB}/favicon-32x32.png`)
  await sharp(transBuf).resize(16, 16).png().toFile(`${PUB}/favicon-16x16.png`)
  await sharp(transBuf).resize(48, 48).png().toFile(`${PUB}/favicon.png`)

  // 2) Black-background icons (square, full bleed) for PWA / Apple / Android
  const BLACK = { r: 0, g: 0, b: 0, alpha: 1 }
  const blackBase = sharp(SRC).resize(1024, 1024, { fit: "cover" }).flatten({ background: BLACK })
  const blackBuf = await blackBase.png().toBuffer()

  const blackSizes = [512, 384, 192, 180, 167, 152, 144, 128, 120, 96, 72, 48]
  for (const s of blackSizes) {
    await sharp(blackBuf).resize(s, s).png().toFile(`${PUB}/icon-${s}x${s}.png`)
  }

  // Named icons referenced by layout/manifest
  await sharp(blackBuf).resize(180, 180).png().toFile(`${PUB}/apple-icon.png`) // Apple touch icon (black bg, no transparency per Apple)
  await sharp(blackBuf).resize(512, 512).png().toFile(`${PUB}/pwa-icon-512.png`)
  await sharp(blackBuf).resize(192, 192).png().toFile(`${PUB}/pwa-icon-192.png`)
  await sharp(blackBuf).resize(270, 270).png().toFile(`${PUB}/mstile-270x270.png`)

  // 3) Maskable icon (Android adaptive): logo scaled into ~80% safe zone, black bg
  const inner = 820 // safe zone within 1024 (~80%)
  const innerLogo = await sharp(SRC).resize(inner, inner, { fit: "contain", background: BLACK }).toBuffer()
  const maskable = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: BLACK },
  })
    .composite([{ input: innerLogo, gravity: "center" }])
    .png()
    .toBuffer()
  await sharp(maskable).resize(512, 512).png().toFile(`${PUB}/maskable-icon-512.png`)
  await sharp(maskable).resize(192, 192).png().toFile(`${PUB}/maskable-icon-192.png`)

  // 4) favicon.ico (multi-size, transparent)
  const ico16 = await sharp(transBuf).resize(16, 16).png().toBuffer()
  const ico32 = await sharp(transBuf).resize(32, 32).png().toBuffer()
  const ico48 = await sharp(transBuf).resize(48, 48).png().toBuffer()
  const ico = await pngToIco([ico16, ico32, ico48])
  await writeFile(`${PUB}/favicon.ico`, ico)

  console.log("Icons generated.")
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
