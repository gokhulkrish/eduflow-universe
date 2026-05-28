/**
 * Certificate Print & PDF Styles
 * 
 * CSS and HTML enhancements for certificate rendering, printing, and PDF generation.
 */

export const CERTIFICATE_PRINT_CSS = `
  @media print {
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: white;
      color: black;
      font-family: 'Georgia', 'Times New Roman', serif;
    }
    .certificate-container {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      padding: 20mm;
      background: white;
      color: black;
    }
    .certificate {
      width: 100%;
      height: 100%;
      border: 3px solid #333;
      padding: 40px;
      box-shadow: none;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: white;
    }
    .certificate-header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .certificate-title {
      font-size: 48px;
      font-weight: bold;
      margin: 10px 0;
      letter-spacing: 2px;
    }
    .certificate-body {
      text-align: center;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 30px 0;
      font-size: 16px;
      line-height: 1.8;
    }
    .certificate-data {
      margin: 20px 0;
      font-size: 18px;
    }
    .certificate-data-item {
      margin: 15px 0;
    }
    .certificate-data-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 5px;
    }
    .certificate-data-value {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .certificate-qr {
      text-align: center;
      margin: 20px 0;
    }
    .certificate-qr img {
      max-width: 150px;
      height: auto;
    }
    .certificate-footer {
      display: flex;
      justify-content: space-around;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #333;
    }
    .certificate-signature {
      text-align: center;
      width: 200px;
    }
    .certificate-signature-line {
      border-top: 2px solid #000;
      margin-top: 60px;
      margin-bottom: 5px;
    }
    .certificate-signature-name {
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
    }
    .certificate-token {
      font-size: 8px;
      text-align: center;
      margin-top: 20px;
      color: #999;
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }
    @page {
      size: A4;
      margin: 0;
    }
  }
  
  @media screen {
    .certificate-container {
      width: 100%;
      padding: 20px;
    }
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e0e0e0;
      padding: 40px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 4px;
    }
  }
`;

export const CERTIFICATE_HTML_TEMPLATE = `
  <div class="certificate-container">
    <div class="certificate">
      <div class="certificate-header">
        <div style="font-size: 14px; color: #666;">OFFICIAL CERTIFICATE</div>
        <div class="certificate-title">{{template_name}}</div>
        <div style="font-size: 12px; color: #999;">{{template_code}}</div>
      </div>
      
      <div class="certificate-body">
        <p style="margin-bottom: 20px; font-size: 16px;">
          This is to certify that
        </p>
        <div class="certificate-data">
          <div class="certificate-data-value">{{student_name}}</div>
          <div class="certificate-data-label">Admission No: {{admission_no}}</div>
        </div>
        {{#if purpose}}
        <p style="margin-top: 30px; font-size: 15px;">
          has successfully completed the requirements for {{purpose}}
        </p>
        {{/if}}
        {{#if issued_at}}
        <div class="certificate-data" style="margin-top: 40px;">
          <div class="certificate-data-label">Issued On</div>
          <div class="certificate-data-value">{{issued_at}}</div>
        </div>
        {{/if}}
      </div>
      
      {{#if qr_token}}
      <div class="certificate-qr">
        <div class="certificate-data-label">Verification Code</div>
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='white'/%3E%3Ctext x='75' y='75' text-anchor='middle' dominant-baseline='middle' font-family='monospace' font-size='8' fill='black'%3E{{qr_token_short}}%3C/text%3E%3C/svg%3E" alt="QR Code" />
        <div class="certificate-token">{{qr_token}}</div>
      </div>
      {{/if}}
      
      <div class="certificate-footer">
        <div class="certificate-signature">
          <div class="certificate-signature-line"></div>
          <div class="certificate-signature-name">Authorized Signatory</div>
        </div>
        <div class="certificate-signature">
          <div class="certificate-signature-line"></div>
          <div class="certificate-signature-name">Principal/Head</div>
        </div>
      </div>
    </div>
  </div>
`;

export function applyPrintStyles(document: Document) {
  const style = document.createElement('style');
  style.textContent = CERTIFICATE_PRINT_CSS;
  document.head.appendChild(style);
}

export function generateCertificateHtml(
  templateBody: string,
  data: Record<string, string | boolean | undefined>
): string {
  let html = templateBody;
  
  // Simple variable substitution for {{variable}}
  html = html.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, key) => {
    const val = data[key];
    return val ? String(val) : "";
  });
  
  // Handle conditional blocks {{#if variable}}...{{/if}}
  html = html.replace(/\{\{#if\s+([\w_]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    return data[key] ? content : "";
  });
  
  return html;
}

export function printCertificate(htmlContent: string, title: string = "Certificate") {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) throw new Error("Unable to open print window");
  
  win.document.open();
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>${CERTIFICATE_PRINT_CSS}</style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  
  setTimeout(() => {
    win.print();
  }, 300);
}

export interface CertificateData {
  student_name: string;
  admission_no: string;
  template_name: string;
  template_code: string;
  purpose?: string;
  issued_at?: string;
  qr_token?: string;
  [key: string]: string | undefined;
}

export function prepareCertificateData(request: any): CertificateData {
  return {
    student_name: request.student_name ?? "",
    admission_no: request.admission_no ?? "",
    template_name: request.template_name ?? "",
    template_code: request.template_code ?? "",
    purpose: request.purpose ?? undefined,
    issued_at: request.issued_at ? new Date(request.issued_at).toLocaleDateString() : undefined,
    qr_token: request.qr_token ?? undefined,
    qr_token_short: (request.qr_token ?? "").slice(0, 16),
  };
}
