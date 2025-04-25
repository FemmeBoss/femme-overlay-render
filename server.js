const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const CLOUDINARY_CLOUD_NAME = 'drsopn5st';
const CLOUDINARY_PRESET = 'femme_overlay';
const CLOUDINARY_FOLDER = 'overlays';

// === ESCAPE DANGEROUS CHARS ===
const escapeHtml = (unsafe = '') => {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

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

app.post('/render', async (req, res) => {
  let { title, desc, bg } = req.body;

  // TEST FALLBACK — you can remove this later
  title = title || "Test & Validate";
  desc = desc || "Kitchen & Dining > Cozy 'Nooks' & Sunrooms";
  bg = bg || "https://res.cloudinary.com/drsopn5st/image/upload/v1745530957/femme_boss/n87obgtgdmy7axcwplif.png";

  try {
    const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
    const bgImage = await axios.get(bg, { responseType: 'arraybuffer' });

    const safeTitle = escapeHtml(title);
    const safeDesc = escapeHtml(desc);

    console.log('🧪 Title (safe):', safeTitle);
    console.log('🧪 Desc  (safe):', safeDesc);

    const svgOverlay = `
      <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <style>${css}</style>
        <rect x="140" y="475" width="800" height="400" rx="20" ry="20" fill="#ffffff" fill-opacity="0.8" />
        <text x="540" y="620" text-anchor="middle" class="title">${safeTitle}</text>
        <text x="540" y="700" text-anchor="middle" class="desc">${safeDesc}</text>
      </svg>
    `;

    const finalImage = await sharp(bgImage.data)
      .resize(1080, 1350)
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .png()
      .toBuffer();

    const imageUrl = await cloudinaryUpload(finalImage);
    res.json({ image_url: imageUrl });

  } catch (err) {
    console.error('❌ Render Error:', err);
    res.status(500).send('Overlay rendering failed');
  }
});

app.get('/', (req, res) => {
  res.send('🔥 FemmeBoss Renderer — Fully Escaped & Battle-Tested!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));