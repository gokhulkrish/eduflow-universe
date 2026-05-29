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
const API_KEY = process.env.PDF_SERVICE_API_KEY || null;
const PUBLIC_ENDPOINT = (process.env.PDF_SERVICE_PUBLIC || 'false') === 'true';

// Simple in-memory rate limiter (per API key or IP)
const rateStore = new Map();
const RATE_WINDOW_MS = (Number(process.env.PDF_SERVICE_RATE_WINDOW_SECONDS) || 60) * 1000;
const RATE_MAX = Number(process.env.PDF_SERVICE_RATE_LIMIT || 60);

function rateLimitMiddleware(req, res, next) {
  const key = (req.get('x-api-key') || req.ip || 'anon');
  const now = Date.now();
  const entry = rateStore.get(key) || { windowStart: now, count: 0 };
  if (now - entry.windowStart > RATE_WINDOW_MS) {
    entry.windowStart = now;
    entry.count = 0;
  }
  entry.count += 1;
  rateStore.set(key, entry);
  res.setHeader('X-RateLimit-Limit', RATE_MAX);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_MAX - entry.count));
  if (entry.count > RATE_MAX) {
    return res.status(429).json({ success: false, error: 'rate_limit_exceeded' });
  }
  next();
}

function requireApiKeyMiddleware(req, res, next) {
  if (PUBLIC_ENDPOINT) return next();
  if (!API_KEY) return res.status(503).json({ success: false, error: 'service-not-configured' });
  const provided = req.get('x-api-key') || (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!provided || provided !== API_KEY) return res.status(401).json({ success: false, error: 'invalid_api_key' });
  next();
}

// Health and readiness endpoints
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  try {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const context = await browser.newContext();
    await context.close();
    await browser.close();
    res.json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false, error: String(err.message || err) });
  }
});

app.post('/generate', requireApiKeyMiddleware, rateLimitMiddleware, async (req, res) => {
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
