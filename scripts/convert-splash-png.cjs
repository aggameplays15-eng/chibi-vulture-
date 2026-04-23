/**
 * Convert SVG splash screens to PNG
 * Requires: npm install sharp
 * 
 * Usage: node scripts/convert-splash-png.cjs
 */

const fs = require('fs');
const path = require('path');

const splashDir = path.join(__dirname, '..', 'public', 'splash');

async function main() {
  try {
    const sharp = require('sharp');
    
    const files = fs.readdirSync(splashDir)
      .filter(f => f.startsWith('apple-splash-') && f.endsWith('.svg'));
    
    console.log(`Converting ${files.length} splash screens to PNG...\n`);
    
    for (const file of files) {
      const svgPath = path.join(splashDir, file);
      const pngPath = svgPath.replace('.svg', '.png');
      
      // Parse dimensions from filename (apple-splash-WIDTH-HEIGHT.svg)
      const match = file.match(/apple-splash-(\d+)-(\d+)/);
      if (!match) continue;
      
      const [, width, height] = match;
      
      await sharp(svgPath)
        .resize(parseInt(width), parseInt(height))
        .png()
        .toFile(pngPath);
      
      console.log(`  ✓ ${file} → ${path.basename(pngPath)}`);
    }
    
    console.log('\nAll splash screens converted successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nPlease install sharp first: npm install sharp');
    process.exit(1);
  }
}

main();
