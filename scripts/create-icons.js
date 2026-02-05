// Generate PNG icons for PWA
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  const padding = maskable ? size * 0.1 : 0;
  const effectiveSize = size - (padding * 2);
  const center = size / 2;
  const s = effectiveSize / 192;
  const offset = padding;
  
  // Background
  ctx.fillStyle = '#0D1117';
  if (maskable) {
    ctx.fillRect(0, 0, size, size);
  } else {
    // Rounded rectangle
    const radius = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
  }
  
  // Create gradient
  const gradient = ctx.createLinearGradient(offset, offset, offset + effectiveSize, offset + effectiveSize);
  gradient.addColorStop(0, '#22D3EE');
  gradient.addColorStop(0.5, '#06B6D4');
  gradient.addColorStop(1, '#0891B2');
  
  // Outer ring
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.arc(center, center, 70 * s, 0, Math.PI * 2);
  ctx.stroke();
  
  // Eye ellipse
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.ellipse(center, center, 50 * s, 32 * s, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  
  // Inner ring
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.arc(center, center, 24 * s, 0, Math.PI * 2);
  ctx.stroke();
  
  // Iris (filled)
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, 14 * s, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupil (dark center)
  ctx.fillStyle = '#0C1222';
  ctx.beginPath();
  ctx.arc(center, center, 7 * s, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(center - 5 * s, center - 5 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(center + 4 * s, center + 3 * s, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();
  
  // Wing hints (left)
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(offset + 24 * s, center);
  ctx.lineTo(offset + 44 * s, center - 12 * s);
  ctx.lineTo(offset + 44 * s, center + 12 * s);
  ctx.closePath();
  ctx.fill();
  
  // Wing hints (right)
  ctx.beginPath();
  ctx.moveTo(offset + effectiveSize - 24 * s, center);
  ctx.lineTo(offset + effectiveSize - 44 * s, center - 12 * s);
  ctx.lineTo(offset + effectiveSize - 44 * s, center + 12 * s);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  
  return canvas;
}

const publicDir = path.join(__dirname, '..', 'public');

// Generate icons
const icons = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
];

icons.forEach(({ name, size, maskable }) => {
  const canvas = drawIcon(size, maskable);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, name), buffer);
  console.log(`Created ${name}`);
});

console.log('All icons generated successfully!');
