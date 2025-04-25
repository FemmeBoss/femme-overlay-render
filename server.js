const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(express.json());

const CLOUDINARY_CLOUD_NAME = 'drsopn5st';
const CLOUDINARY_PRESET = 'femme_overlay';
const CLOUDINARY_FOLDER = 'overlays';

const cloudinaryUpload = async (buffer) => {
  const form = new FormData();
  form.append('file', `data:image/png;base64,${buffer.toString('base64')}`);
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
      <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Playfair+Display:ital@1&display=swap');

          .bg-box { fill: white; opacity: 0.8; rx: 20; }
          .title {
            font-family: 'Cinzel', serif;
            font-size: 80px;
            font-weight: 700;
            fill: #000000;
          }
          .desc {
            font-family: 'Playfair Display', serif;
            font-size: 48px;
            font-style: italic;
            fill: #000000;
          }
        </style>

        <!-- Semi-transparent white rectangle -->
        <rect class="bg-box" x="60" y="1000" width="960" height="250" />

        <!-- Title and Description -->
        <text x="80" y="1120" class="title">${title}</text>
        <text x="80" y="1200" class="desc">${desc}</text>
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
  res.send('🔥 FemmeBoss Overlay Renderer v2.1 is RUNNING!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));