const express = require('express');
const fs = require('fs');
const path = require('path');
const { generatePDF, signCertificate } = require('./pdfService');

const router = express.Router();
const TEMPLATE_PATH = path.join(__dirname, 'bonafide-template.html');

function safeString(v) {
  return v === undefined || v === null ? '' : String(v);
}

function renderPreviewHTML(data) {
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
  try {
    const html = renderPreviewHTML(req.query);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send(`Certificate preview failed: ${err.message}`);
  }
});

/**
 * POST /certificates/generate
 * Body: { data: { name, roll, ... }, qrBase64?: string }
 * Returns: application/pdf (attachment)
 */
router.post('/generate', async (req, res) => {
  try {
    const { data, qrBase64 } = req.body || {};
    const qrBuffer = qrBase64 ? Buffer.from(qrBase64, 'base64') : undefined;
    const pdfBuffer = await generatePDF(data || {}, qrBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bonafide-certificate.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /certificates/generate-signed
 * Body: { data: {...}, qrBase64?: string, privateKey: PEM string }
 * Returns: application/pdf + X-Certificate-Signature header
 */
router.post('/generate-signed', async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
