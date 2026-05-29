# Playwright PDF Generation Microservice

This microservice renders HTML to high-quality PDFs using Playwright (Chromium). It preserves text as selectable text and keeps SVGs vector, producing much smaller and cleaner PDFs than rasterized screenshots.

Quick start (Docker):

1. Build the image:

```bash
docker build -t eduflow-cert-pdf:latest .
```

2. Run (example with Supabase storage envs):

```bash
docker run --rm -p 3000:3000 \
  -e SUPABASE_URL=https://xyz.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=service_role_key \
  -e CERT_BUCKET=certificates-pdfs \
  eduflow-cert-pdf:latest
```

API:

- POST /generate
  - body: JSON with `templateHtml`, `requestId`, `studentId` and other metadata
  - response: either `application/pdf` download or JSON `{ success:true, pdfUrl }` when uploaded to Supabase Storage.

Notes:
- Requires Playwright browsers; Docker image uses official Playwright runtime.
- Use Supabase service role to upload to private buckets.
