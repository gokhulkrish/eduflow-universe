import express from 'express';
import { buildCertificateHtml, generatePDFFromHtml, signCertificate } from './pdfService.js';

const router = express.Router();

/**
 * POST /certificates/generate
 * Body: { data: { name, roll, qrBase64?, ... }, templateHtml?: string }
 * Returns: application/pdf attachment
 */
router.post('/generate', async (req, res) => {
  try {
    const { data, templateHtml } = req.body || {};
    const html = buildCertificateHtml(data || {}, templateHtml);
    const pdfBuffer = await generatePDFFromHtml(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /certificates/generate-signed
 * Body: { data: {...}, templateHtml?: string, privateKey: PEM string }
 * Returns: application/pdf + X-Certificate-Signature header
 */
router.post('/generate-signed', async (req, res) => {
  try {
    const { data, templateHtml, privateKey } = req.body || {};
    const html = buildCertificateHtml(data || {}, templateHtml);
    const pdfBuffer = await generatePDFFromHtml(html);

    if (privateKey && typeof privateKey === 'string') {
      const signature = await signCertificate(pdfBuffer, privateKey);
      res.setHeader('X-Certificate-Signature', signature);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="certificate-signed.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Generate signed error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
