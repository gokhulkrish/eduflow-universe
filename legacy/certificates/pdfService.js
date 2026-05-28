const jsPDF = require('jspdf');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEMPLATE_PATH = path.join(__dirname, 'bonafide-template.html');

console.log('PDF Service initialized, template path:', TEMPLATE_PATH);
console.log('Template exists:', fs.existsSync(TEMPLATE_PATH));

/**
 * Inject certificate data + optional QR base64 into the HTML template.
 */
function buildHtmlTemplate(data, qrBase64 = '') {
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
async function generatePDF(certificateData, qrImageBuffer) {
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
function signCertificate(pdfBuffer, privateKeyPem) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(pdfBuffer);
  return sign.sign(privateKeyPem, 'base64');
}

module.exports = { buildHtmlTemplate, generatePDF, signCertificate };
