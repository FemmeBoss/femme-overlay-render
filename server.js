const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// 🔐 Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'drsopn5st';
const CLOUDINARY_PRESET = 'femme_overlay';
const CLOUDINARY_FOLDER = 'overlays';

// 🧼 Escape characters for safe SVG injection
const escapeHtml = (unsafe = '') => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// ☁️ Upload to Cloudinary
const cloudinaryUpload = async (buffer) => {
  const form = new FormData();
  const base64 = buffer.toString('base64');

  form.append('file', `data:image/png;base64,${base64}`);
  form.append('upload_preset', CLOUDINARY_PRESET);
  form.append('folder', CLOUDINARY_FOLDER);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    form,
    { headers: form.getHeaders() }
  );

  return res.data.secure_url;
};

// 🖼️ Overlay Generator
app.post('/render', async (req, res) => {
  const { title, desc, bg } = req.body;

  const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
  const bgImage = await axios.get(bg, { responseType: 'arraybuffer' });

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(desc);

  const svgOverlay = `
  <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
    <style>${css}</style>
    <rect x="140" y="475" width="800" height="400" rx="20" ry="20" fill="#ffffff" fill-opacity="0.85"/>
    <text x="540" y="610" text-anchor="middle" class="title">${safeTitle}</text>
    
    <foreignObject x="190" y="660" width="700" height="250">
      <div xmlns="http://www.w3.org/1999/xhtml" style="
        font-family: 'Playfair Display', serif;
        font-size: 40px;
        font-style: italic;
        color: #111;
        text-align: center;
        line-height: 1.4;
      ">
        ${safeDesc}
      </div>
    </foreignObject>
  </svg>
`;

  const finalImage = await sharp(bgImage.data)
    .resize(1080, 1350)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const imageUrl = await cloudinaryUpload(finalImage);
  res.json({ image_url: imageUrl });
});

// 🔁 Health Check
app.get('/', (req, res) => {
  res.send('🔥 FemmeBoss Renderer is LIVE — FINAL CLEAN PATCH');
});

// 🚀 Launch Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
