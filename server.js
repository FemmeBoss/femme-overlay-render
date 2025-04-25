const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(express.json());

// 🔥 HARD CODED CLOUDINARY CONFIG
const CLOUDINARY_CLOUD_NAME = 'drsopn5st'; // <- Your Cloudinary cloud name
const CLOUDINARY_PRESET = 'femme_overlay'; // <- Your unsigned preset name
const CLOUDINARY_FOLDER = 'overlays';      // <- Optional folder name

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
  const { title, desc, bg } = req.body;

  try {
    const bgImage = await axios.get(bg, { responseType: 'arraybuffer' });

    const svgOverlay = `
      <svg width="1080" height="1350">
        <style>
          .title { fill: black; font-size: 90px; font-family: "Times New Roman"; font-weight: bold; }
          .desc { fill: black; font-size: 50px; font-family: "Times New Roman"; }
        </style>
        <text x="60" y="1100" class="title">${title}</text>
        <text x="60" y="1200" class="desc">${desc}</text>
      </svg>
    `;

    const overlayBuffer = Buffer.from(svgOverlay);

    const finalImage = await sharp(bgImage.data)
      .resize(1080, 1350)
      .composite([{ input: overlayBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();

    const imageUrl = await cloudinaryUpload(finalImage);
    res.json({ image_url: imageUrl });
  } catch (err) {
    console.error('❌ Render Error:', err.message);
    res.status(500).send('Overlay rendering failed');
  }
});

app.get('/', (req, res) => {
  res.send('🔥 FemmeBoss Overlay Renderer (Hardcoded Cloudinary) is LIVE!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));