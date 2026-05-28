const jsPDF = require('jspdf');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Loads the Bonafide certificate HTML template and replaces placeholders
 * with actual certificate data.
 *
 * @param {Object} data - Certificate data
 * @param {string} data.name - Student name
 * @param {string} data.roll - Roll number
 * @param {string} data.year - Academic year (e.g., "III")
 * @param {string} data.branch - Branch / Department
 * @param {string} data.academicYear - Academic year (e.g., "2025-2026")
 * @param {string} data.applicationDate - Application date (e.g., "DD-MM-YYYY")
 * @param {string} data.applicationPurpose - Purpose (e.g., "Bus Pass")
 * @param {string} data.authority - Receiving authority / organization name
 * @param {string} data.no - Certificate number
 * @param {string} data.dated - Date of issue
 * @returns {string} HTML string ready for jsPDF
 */
function buildHtmlTemplate(data) {
  const templatePath = path.join(__dirname, 'bonafide-template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  const replacers = {
    '{{NO}}': data.no || '',
    '{{DATED}}': data.dated || '',
    '{{NAME}}': data.name || '',
    '{{ROLL}}': data.roll || '',
    '{{YEAR}}': data.year || '',
    '{{BRANCH}}': data.branch || '',
    '{{ACADEMIC_YEAR}}': data.academicYear || '',
    '{{APPLICATION_DATE}}': data.applicationDate || '',
    '{{APPLICATION_PURPOSE}}': data.applicationPurpose || '',
    '{{AUTHORITY}}': data.authority || '',
  };

  Object.entries(replacers).forEach(([placeholder, value]) => {
    const regex = new RegExp(placeholder, 'g');
    html = html.replace(regex, value);
  });

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
  
  // Add QR image at bottom right (1cm right, 2cm bottom)
  if (qrImageBuffer) {
    const qrBase64 = qrImageBuffer.toString('base64');
    // Position: 1cm from right = 210 - 10 - 30 = 170mm, 2cm from bottom = 297 - 20 - 30 = 247mm
    doc.addImage(qrBase64, 'JPEG', 170, 247, 30, 30);
  }

  await doc.html(html, {
    x: 10,
    y: 10,
    width: 190,
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
