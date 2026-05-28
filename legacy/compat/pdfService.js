const jsPDF = require('jspdf');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Loads the Bonafide certificate HTML template and replaces placeholders
 * with actual certificate data.
 *
 * @param {Object} data - Certificate data
 * @param {Buffer} qrImageBuffer - QR image buffer (JPEG/PNG)
 * @returns {Promise<Buffer>} PDF buffer
 */
function buildHtmlTemplate(data) {
  const templatePath = path.join(__dirname, 'bonafide-template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Add QR image at bottom right
  const qrBase64 = fs.readFileSync(path.join(__dirname, 'bonafide-template.png'), 'base64');
  if (qrBase64) {
    const qrWidth = 30;
    const qrHeight = 30;
    const qrPosition = { x: 170, y: 247 }; // 1cm right, 2cm bottom
    html += `<div class="qr-image" style="width: ${qrWidth}px; height: ${qrHeight}px;">${qrBase64}</div>`;
  }

  // Add student name
  html += `<div class="content">${data.name}</div>`;
  html += `<div class="content">${data.roll}</div>`;
  html += `<div class="content">${data.year}</div>`;
  html += `<div class="content">${data.academicYear}</div>`;
  html += `<div class="content">${data.branch}</div>`;
  html += `<div class="content">${data.academic_year}</div>`;

  return html;
}

/**
 * Generates a PDF certificate from certificate data.
 * @param {Object} certificateData - Contains certificate details
 * @param {Buffer} qrImageBuffer - QR image buffer (JPEG/PNG)
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePDF(certificateData, qrImageBuffer) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  // Load and render the HTML template
  const html = buildHtmlTemplate(certificateData);
  await doc.html(html, {
    callback: function () {
      // Add QR image at bottom right
      if (qrImageBuffer) {
        const qrWidth = 30;
        const qrHeight = 30;
        const qrPosition = { x: 10, y: 10 }; // 10px from top, 10px from left
        html += `<div class="qr-image" style="width: ${qrWidth}px; height: ${qrHeight}px;">${qrImageBuffer.toString('base64')}</div>`;
      }
    },
    x: 10,
    y: 10,
    width: 190, // width of the content
  });

  return doc.output('arraybuffer');
}

/**
 * Signs a certificate with a private key (example implementation).
 * @param {Buffer} certificateData - Certificate data to sign
 * @param {Buffer} privateKey - Private key for signing
 * @returns {Buffer} Signed certificate
 */
function signCertificate(certificateData, privateKey) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(certificateData.toString());
  return sign.sign(privateKey, 'base64');
}

module.exports = { generatePDF, signCertificate };
