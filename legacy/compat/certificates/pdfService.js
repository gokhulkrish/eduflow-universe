const jsPDF = require('jspdf');
const crypto = require('crypto');

/**
 * Generates a PDF certificate from certificate data.
 * @param {Object} certificateData - Contains certificate details (name, date, etc.)
 * @returns {Buffer} PDF buffer
 */
function generatePDF(certificateData) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Certificate for ${certificateData.name}`, 10, 20);
  doc.text(`Issued: ${certificateData.issuedAt}`, 10, 30);
  doc.text(`Valid Until: ${certificateData.validUntil}`, 10, 40);
  doc.addImage(qrImageBuffer, 'JPEG', 'qr.png', 10, 50, 30); // QR image from print layout
  return doc.output('buffer');
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
