const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
app.use(bodyParser.json({ limit: '5mb' }));

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.CERT_BUCKET || 'certificates-pdfs';

app.post('/generate', async (req, res) => {
  try {
    const payload = req.body || {};
    const templateHtml = payload.templateHtml || '<div>Empty</div>';
    const requestId = payload.requestId || String(Date.now());

    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
    await page.setContent(templateHtml, { waitUntil: 'networkidle' });

    // Generate PDF with print backgrounds and A4 size (vector-preserving for text & SVG)
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    await browser.close();

    // If Supabase config available, upload PDF to storage
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const storageKey = `student-${payload.studentId ?? 'unknown'}/certificate-${requestId}.pdf`;
      const uploadUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${BUCKET}/${storageKey}`;

      const form = new FormData();
      form.append('file', pdfBuffer, { filename: `certificate-${requestId}.pdf`, contentType: 'application/pdf' });

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: form
      });

      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        console.warn('Storage upload failed', text);
      } else {
        const publicUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${storageKey}`;
        return res.setHeader('Content-Type', 'application/json').status(200).send({ success: true, pdfUrl: publicUrl, pdfPath: storageKey });
      }
    }

    // Fallback: stream PDF directly
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${requestId}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err?.message ?? 'render-failed' });
  }
});

app.listen(PORT, () => console.log(`PDF server listening on ${PORT}`));
