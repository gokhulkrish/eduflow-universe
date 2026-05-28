import express from 'express';
import bodyParser from 'body-parser';
import { buildHtml, generatePDFFromHtml, signCertificate } from './certificates/pdfService.js';

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.get('/certificates/preview', async (req, res) => {
  const qs = req.query || {};
  const data = {
    name: qs.name || '',
    roll: qs.roll || '',
  };
  const html = await buildHtml(data, qs.qrBase64 || null);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.post('/certificates/generate', async (req, res) => {
  try {
    const { data, qrBase64 } = req.body;
    const html = await buildHtml(data || {}, qrBase64 || null);
    const pdf = await generatePDFFromHtml(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).send(String(err));
  }
});

app.post('/certificates/generate-signed', async (req, res) => {
  try {
    const { data, qrBase64, privateKey } = req.body;
    const html = await buildHtml(data || {}, qrBase64 || null);
    const pdf = await generatePDFFromHtml(html);
    let signature = null;
    if (privateKey) {
      signature = signCertificate(pdf, privateKey);
      res.setHeader('X-Certificate-Signature', signature);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).send(String(err));
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Certificate server listening on http://localhost:${PORT}`));
import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount certificates router
try {
  // Using static import so bundlers/linters can analyze it
  import('./certificates/index.js').then((mod) => {
    const certs = mod.default ?? mod;
    app.use('/certificates', certs);
    console.log('Mounted /certificates routes');
  }).catch((err) => console.error('Failed to mount certificates router:', err));
} catch (err) {
  console.error('Failed to mount certificates router (sync):', err);
}

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
