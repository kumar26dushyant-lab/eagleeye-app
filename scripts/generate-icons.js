// Run this script with: node scripts/generate-icons.js
// Requires: npm install canvas (or use online converter)

const fs = require('fs');
const path = require('path');

// Since canvas may not be installed, let's create a simple HTML file
// that can be opened in browser to generate PNG icons

const html = `<!DOCTYPE html>
<html>
<head>
  <title>Generate EagleEye PWA Icons</title>
  <style>
    body { font-family: system-ui; padding: 20px; background: #1a1a1a; color: white; }
    canvas { border: 1px solid #333; margin: 10px; }
    .icons { display: flex; flex-wrap: wrap; gap: 20px; }
    button { padding: 10px 20px; font-size: 16px; cursor: pointer; margin: 10px; }
    a { color: #22D3EE; }
  </style>
</head>
<body>
  <h1>EagleEye PWA Icon Generator</h1>
  <p>Click the buttons below to download each icon, then place them in the <code>public/</code> folder.</p>
  
  <div class="icons">
    <div>
      <h3>icon-192.png</h3>
      <canvas id="icon192" width="192" height="192"></canvas>
      <br><button onclick="download('icon192', 'icon-192.png')">Download 192x192</button>
    </div>
    <div>
      <h3>icon-512.png</h3>
      <canvas id="icon512" width="512" height="512"></canvas>
      <br><button onclick="download('icon512', 'icon-512.png')">Download 512x512</button>
    </div>
    <div>
      <h3>icon-maskable-192.png (with padding)</h3>
      <canvas id="iconMask192" width="192" height="192"></canvas>
      <br><button onclick="download('iconMask192', 'icon-maskable-192.png')">Download Maskable 192x192</button>
    </div>
    <div>
      <h3>icon-maskable-512.png (with padding)</h3>
      <canvas id="iconMask512" width="512" height="512"></canvas>
      <br><button onclick="download('iconMask512', 'icon-maskable-512.png')">Download Maskable 512x512</button>
    </div>
  </div>
  
  <script>
    function drawIcon(canvas, maskable = false) {
      const ctx = canvas.getContext('2d');
      const size = canvas.width;
      const scale = size / 192;
      const padding = maskable ? size * 0.1 : 0;
      const effectiveSize = size - (padding * 2);
      const center = size / 2;
      
      // Background
      ctx.fillStyle = '#0D1117';
      if (maskable) {
        ctx.fillRect(0, 0, size, size);
      } else {
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, size * 0.2);
        ctx.fill();
      }
      
      // Scale for inner content
      const s = effectiveSize / 192;
      const offset = padding;
      
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
    }
    
    function download(canvasId, filename) {
      const canvas = document.getElementById(canvasId);
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    
    // Draw all icons on load
    drawIcon(document.getElementById('icon192'), false);
    drawIcon(document.getElementById('icon512'), false);
    drawIcon(document.getElementById('iconMask192'), true);
    drawIcon(document.getElementById('iconMask512'), true);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'generate-icons.html'), html);
console.log('Created public/generate-icons.html');
console.log('Open this file in a browser and click the download buttons to get your PNG icons.');
console.log('Then place them in the public/ folder.');
