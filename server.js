const express = require('express');
const sharp = require('sharp');
const axios = require('axios');

const app = express();
app.use(express.json());

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

    res.set('Content-Type', 'image/png');
    res.send(finalImage);
  } catch (err) {
    console.error('❌ Error rendering image:', err);
    res.status(500).send('Failed to render image');
  }
});

app.get('/', (req, res) => {
  res.send('🔥 Sharp Overlay Server is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
