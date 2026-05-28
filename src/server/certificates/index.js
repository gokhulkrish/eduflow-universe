import express from 'express';
import fs from 'fs';
import path from 'path';
import { generatePDF, signCertificate } from './pdfService.js';

const router = express.Router();
const TEMPLATE_PATH = path.join(new URL('.', import.meta.url).pathname, 'bonafide-template.html');

console.log('Certificates router initialized');

function safeString(v) {
  return v === undefined || v === null ? '' : String(v);
}

function renderPreviewHTML(data) {
  console.log('renderPreviewHTML called with:', data);
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const qrSrc = data.qrBase64 ? `data:image/jpeg;base64,${data.qrBase64}` : '';
  html = html.replace(/{{QR_SRC}}/g, qrSrc);

  const map = {
    '{{NO}}': safeString(data.no),
    '{{DATED}}': safeString(data.dated),
    '{{NAME}}': safeString(data.name),
    '{{ROLL}}': safeString(data.roll),
    '{{YEAR}}': safeString(data.year),
    '{{BRANCH}}': safeString(data.branch),
    '{{ACADEMIC_YEAR}}': safeString(data.academicYear),
    '{{APPLICATION_DATE}}': safeString(data.applicationDate),
    '{{APPLICATION_PURPOSE}}': safeString(data.applicationPurpose),
    '{{AUTHORITY}}': safeString(data.authority),
  };

  Object.entries(map).forEach(([k, v]) => {
    html = html.split(k).join(v);
  });

  return html;
}

/**
 * GET /certificates/preview
 * Query params: name, roll, year, branch, academicYear, applicationDate,
 * applicationPurpose, authority, no, dated, qrBase64 (optional)
 * Returns rendered HTML with embedded styles for direct browser print.
 */
router.get('/preview', (req, res) => {
  console.log('GET /certificates/preview called');
  try {
    const html = renderPreviewHTML(req.query);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).send(`Certificate preview failed: ${err.message}`);
  }
});

/**
 * POST /certificates/generate
 * Body: { data: { name, roll, ... }, qrBase64?: string }
 * Returns: application/pdf (attachment)
 */
router.post('/generate', async (req, res) => {
  console.log('POST /certificates/generate called');
  try {
    const { data, qrBase64 } = req.body || {};
    const qrBuffer = qrBase64 ? Buffer.from(qrBase64, 'base64') : undefined;
    const pdfBuffer = await generatePDF(data || {}, qrBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bonafide-certificate.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /certificates/generate-signed
 * Body: { data: {...}, qrBase64?: string, privateKey: PEM string }
 * Returns: application/pdf + X-Certificate-Signature header
 */
router.post('/certificates/generate-signed', async (req, res) => {
  console.log('POST /certificates/generate-signed called');
  try {
    const { data, qrBase64, privateKey } = req.body || {};
    const qrBuffer = qrBase64 ? Buffer.from(qrBase64, 'base64') : undefined;
    const pdfBuffer = await generatePDF(data || {}, qrBuffer);

    if (privateKey && typeof privateKey === 'string') {
      const signature = signCertificate(pdfBuffer, privateKey);
      res.setHeader('X-Certificate-Signature', signature);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bonafide-certificate-signed.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Generate signed error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
