/**
 * Generate iOS PWA Splash Screens
 * Converts splash.svg to PNG files for all iOS device sizes
 * 
 * Usage: node scripts/generate-splash-screens.cjs
 */

const fs = require('fs');
const path = require('path');

// iOS device dimensions (width x height in points)
const SIZES = [
  { name: 'apple-splash-2048-2732', w: 2048, h: 2732, desc: 'iPad Pro 12.9"' },
  { name: 'apple-splash-1668-2388', w: 1668, h: 2388, desc: 'iPad Pro 11"' },
  { name: 'apple-splash-1640-2360', w: 1640, h: 2360, desc: 'iPad 10th gen' },
  { name: 'apple-splash-1536-2048', w: 1536, h: 2048, desc: 'iPad Air/Mini' },
  { name: 'apple-splash-1290-2796', w: 1290, h: 2796, desc: 'iPhone 14 Pro Max' },
  { name: 'apple-splash-1284-2778', w: 1284, h: 2778, desc: 'iPhone 13 Pro Max' },
  { name: 'apple-splash-1284-2778', w: 1284, h: 2778, desc: 'iPhone 12 Pro Max' },
  { name: 'apple-splash-1179-2556', w: 1179, h: 2556, desc: 'iPhone 14 Pro' },
  { name: 'apple-splash-1170-2532', w: 1170, h: 2532, desc: 'iPhone 13/12' },
  { name: 'apple-splash-1242-2688', w: 1242, h: 2688, desc: 'iPhone 11 Pro Max' },
  { name: 'apple-splash-1125-2436', w: 1125, h: 2436, desc: 'iPhone 11 Pro/X/XS' },
  { name: 'apple-splash-1242-2208', w: 1242, h: 2208, desc: 'iPhone 8 Plus' },
  { name: 'apple-splash-828-1792',  w: 828,  h: 1792,  desc: 'iPhone 11/XR' },
  { name: 'apple-splash-750-1334',  w: 750,  h: 1334,  desc: 'iPhone 8/7/6s/6' },
  { name: 'apple-splash-640-1136',  w: 640,  h: 1136,  desc: 'iPhone SE 1st gen' },
];

const splashDir = path.join(__dirname, '..', 'public', 'splash');
const svgPath = path.join(splashDir, 'splash.svg');

// Generate SVG with correct dimensions
function generateSvg(width, height) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#EC4899"/>
      <stop offset="50%" style="stop-color:#F472B6"/>
      <stop offset="100%" style="stop-color:#FBBF24"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <g transform="translate(${(width - 120) / 2}, ${(height - 200) / 2 - 50})">
    <rect x="0" y="0" width="120" height="120" rx="30" fill="white" opacity="0.95"/>
    <g transform="translate(35, 35)">
      <path d="M25 0L0 12.5L25 25L50 12.5L25 0Z" fill="#EC4899" stroke="#EC4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M0 35L25 47.5L50 35" stroke="#EC4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M0 22.5L25 35L50 22.5" stroke="#EC4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <text x="${width / 2}" y="${(height - 200) / 2 + 100}" text-anchor="middle" fill="white" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${width > 1000 ? 48 : 28}" font-weight="900" letter-spacing="-0.5">Chibi Vulture</text>
  <text x="${width / 2}" y="${(height - 200) / 2 + 145}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${width > 1000 ? 22 : 14}" font-weight="500">Premium Art Community</text>
  ${width > 1000 ? `
  <text x="${width / 2}" y="${height - 80}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="500">v1.0</text>
  ` : ''}
</svg>`;
  return svg;
}

function main() {
  console.log('Generating iOS PWA Splash Screens...\n');

  // Create splash directory if not exists
  if (!fs.existsSync(splashDir)) {
    fs.mkdirSync(splashDir, { recursive: true });
  }

  // Generate SVG splash screens for all sizes
  for (const size of SIZES) {
    const filename = `${size.name}.svg`;
    const filepath = path.join(splashDir, filename);
    const svg = generateSvg(size.w, size.h);
    
    fs.writeFileSync(filepath, svg);
    console.log(`  ✓ Generated ${filename} (${size.w}x${size.h}) - ${size.desc}`);
  }

  // Generate index file for reference
  const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Chibi Vulture - Splash Screens</title>
  <style>
    body { font-family: system-ui; padding: 20px; background: #1a1a1a; color: white; }
    .device { margin: 20px 0; padding: 20px; background: #333; border-radius: 12px; }
    .device img { max-width: 200px; border-radius: 8px; }
    .device h3 { margin: 0 0 10px; }
    .device p { margin: 0; color: #888; }
  </style>
</head>
<body>
  <h1>Splash Screens Preview</h1>
  <p>These SVG files are used as iOS PWA splash screens. Convert to PNG for production.</p>
  ${SIZES.map(s => `
  <div class="device">
    <h3>${s.desc}</h3>
    <p>${s.w}x${s.h} pixels</p>
    <img src="${s.name}.svg" alt="${s.desc}">
  </div>
  `).join('')}
</body>
</html>`;

  fs.writeFileSync(path.join(splashDir, 'index.html'), indexHtml);
  
  console.log('\n  ✓ Generated splash/index.html (preview page)');
  console.log('\nNote: iOS requires PNG images for splash screens.');
  console.log('To convert SVG to PNG, use one of these methods:');
  console.log('  1. Online: https://cloudconvert.com/svg-to-png');
  console.log('  2. CLI: npm install -g svgexport && svgexport file.svg file.png');
  console.log('  3. Node.js: npm install sharp && node convert.js\n');
}

main();
