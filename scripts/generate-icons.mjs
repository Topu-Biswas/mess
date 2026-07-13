// Generate PWA app icons from an SVG source using sharp
import sharp from "sharp";
import { writeFileSync } from "fs";

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00A885"/>
      <stop offset="100%" stop-color="#00876A"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <path d="M256 120 c-52 0 -94 42 -94 94 c0 70 94 178 94 178 s94 -108 94 -178 c0 -52 -42 -94 -94 -94z" fill="white" opacity="0.95"/>
  <circle cx="256" cy="214" r="38" fill="#00A885"/>
  <path d="M242 214 L256 196 L270 214 L270 232 L242 232 Z" fill="white"/>
  <rect x="252" y="222" width="8" height="10" fill="#00A885"/>
</svg>`;

const SIZES = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-256.png", size: 256 },
  { name: "icon-384.png", size: 384 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 },
];

async function generate() {
  writeFileSync("public/icon.svg", ICON_SVG);
  for (const { name, size } of SIZES) {
    await sharp(Buffer.from(ICON_SVG)).resize(size, size).png().toFile(`public/${name}`);
    console.log(`Generated ${name} (${size}x${size})`);
  }
  await sharp(Buffer.from(ICON_SVG)).resize(32, 32).png().toFile("public/favicon.png");
  console.log("Generated favicon.png");

  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#00A885"/>
        <stop offset="100%" stop-color="#00876A"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <path d="M200 200 c-52 0 -94 42 -94 94 c0 70 94 178 94 178 s94 -108 94 -178 c0 -52 -42 -94 -94 -94z" fill="white" opacity="0.9"/>
    <circle cx="200" cy="294" r="38" fill="#00A885"/>
    <text x="360" y="290" font-family="sans-serif" font-size="72" font-weight="bold" fill="white">মেস ফাইন্ডার</text>
    <text x="360" y="350" font-family="sans-serif" font-size="32" fill="white" opacity="0.9">এলাকাভিত্তিক মেস খুঁজুন ও বুক করুন</text>
    <text x="360" y="410" font-family="sans-serif" font-size="24" fill="white" opacity="0.7">Mess Finder — Bangladesh's #1 map-based mess search platform</text>
  </svg>`;
  await sharp(Buffer.from(ogSvg)).resize(1200, 630).png().toFile("public/og-image.png");
  console.log("Generated og-image.png");
  console.log("All icons generated!");
}

generate().catch(console.error);
