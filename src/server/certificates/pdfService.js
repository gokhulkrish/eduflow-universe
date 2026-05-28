import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BONAFIDE_TEMPLATE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificate</title>
<style>
  body{font-family: 'Times New Roman', serif;margin:0;padding:20px;background:#fff;color:#000}
  .page{width:210mm;min-height:297mm;padding:28mm 22mm 24mm;border:1px solid #222;position:relative}
  .center{text-align:center}.college-name{font-size:22px;font-weight:700}
  .title{margin-top:26px;text-align:center;font-size:24px;font-weight:700;text-transform:uppercase}
  .content{margin-top:34px;font-size:20px;line-height:2}
  .qr-image{position:absolute;bottom:20mm;right:10mm;width:30mm;height:30mm}
  @page{size:A4;margin:20mm}
  @media print{body{background:#fff;padding:0}.page{border:none;box-shadow:none;margin:0;width:100%;min-height:100vh}}
</style>
</head><body><div class="page">
  <div class="center"><div class="college-name">Government College of Technology</div></div>
  <div class="title">Bonafide Certificate</div>
  <div class="content">This is to certify that <strong>{{NAME}}</strong> (Roll No. <strong>{{ROLL}}</strong>) is a bonafide student.</div>
  <img class="qr-image" src="{{QR_SRC}}" alt="QR" />
</div></body></html>`;

export async function buildHtml(data = {}, qrBase64 = null) {
  let html = BONAFIDE_TEMPLATE;
  html = html.replace(/\{\{NAME\}\}/g, data.name || '—');
  html = html.replace(/\{\{ROLL\}\}/g, data.roll || '—');
  html = html.replace(/\{\{QR_SRC\}\}/g, qrBase64 ? `data:image/png;base64,${qrBase64}` : '');
  return html;
}

export async function generatePDFFromHtml(html) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const buffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' } });
  await browser.close();
  return buffer;
}

export function signCertificate(pdfBuffer, privateKeyPem) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(pdfBuffer);
  sign.end();
  const signature = sign.sign(privateKeyPem, 'base64');
  return signature;
}
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TEMPLATE_PATH = path.join(new URL('.', import.meta.url).pathname, 'bonafide-template.html');

console.log('PDF Service initialized, template path:', TEMPLATE_PATH);
console.log('Template exists:', fs.existsSync(TEMPLATE_PATH));

/**
 * Inject certificate data + optional QR base64 into the HTML template.
 */
export function buildHtmlTemplate(data, qrBase64 = '') {
  console.log('Building HTML template with data:', data);
  console.log('QR Base64 provided:', !!qrBase64);
  
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  console.log('Template loaded, length:', html.length);

  // Embed QR image so jsPDF html2canvas renders it natively
  const qrSrc = qrBase64 ? `data:image/jpeg;base64,${qrBase64}` : '';
  html = html.replace(/{{QR_SRC}}/g, qrSrc);
  console.log('QR_SRC replaced:', qrSrc.length > 0);

  const replacers = {
    '{{NO}}': data.no ?? '',
    '{{DATED}}': data.dated ?? '',
    '{{NAME}}': data.name ?? '',
    '{{ROLL}}': data.roll ?? '',
    '{{YEAR}}': data.year ?? '',
    '{{BRANCH}}': data.branch ?? '',
    '{{ACADEMIC_YEAR}}': data.academicYear ?? '',
    '{{APPLICATION_DATE}}': data.applicationDate ?? '',
    '{{APPLICATION_PURPOSE}}': data.applicationPurpose ?? '',
    '{{AUTHORITY}}': data.authority ?? '',
  };

  Object.entries(replacers).forEach(([placeholder, value]) => {
    html = html.split(placeholder).join(String(value));
  });

  console.log('Template built successfully');
  return html;
}

/**
 * Generate a PDF Buffer from certificate data.
 * Requires `html2canvas` (and `canvas` polyfill for Node) to be installed.
 */
export async function generatePDF(certificateData, qrImageBuffer) {
  console.log('generatePDF called with:', certificateData);
  console.log('QR Image Buffer provided:', !!qrImageBuffer);
  
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  const qrBase64 = qrImageBuffer ? qrImageBuffer.toString('base64') : '';
  const html = buildHtmlTemplate(certificateData, qrBase64);

  await new Promise((resolve, reject) => {
    try {
      doc.html(html, {
        callback: function () {
          console.log('PDF generation completed');
          resolve();
        },
        x: 0,
        y: 0,
        width: 210,
        windowWidth: 794,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      reject(err);
    }
  });

  const output = Buffer.from(doc.output('arraybuffer'));
  console.log('PDF output buffer created, size:', output.length);
  return output;
}

/**
 * RSA-SHA256 sign the PDF buffer.
 */
export function signCertificate(pdfBuffer, privateKeyPem) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(pdfBuffer);
  return sign.sign(privateKeyPem, 'base64');
}
