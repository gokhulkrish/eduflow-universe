import puppeteer from 'puppeteer';

function safeString(v) {
  return v === undefined || v === null ? '' : String(v);
}

export function buildCertificateHtml(data, templateHtml) {
  const tpl = templateHtml || `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificate</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Times New Roman',serif;color:#000;background:#fff}
  .page{width:210mm;height:297mm;margin:0 auto;background:#fff;padding:20mm 22mm 16mm;border:1px solid #222;display:flex;flex-direction:column;overflow:hidden}
  .center{text-align:center}
  .college-name{font-size:20px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px}
  .college-place{margin-top:2px;font-size:16px;font-weight:700;text-transform:uppercase}
  .college-affiliation{margin-top:2px;font-size:14px}
  .meta{margin-top:18px;display:flex;justify-content:space-between;align-items:center;font-size:14px;border-bottom:1px solid #222;padding-bottom:8px}
  .title{margin-top:16px;text-align:center;font-size:22px;font-weight:700;text-transform:uppercase;text-decoration:underline;letter-spacing:0.5px}
  .content{margin-top:20px;font-size:17px;line-height:1.85;text-align:justify;flex:1}
  .fill{display:inline-block;min-width:100px;border-bottom:1px dotted #000;padding:0 4px 1px;text-align:center;font-weight:700}
  .fill-sm{min-width:70px}.fill-md{min-width:140px}.fill-lg{min-width:200px}.fill-xl{min-width:280px}
  .to-block{margin-top:30px;font-size:16px;line-height:1.8}
  .signature{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}
  .seal-box{width:100px;height:100px;border:1px dashed #444;display:flex;align-items:center;justify-content:center;text-align:center;font-size:12px}
  .sign-area{width:220px;text-align:center;font-size:16px}
  .sign-line{border-top:1px solid #000;padding-top:6px;margin-top:40px;font-weight:700}
  .qr-image{position:absolute;bottom:15mm;right:8mm;width:25mm;height:25mm;object-fit:contain}
</style></head><body><div class="page">
  <div class="center"><div class="college-name">Government College of Technology</div><div class="college-place">Coimbatore - 641013</div><div class="college-affiliation">(Affiliated to Anna University, Chennai)</div></div>
  <div class="meta"><div><strong>No.</strong> <span class="fill fill-md">{{NO}}</span></div><div><strong>Dated:</strong> <span class="fill fill-md">{{DATED}}</span></div></div>
  <div class="title">Bonafide Certificate</div>
  <div class="content">This is to certify that <span class="fill fill-xl">{{NAME}}</span> (Roll No. <span class="fill fill-md">{{ROLL}}</span>) is a bonafide student of this college studying in <span class="fill fill-sm">{{YEAR}}</span> year of Four years of B.E./B.Tech. Degree course in <span class="fill fill-lg">{{BRANCH}}</span> during the academic year <span class="fill fill-md">{{ACADEMIC_YEAR}}</span>.<br><br>This certificate is issued with reference to his/her application dated <span class="fill fill-md">{{APPLICATION_DATE}}</span> to apply for <span class="fill fill-lg">{{APPLICATION_PURPOSE}}</span>.</div>
  <div class="to-block"><strong>To</strong><br><span class="fill fill-lg">{{AUTHORITY}}</span></div>
  <div class="signature"><div class="seal-box">Office Seal</div><div class="sign-area"><div class="sign-line">Office of the Principal</div></div></div>
  <img class="qr-image" src="{{QR_SRC}}" alt="QR" />
</div></body></html>`;

  let html = tpl;
  const qrSrc = data.qrBase64 ? `data:image/png;base64,${data.qrBase64}` : '';
  html = html.replace(/{{QR_SRC}}/g, qrSrc);

  const replacers = {
    '{{NO}}': safeString(data.no),
    '{{DATED}}': safeString(data.dated),
    '{{NAME}}': safeString(data.name ?? data.studentName ?? data.student_name),
    '{{ROLL}}': safeString(data.roll ?? data.admissionNo ?? data.admission_no),
    '{{YEAR}}': safeString(data.year),
    '{{BRANCH}}': safeString(data.branch),
    '{{ACADEMIC_YEAR}}': safeString(data.academicYear ?? data.academic_year),
    '{{APPLICATION_DATE}}': safeString(data.applicationDate ?? data.application_date),
    '{{APPLICATION_PURPOSE}}': safeString(data.applicationPurpose ?? data.application_purpose ?? data.purpose),
    '{{AUTHORITY}}': safeString(data.authority),
  };

  Object.entries(replacers).forEach(([k, v]) => {
    html = html.split(k).join(v);
  });

  return html;
}

export async function generatePDFFromHtml(html, options = {}) {
  const {
    format = 'A4',
    margin = { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    preferCSSPageSize = true,
    printBackground = true,
    scale = 1,
  } = options;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfConfig = {
      format,
      printBackground,
      margin,
      preferCSSPageSize,
      scale,
      omitBackground: false,
    };

    const buffer = await page.pdf(pdfConfig);
    return buffer;
  } finally {
    await browser.close();
  }
}

export async function signCertificate(pdfBuffer, privateKeyPem) {
  const { createSign } = await import('node:crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(pdfBuffer);
  sign.end();
  return sign.sign(privateKeyPem, 'base64');
}
