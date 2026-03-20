/**
 * Generates placeholder PNG icons for the Mirror PWA.
 * Run: node scripts/generate-icons.js
 * Requires: npm install canvas (optional — uses HTML canvas via node-canvas)
 * 
 * If you don't want to run this, use any 512x512 dark purple (#2D2D7B) square PNG
 * and place it in /public/icons/ with the names below.
 */

const fs = require('fs')
const path = require('path')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const ICONS_DIR = path.join(__dirname, '../public/icons')

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true })
}

// Generate a simple SVG-based placeholder icon for each size
SIZES.forEach(size => {
  const fontSize = Math.round(size * 0.35)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#2D2D7B"/>
  <text x="50%" y="54%" font-family="Georgia, serif" font-size="${fontSize}" fill="white" 
        text-anchor="middle" dominant-baseline="middle" font-weight="300">M</text>
</svg>`
  
  const svgPath = path.join(ICONS_DIR, `icon-${size}.svg`)
  fs.writeFileSync(svgPath, svg)
  console.log(`Created icon-${size}.svg`)
})

// Badge icon
const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <rect width="72" height="72" rx="16" fill="#2D2D7B"/>
  <circle cx="36" cy="36" r="8" fill="#6C63FF"/>
</svg>`
fs.writeFileSync(path.join(ICONS_DIR, 'badge-72.svg'), badgeSvg)

// Apple touch icon (180x180)
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="40" fill="#2D2D7B"/>
  <text x="50%" y="54%" font-family="Georgia, serif" font-size="64" fill="white" 
        text-anchor="middle" dominant-baseline="middle" font-weight="300">M</text>
</svg>`
fs.writeFileSync(path.join(ICONS_DIR, 'apple-touch-icon.svg'), appleSvg)

console.log('\nSVG icons generated in public/icons/')
console.log('Note: For production, convert SVGs to PNGs or replace with proper artwork.')
console.log('The app will work with SVG icons during development.\n')
