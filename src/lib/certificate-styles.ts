/**
 * Certificate Print, PDF Styles & Template Engine
 *
 * Provides a fully configurable certificate system with:
 * - CertificateConfig for colors, fonts, layout, borders, QR, watermarks, logos, signatures
 * - Preset templates (Formal, Modern, Minimal, Classic, Bold)
 * - configToCss() to inject customization as scoped styles
 * - Template engine with {{variable}}, {{#if}}, {{#unless}} support
 */

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

export type BorderStyle = "solid" | "double" | "dashed" | "dotted" | "none" | "decorative";
export type Orientation = "portrait" | "landscape";
export type QrPosition = "bottom-left" | "bottom-right" | "bottom-center" | "inline";
export type WatermarkPosition = "center" | "diagonal" | "top-right" | "bottom-left";
export type SealStyle = "dashed" | "solid" | "embossed" | "circular" | "none";
export type SignatureLayout = "seal-left-principal-right" | "two-signatories" | "single-center" | "three-row";

export interface CertColors {
  text: string;
  background: string;
  accent: string;
  border: string;
  headerBg: string;
  headerText: string;
  titleText: string;
  labelColor: string;
  fillBorder: string;
  secondaryText: string;
  qrBorder: string;
}

export interface CertFonts {
  family: string;
  headerSize: string;
  titleSize: string;
  bodySize: string;
  metaSize: string;
  labelSize: string;
  smallSize: string;
  tokenSize: string;
}

export interface CertLayout {
  pageWidth: string;
  pageHeight: string;
  padding: string;
  orientation: Orientation;
  headerSpacing: string;
  titleSpacing: string;
  contentSpacing: string;
  footerSpacing: string;
  lineHeight: string;
}

export interface CertBorder {
  style: BorderStyle;
  width: string;
  color: string;
  radius: string;
  innerBorder: boolean;
}

export interface CertQr {
  size: string;
  position: QrPosition;
  borderColor: string;
  showTokenText: boolean;
  tokenFontFamily: string;
}

export interface CertWatermark {
  enabled: boolean;
  text: string;
  fontSize: string;
  color: string;
  opacity: string;
  position: WatermarkPosition;
  rotation: string;
}

export interface CertLogo {
  enabled: boolean;
  url: string;
  width: string;
  height: string;
  position: "header-left" | "header-center" | "header-right" | "background";
}

export interface CertSeal {
  style: SealStyle;
  width: string;
  height: string;
  borderColor: string;
  borderWidth: string;
  label: string;
}

export interface CertSignature {
  layout: SignatureLayout;
  signatories: Array<{
    label: string;
    imageUrl?: string;
    imageWidth?: string;
    imageHeight?: string;
  }>;
  lineColor: string;
  lineWidth: string;
  lineStyle: string;
  marginTop: string;
}

export interface CertNumbering {
  format: string;
  description: string;
}

export interface CertificateConfig {
  colors: CertColors;
  fonts: CertFonts;
  layout: CertLayout;
  border: CertBorder;
  qr: CertQr;
  watermark: CertWatermark;
  logo: CertLogo;
  seal: CertSeal;
  signature: CertSignature;
  numbering: CertNumbering;
}

// ════════════════════════════════════════════════════════════
// DEFAULTS
// ════════════════════════════════════════════════════════════

export const defaultColors = (): CertColors => ({
  text: "#000000",
  background: "#ffffff",
  accent: "#1a5276",
  border: "#000000",
  headerBg: "transparent",
  headerText: "#000000",
  titleText: "#000000",
  labelColor: "#666666",
  fillBorder: "#000000",
  secondaryText: "#555555",
  qrBorder: "#bbbbbb",
});

export const defaultFonts = (): CertFonts => ({
  family: "'Times New Roman', Georgia, serif",
  headerSize: "20px",
  titleSize: "22px",
  bodySize: "17px",
  metaSize: "14px",
  labelSize: "11px",
  smallSize: "10px",
  tokenSize: "8px",
});

export const defaultLayout = (): CertLayout => ({
  pageWidth: "210mm",
  pageHeight: "297mm",
  padding: "20mm 22mm 16mm",
  orientation: "portrait",
  headerSpacing: "12px",
  titleSpacing: "16px",
  contentSpacing: "20px",
  footerSpacing: "16px",
  lineHeight: "1.85",
});

export const defaultBorder = (): CertBorder => ({
  style: "solid",
  width: "1px",
  color: "#cccccc",
  radius: "0",
  innerBorder: false,
});

export const defaultQr = (): CertQr => ({
  size: "56px",
  position: "inline",
  borderColor: "#bbbbbb",
  showTokenText: true,
  tokenFontFamily: "'Courier New', monospace",
});

export const defaultWatermark = (): CertWatermark => ({
  enabled: false,
  text: "DRAFT",
  fontSize: "72px",
  color: "#000000",
  opacity: "0.04",
  position: "center",
  rotation: "-30deg",
});

export const defaultLogo = (): CertLogo => ({
  enabled: false,
  url: "",
  width: "60px",
  height: "60px",
  position: "header-left",
});

export const defaultSeal = (): CertSeal => ({
  style: "dashed",
  width: "100px",
  height: "100px",
  borderColor: "#888888",
  borderWidth: "1px",
  label: "Office Seal",
});

export const defaultSignature = (): CertSignature => ({
  layout: "seal-left-principal-right",
  signatories: [
    { label: "Office of the Principal" },
  ],
  lineColor: "#000000",
  lineWidth: "1px",
  lineStyle: "solid",
  marginTop: "40px",
});

export const defaultNumbering = (): CertNumbering => ({
  format: "CERT-{year}-{seq:05d}",
  description: "Available tokens: {year} {yy} {month} {day} {seq} {seq:05d} {type} {branch}",
});

export const defaultConfig = (): CertificateConfig => ({
  colors: defaultColors(),
  fonts: defaultFonts(),
  layout: defaultLayout(),
  border: defaultBorder(),
  qr: defaultQr(),
  watermark: defaultWatermark(),
  logo: defaultLogo(),
  seal: defaultSeal(),
  signature: defaultSignature(),
  numbering: defaultNumbering(),
});

// ════════════════════════════════════════════════════════════
// DARK MODE HELPERS
// ════════════════════════════════════════════════════════════

export function darkModeColors(): CertColors {
  return {
    text: "#e5e7eb",
    background: "#1f2937",
    accent: "#60a5fa",
    border: "#d1d5db",
    headerBg: "transparent",
    headerText: "#f9fafb",
    titleText: "#f3f4f6",
    labelColor: "#9ca3af",
    fillBorder: "#d1d5db",
    secondaryText: "#9ca3af",
    qrBorder: "#4b5563",
  };
}

export function darkModeCss(): string {
  return `
/* Dark mode overrides for template hardcoded colors */
.dark .cert-config-root,
:root.dark .cert-config-root {
  --cert-text: #e5e7eb;
  --cert-bg: #1f2937;
  --cert-muted: #9ca3af;
  --cert-border: #4b5563;
  --cert-accent: #60a5fa;
}
.dark .cert-config-root * {
  border-color: var(--cert-border) !important;
}
.dark .cert-config-root .certificate-page,
.dark .cert-config-root .page {
  background: var(--cert-bg) !important;
  border-color: var(--cert-border) !important;
}
.dark .cert-config-root .certificate-page *,
.dark .cert-config-root .page * {
  border-color: inherit;
}
.dark .cert-config-root img[alt="QR"] {
  filter: invert(1) brightness(0.8);
}
`;
}

// ════════════════════════════════════════════════════════════
// PRESETS
// ════════════════════════════════════════════════════════════

export interface CertPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<CertificateConfig>;
}

export const CERT_PRESETS: CertPreset[] = [
  {
    id: "formal",
    name: "Formal Classic",
    description: "Traditional formal certificate with serif fonts, double border, dark navy accent",
    config: {
      colors: { ...defaultColors(), accent: "#1a237e", border: "#1a237e", titleText: "#1a237e" },
      fonts: { ...defaultFonts(), family: "'Georgia', 'Times New Roman', serif", titleSize: "24px" },
      border: { ...defaultBorder(), style: "double", width: "3px", color: "#1a237e" },
      signature: { ...defaultSignature(), signatories: [{ label: "Office of the Principal" }] },
    },
  },
  {
    id: "modern",
    name: "Modern Professional",
    description: "Clean sans-serif design with accent colors and minimal borders",
    config: {
      colors: { ...defaultColors(), accent: "#2e7d32", border: "#e0e0e0", titleText: "#2e7d32", headerText: "#333333" },
      fonts: { ...defaultFonts(), family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", titleSize: "20px", headerSize: "18px" },
      border: { ...defaultBorder(), style: "solid", width: "2px", color: "#2e7d32" },
      layout: { ...defaultLayout(), lineHeight: "1.8" },
    },
  },
  {
    id: "minimal",
    name: "Minimal Clean",
    description: "Simple, clean design with no border, maximum whitespace",
    config: {
      colors: { ...defaultColors(), border: "#eeeeee", accent: "#333333", titleText: "#000000" },
      fonts: { ...defaultFonts(), family: "'Helvetica Neue', Arial, sans-serif", bodySize: "16px" },
      border: { ...defaultBorder(), style: "none", width: "0", color: "transparent" },
      layout: { ...defaultLayout(), padding: "30mm 25mm 20mm" },
      seal: { ...defaultSeal(), style: "none" },
      signature: { ...defaultSignature(), marginTop: "50px" },
    },
  },
  {
    id: "classic",
    name: "Classic Ornate",
    description: "Ornate traditional style with decorative elements and embossed seal",
    config: {
      colors: { ...defaultColors(), accent: "#7b241c", border: "#7b241c", titleText: "#7b241c", headerText: "#7b241c" },
      fonts: { ...defaultFonts(), family: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", titleSize: "26px", headerSize: "22px" },
      border: { ...defaultBorder(), style: "double", width: "4px", color: "#7b241c" },
      seal: { ...defaultSeal(), style: "embossed", borderColor: "#7b241c" },
      signature: { ...defaultSignature(), signatories: [{ label: "Office of the Principal" }] },
    },
  },
  {
    id: "bold",
    name: "Bold & Contemporary",
    description: "Strong colors, large fonts, thick borders for high impact",
    config: {
      colors: { ...defaultColors(), accent: "#e65100", border: "#e65100", titleText: "#e65100", headerText: "#bf360c" },
      fonts: { ...defaultFonts(), family: "'Arial Black', 'Impact', sans-serif", titleSize: "28px", headerSize: "22px", bodySize: "18px" },
      border: { ...defaultBorder(), style: "solid", width: "3px", color: "#e65100" },
      layout: { ...defaultLayout(), lineHeight: "2.0" },
      seal: { ...defaultSeal(), style: "circular", borderColor: "#e65100" },
    },
  },
];

// ════════════════════════════════════════════════════════════
// CERTIFICATE NUMBERING
// ════════════════════════════════════════════════════════════

export function generateCertificateNumber(
  format: string,
  seq: number,
  data?: { type?: string; branch?: string }
): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const yy = year.slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  let result = format
    .replace(/\{year\}/g, year)
    .replace(/\{yy\}/g, yy)
    .replace(/\{month\}/g, month)
    .replace(/\{day\}/g, day)
    .replace(/\{type\}/g, data?.type ?? "CERT")
    .replace(/\{branch\}/g, data?.branch ?? "GEN")
    .replace(/\{seq(:\d+d)?\}/g, (m) => {
      const pad = m.includes(":") ? parseInt(m.split(":")[1]) || 0 : 0;
      return pad > 0 ? String(seq).padStart(pad, "0") : String(seq);
    });

  return result;
}

// ════════════════════════════════════════════════════════════
// TEMPLATE IMPORT/EXPORT
// ════════════════════════════════════════════════════════════

export interface TemplateExport {
  version: string;
  exportedAt: string;
  name: string;
  code: string;
  body: string;
  active: boolean;
  config?: Partial<CertificateConfig>;
}

export function exportTemplate(
  name: string,
  code: string,
  body: string,
  active: boolean,
  config?: Partial<CertificateConfig>
): TemplateExport {
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    name,
    code,
    body,
    active,
    config,
  };
}

export function exportTemplateAsJson(
  name: string,
  code: string,
  body: string,
  active: boolean,
  config?: Partial<CertificateConfig>
): Blob {
  const data = exportTemplate(name, code, body, active, config);
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}

export function parseTemplateImport(json: string): TemplateExport | { error: string } {
  try {
    const data = JSON.parse(json);
    if (!data || typeof data !== "object" || !data.name || !data.code || !data.body) {
      return { error: "Invalid template format. Required: name, code, body" };
    }
    return data as TemplateExport;
  } catch {
    return { error: "Invalid JSON file" };
  }
}

// ════════════════════════════════════════════════════════════
// CONFIG → CSS
// ════════════════════════════════════════════════════════════

export function configToCss(cfg: CertificateConfig): string {
  const { colors: c, fonts: f, layout: l, border: b, qr, watermark: w, logo, seal, signature: sig } = cfg;

  const borderCss = b.style === "none"
    ? "none"
    : `${b.width} ${b.style} ${b.color}`;

  const sealCss = seal.style === "none"
    ? "display: none"
    : `width: ${seal.width}; height: ${seal.height}; border: ${seal.borderWidth} ${seal.style === "embossed" ? "solid" : seal.style} ${seal.borderColor}; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; color: ${c.secondaryText}; ${seal.style === "circular" ? "border-radius: 50%;" : ""}`;

  const signLineCss = `border-top: ${sig.lineWidth} ${sig.lineStyle} ${sig.lineColor}; padding-top: 6px; margin-top: ${sig.marginTop}; font-weight: 700;`;

  // Build signatories HTML
  let signatoriesHtml = "";
  if (sig.layout === "single-center") {
    const s = sig.signatories[0] ?? { label: "Authorized Signatory" };
    signatoriesHtml = `<div class="sign-area"><div class="sign-line">${s.imageUrl ? `<img src="${s.imageUrl}" style="width:${s.imageWidth ?? "120px"};height:${s.imageHeight ?? "40px"};object-fit:contain;display:block;margin:0 auto 8px;" alt="Signature" />` : ""}${s.label}</div></div>`;
  } else if (sig.layout === "three-row") {
    signatoriesHtml = sig.signatories.map(s =>
      `<div class="sign-area" style="text-align:center;width:100%;"><div class="sign-line" style="${signLineCss}">${s.imageUrl ? `<img src="${s.imageUrl}" style="width:${s.imageWidth ?? "120px"};height:${s.imageHeight ?? "40px"};object-fit:contain;display:block;margin:0 auto 8px;" alt="Signature" />` : ""}${s.label}</div></div>`
    ).join("");
  } else {
    // seal-left-principal-right or two-signatories
    signatoriesHtml = `<div class="seal-box" style="${sealCss}">${seal.label}</div>`;
    sig.signatories.forEach(s => {
      signatoriesHtml += `<div class="sign-area"><div class="sign-line" style="${signLineCss}">${s.imageUrl ? `<img src="${s.imageUrl}" style="width:${s.imageWidth ?? "120px"};height:${s.imageHeight ?? "40px"};object-fit:contain;display:block;margin:0 auto 8px;" alt="Signature" />` : ""}${s.label}</div></div>`;
    });
  }

  // Logo tag
  const logoTag = logo.enabled && logo.url
    ? `<img src="${logo.url}" style="width:${logo.width};height:${logo.height};object-fit:contain;" alt="Logo" />`
    : "";

  const logoStyle = logo.enabled && logo.position === "background"
    ? `background-image: url('${logo.url}'); background-size: ${logo.width} ${logo.height}; background-repeat: no-repeat; background-position: center; background-opacity: 0.05;`
    : "";

  // Watermark
  const watermarkStyle = w.enabled
    ? `position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0;`
    : "display: none;";

  const watermarkTextStyle = w.enabled
    ? `font-size: ${w.fontSize}; color: ${w.color}; opacity: ${w.opacity}; font-weight: 700; text-transform: uppercase; letter-spacing: 8px; transform: rotate(${w.rotation}); position: absolute; ${
        w.position === "center" ? "top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(" + w.rotation + ");" :
        w.position === "diagonal" ? "top: 30%; left: 10%; transform: rotate(" + w.rotation + ");" :
        w.position === "top-right" ? "top: 15%; right: 10%; transform: rotate(" + w.rotation + ");" :
        "bottom: 15%; left: 10%; transform: rotate(" + w.rotation + ");"
      }`
    : "";

  return `
/* ═══ Certificate Config Styles ═══ */
.cert-config-root {
  font-family: ${f.family};
  color: ${c.text};
  background: ${c.background};
  position: relative;
}
.cert-config-root .college-name { font-size: ${f.headerSize}; color: ${c.headerText}; }
.cert-config-root .college-place,
.cert-config-root .college-affiliation { color: ${c.secondaryText}; }
.cert-config-root .meta { font-size: ${f.metaSize}; border-color: ${c.border}; }
.cert-config-root .title { font-size: ${f.titleSize}; color: ${c.titleText}; }
.cert-config-root .content { font-size: ${f.bodySize}; line-height: ${l.lineHeight}; color: ${c.text}; }
.cert-config-root .fill { border-color: ${c.fillBorder}; }
.cert-config-root .label { color: ${c.labelColor}; }
.cert-config-root .verification-label { font-size: ${f.labelSize}; color: ${c.labelColor}; }
.cert-config-root .verification-token { font-family: ${qr.tokenFontFamily}; font-size: ${f.tokenSize}; color: ${c.secondaryText}; }
.cert-config-root .verification-qr { width: ${qr.size}; height: ${qr.size}; border-color: ${qr.borderColor}; }
.cert-config-root .page { padding: ${l.padding}; border: ${borderCss}; ${b.radius !== "0" ? "border-radius: " + b.radius + ";" : ""} }
.cert-config-root .sign-line { ${signLineCss} }
.cert-config-root .watermark { ${watermarkStyle} }
.cert-config-root .watermark-text { ${watermarkTextStyle} }
.cert-config-root .logo { ${logo.enabled ? "" : "display:none;"} }
.cert-config-root .page { ${logoStyle} }
`;
}

// ════════════════════════════════════════════════════════════
// TEMPLATE ENGINE
// ════════════════════════════════════════════════════════════

export function generateCertificateHtml(
  templateBody: string,
  data: Record<string, string | boolean | undefined>
): string {
  let html = templateBody;

  // 1. Variable substitution: {{variable}}
  html = html.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, key) => {
    const val = data[key];
    return val != null ? String(val) : "";
  });

  // 2. Conditionals: {{#if variable}}...{{/if}} (nested-safe via loop)
  let prev: string;
  do {
    prev = html;
    html = html.replace(/\{\{#if\s+([\w_]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
      return data[key] ? content : "";
    });
  } while (html !== prev);

  // 3. Unless blocks: {{#unless variable}}...{{/unless}} (show when falsy)
  do {
    prev = html;
    html = html.replace(/\{\{#unless\s+([\w_]+)\s*\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, key, content) => {
      return data[key] ? "" : content;
    });
  } while (html !== prev);

  return html;
}

// ════════════════════════════════════════════════════════════
// PRINT CSS
// ════════════════════════════════════════════════════════════

export const CERTIFICATE_PRINT_CSS = `
  @media print {
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; color: black; font-family: 'Georgia', 'Times New Roman', serif; }
    .certificate-container { width: 210mm; height: 297mm; page-break-after: always; padding: 20mm; background: white; }
    .certificate { width: 100%; height: 100%; border: 3px solid #333; padding: 40px; box-shadow: none; page-break-inside: avoid; display: flex; flex-direction: column; justify-content: space-between; background: white; }
    .certificate-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .certificate-title { font-size: 48px; font-weight: bold; margin: 10px 0; letter-spacing: 2px; }
    .certificate-body { text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; margin: 30px 0; font-size: 16px; line-height: 1.8; }
    .certificate-data { margin: 20px 0; font-size: 18px; }
    .certificate-data-item { margin: 15px 0; }
    .certificate-data-label { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 5px; }
    .certificate-data-value { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
    .certificate-qr { text-align: center; margin: 20px 0; }
    .certificate-qr img { max-width: 150px; height: auto; }
    .certificate-footer { display: flex; justify-content: space-around; margin-top: 40px; padding-top: 30px; border-top: 2px solid #333; }
    .certificate-signature { text-align: center; width: 200px; }
    .certificate-signature-line { border-top: 2px solid #000; margin-top: 60px; margin-bottom: 5px; }
    .certificate-signature-name { font-size: 12px; text-transform: uppercase; color: #666; }
    .certificate-token { font-size: 8px; text-align: center; margin-top: 20px; color: #999; font-family: 'Courier New', monospace; word-break: break-all; }
    @page { size: A4; margin: 0; }
  }
  @media screen {
    .certificate-container { width: 100%; padding: 20px; }
    .certificate { max-width: 800px; margin: 0 auto; border: 1px solid var(--cert-border, #e0e0e0); padding: 40px; background: var(--cert-bg, white); box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px; }
  }
`;

export const CERTIFICATE_HTML_TEMPLATE = `
  <div class="certificate-container">
    <div class="certificate">
      <div class="certificate-header">
        <div style="font-size: 14px; color: var(--cert-muted, #666);">OFFICIAL CERTIFICATE</div>
        <div class="certificate-title">{{template_name}}</div>
        <div style="font-size: 12px; color: var(--cert-muted, #999);">{{template_code}}</div>
      </div>
      <div class="certificate-body">
        <p style="margin-bottom: 20px; font-size: 16px;">This is to certify that</p>
        <div class="certificate-data">
          <div class="certificate-data-value">{{student_name}}</div>
          <div class="certificate-data-label">Admission No: {{admission_no}}</div>
        </div>
        {{#if purpose}}
        <p style="margin-top: 30px; font-size: 15px;">has successfully completed the requirements for {{purpose}}</p>
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
        <div class="certificate-qr">
          <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR" style="background:var(--cert-bg,#fff);color:var(--cert-text,#000);">
            <rect width="150" height="150" fill="currentcolor" opacity="0.15" />
            <text x="75" y="75" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="8" fill="currentcolor">{{qr_token_short}}</text>
          </svg>
        </div>
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

// ════════════════════════════════════════════════════════════
// DEFAULT TEMPLATES FOR SEEDING
// ════════════════════════════════════════════════════════════

export const GCT_BONAFIDE_TEMPLATE = `
<style>
  * { box-sizing: border-box; }
  .bonafide-page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 28mm 22mm 24mm; border: 1px solid #222; font-family: "Times New Roman", serif; color: #000; }
  .bonafide-center { text-align: center; }
  .bonafide-college-name { font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
  .bonafide-college-place { margin-top: 4px; font-size: 18px; font-weight: 700; text-transform: uppercase; }
  .bonafide-college-affiliation { margin-top: 4px; font-size: 16px; }
  .bonafide-meta { margin-top: 28px; display: flex; justify-content: space-between; font-size: 17px; }
  .bonafide-title { margin-top: 26px; text-align: center; font-size: 24px; font-weight: 700; text-transform: uppercase; text-decoration: underline; letter-spacing: 0.5px; }
  .bonafide-content { margin-top: 34px; font-size: 20px; line-height: 2.05; text-align: justify; }
  .bonafide-fill { display: inline-block; min-width: 130px; border-bottom: 1px dotted #000; padding: 0 6px 2px; text-align: center; font-weight: 700; }
  .bonafide-fill-sm { min-width: 90px; }
  .bonafide-fill-md { min-width: 180px; }
  .bonafide-fill-lg { min-width: 260px; }
  .bonafide-fill-xl { min-width: 340px; }
  .bonafide-to-block { margin-top: 38px; font-size: 19px; line-height: 1.9; }
  .bonafide-signature { margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; }
  .bonafide-seal-box { width: 160px; height: 160px; border: 1px dashed #444; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 16px; flex-shrink: 0; }
  .bonafide-sign-area { width: 260px; text-align: center; font-size: 18px; }
  .bonafide-sign-line { border-top: 1px solid #000; padding-top: 8px; margin-top: 60px; font-weight: 700; }
  @media print { .bonafide-page { box-shadow: none; border: none; width: 100%; min-height: auto; margin: 0; } }
</style>
<div class="bonafide-page">
  <div class="bonafide-center">
    <div class="bonafide-college-name">Government College of Technology</div>
    <div class="bonafide-college-place">Coimbatore - 641013</div>
    <div class="bonafide-college-affiliation">(Affiliated to Anna University, Chennai)</div>
  </div>

  <div class="bonafide-meta">
    <div><strong>No.</strong> <span class="bonafide-fill bonafide-fill-md">{{NO}}</span></div>
    <div><strong>Dated:</strong> <span class="bonafide-fill bonafide-fill-md">{{DATED}}</span></div>
  </div>

  <div class="bonafide-title">Bonafide Certificate</div>

  <div class="bonafide-content">
    This is to certify that <span class="bonafide-fill bonafide-fill-xl">{{NAME}}</span>
    (Roll No. <span class="bonafide-fill bonafide-fill-md">{{ROLL}}</span>) is a bonafide
    student of this college studying in <span class="bonafide-fill bonafide-fill-sm">{{YEAR}}</span> year
    of Four years of B.E./B.Tech. Degree course in
    <span class="bonafide-fill bonafide-fill-lg">{{BRANCH}}</span> during the academic year
    <span class="bonafide-fill bonafide-fill-md">{{ACADEMIC_YEAR}}</span>.

    <br><br>

    This certificate is issued with reference to his/her application dated
    <span class="bonafide-fill bonafide-fill-md">{{APPLICATION_DATE}}</span> to apply for
    <span class="bonafide-fill bonafide-fill-lg">{{APPLICATION_PURPOSE}}</span>.
  </div>

  {{#if AUTHORITY}}
  <div class="bonafide-to-block">
    <strong>To</strong><br>
    <span class="bonafide-fill bonafide-fill-lg">{{AUTHORITY}}</span>
  </div>
  {{/if}}

  <div class="bonafide-signature">
    <div class="bonafide-seal-box">Office Seal</div>
    <div class="bonafide-sign-area">
      <div class="bonafide-sign-line">Office of the Principal</div>
    </div>
  </div>

  {{#if QR_SRC}}
  <div style="margin-top:14px;padding-top:10px;border-top:1px solid #ddd;display:flex;align-items:center;gap:14px;font-size:12px;">
    <img src="{{QR_SRC}}" style="width:56px;height:56px;border:1px solid #bbb;object-fit:contain;flex-shrink:0;" alt="QR" />
    <div style="flex:1;min-width:0;">
      <div style="font-size:9px;text-transform:uppercase;color:#888;letter-spacing:0.5px;">Verification Code</div>
      <div style="font-family:'Courier New',monospace;font-size:8px;word-break:break-all;margin-top:2px;color:#666;">{{qr_token}}</div>
    </div>
  </div>
  {{/if}}
</div>
`;

export const GCT_TRANSFER_TEMPLATE = `
<div style="text-align:center;padding:10px 0 6px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">{{INSTITUTION_NAME}}</div>
  <div style="font-size:10px;color:#555;">{{INSTITUTION_PLACE}}</div>
  <div style="font-size:8px;color:#888;margin-top:2px;">{{INSTITUTION_AFFILIATION}}</div>
</div>
<hr style="border:none;border-top:2px solid {{ACCENT_COLOR}};margin:4px 0;" />
<div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;letter-spacing:3px;text-transform:uppercase;color:{{ACCENT_COLOR}};">Transfer Certificate</div>
<div style="text-align:right;font-size:9px;margin-bottom:8px;">
  TC No: {{NO}} &nbsp;&nbsp; Date: {{DATED}}
</div>
<table style="width:100%;font-size:10px;line-height:1.8;border-collapse:collapse;">
  <tr><td style="width:40%;font-weight:600;">Name of the Student</td><td>: <strong>{{NAME}}</strong></td></tr>
  <tr><td style="font-weight:600;">Admission Number</td><td>: {{ROLL}}</td></tr>
  <tr><td style="font-weight:600;">Branch / Course</td><td>: {{BRANCH}}</td></tr>
  <tr><td style="font-weight:600;">Year of Study</td><td>: {{YEAR}}</td></tr>
  <tr><td style="font-weight:600;">Academic Year</td><td>: {{ACADEMIC_YEAR}}</td></tr>
  <tr><td style="font-weight:600;">Date of Admission</td><td>: {{APPLICATION_DATE}}</td></tr>
</table>
<div style="font-size:10px;line-height:1.6;margin-top:10px;">
  <p>This is to certify that the above-named student was a bonafide student of this institution and has <strong>applied for transfer</strong> to pursue further education elsewhere.</p>
  <p>He/She has cleared all dues and is hereby issued this Transfer Certificate.</p>
</div>
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;flex:1;">{{SIGNATORIES_HTML}}</div>
</div>
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ccc;font-size:8px;text-align:center;color:#999;">
  Verify at: <code style="font-size:7px;">{{qr_token}}</code>
</div>
{{#if QR_SRC}}
<div style="margin-top:8px;text-align:center;">
  <img src="{{QR_SRC}}" style="width:80px;height:80px;" alt="QR" />
</div>
{{/if}}
`;

export const GCT_CONDUCT_TEMPLATE = `
<div style="text-align:center;padding:10px 0 6px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">{{INSTITUTION_NAME}}</div>
  <div style="font-size:10px;color:#555;">{{INSTITUTION_PLACE}}</div>
  <div style="font-size:8px;color:#888;margin-top:2px;">{{INSTITUTION_AFFILIATION}}</div>
</div>
<hr style="border:none;border-top:2px solid {{ACCENT_COLOR}};margin:4px 0;" />
<div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;letter-spacing:3px;text-transform:uppercase;color:{{ACCENT_COLOR}};">Conduct Certificate</div>
<div style="text-align:right;font-size:9px;margin-bottom:8px;">
  No: {{NO}} &nbsp;&nbsp; Dated: {{DATED}}
</div>
<div style="font-size:11px;line-height:1.6;">
  <p>This is to certify that <strong>{{NAME}}</strong> (Admission No: {{ROLL}}) was a student of this institution in the <strong>{{BRANCH}}</strong> department during the academic year <strong>{{ACADEMIC_YEAR}}</strong>.</p>
  <p>During his/her period of study, his/her <strong>conduct and character</strong> have been <strong>good and satisfactory</strong>. He/She has actively participated in the academic and extracurricular activities of the institution.</p>
  <p>He/She bears a good moral character and is a disciplined student of the institution.</p>
</div>
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;flex:1;">{{SIGNATORIES_HTML}}</div>
</div>
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ccc;font-size:8px;text-align:center;color:#999;">
  Verify at: <code style="font-size:7px;">{{qr_token}}</code>
</div>
{{#if QR_SRC}}
<div style="margin-top:8px;text-align:center;">
  <img src="{{QR_SRC}}" style="width:80px;height:80px;" alt="QR" />
</div>
{{/if}}
`;

export const GCT_STUDY_TEMPLATE = `
<div style="text-align:center;padding:10px 0 6px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">{{INSTITUTION_NAME}}</div>
  <div style="font-size:10px;color:#555;">{{INSTITUTION_PLACE}}</div>
  <div style="font-size:8px;color:#888;margin-top:2px;">{{INSTITUTION_AFFILIATION}}</div>
</div>
<hr style="border:none;border-top:2px solid {{ACCENT_COLOR}};margin:4px 0;" />
<div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;letter-spacing:3px;text-transform:uppercase;color:{{ACCENT_COLOR}};">Study Certificate</div>
<div style="text-align:right;font-size:9px;margin-bottom:8px;">
  No: {{NO}} &nbsp;&nbsp; Dated: {{DATED}}
</div>
<div style="font-size:11px;line-height:1.6;">
  <p>This is to certify that <strong>{{NAME}}</strong> (Admission No: {{ROLL}}) is a bonafide student of this institution pursuing <strong>{{BRANCH}}</strong> programme during the academic year <strong>{{ACADEMIC_YEAR}}</strong>.</p>
  <p>He/She is currently in <strong>{{YEAR}}</strong> and is regular in his/her studies. This certificate is issued for the purpose of <strong>{{APPLICATION_PURPOSE}}</strong>.</p>
</div>
{{#if AUTHORITY}}
<div style="font-size:10px;margin-top:6px;">
  <strong>To</strong><br/>{{AUTHORITY}}
</div>
{{/if}}
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;flex:1;">{{SIGNATORIES_HTML}}</div>
</div>
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ccc;font-size:8px;text-align:center;color:#999;">
  Verify at: <code style="font-size:7px;">{{qr_token}}</code>
</div>
{{#if QR_SRC}}
<div style="margin-top:8px;text-align:center;">
  <img src="{{QR_SRC}}" style="width:80px;height:80px;" alt="QR" />
</div>
{{/if}}
`;

export const GCT_CHARACTER_TEMPLATE = `
<div style="text-align:center;padding:10px 0 6px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">{{INSTITUTION_NAME}}</div>
  <div style="font-size:10px;color:#555;">{{INSTITUTION_PLACE}}</div>
  <div style="font-size:8px;color:#888;margin-top:2px;">{{INSTITUTION_AFFILIATION}}</div>
</div>
<hr style="border:none;border-top:2px solid {{ACCENT_COLOR}};margin:4px 0;" />
<div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;letter-spacing:3px;text-transform:uppercase;color:{{ACCENT_COLOR}};">Character Certificate</div>
<div style="text-align:right;font-size:9px;margin-bottom:8px;">
  No: {{NO}} &nbsp;&nbsp; Dated: {{DATED}}
</div>
<div style="font-size:11px;line-height:1.6;">
  <p>This is to certify that <strong>{{NAME}}</strong> (Admission No: {{ROLL}}) was a student of this institution in the <strong>{{BRANCH}}</strong> department from <strong>{{ACADEMIC_YEAR}}</strong>.</p>
  <p>We hereby certify that his/her <strong>character</strong> during the period of study in this institution has been <strong>exemplary</strong>. He/She is honest, sincere, and hardworking with a pleasing personality.</p>
  <p>He/She has not been involved in any disciplinary or misconduct issues during his/her tenure at this institution. We wish him/her all the best in future endeavors.</p>
</div>
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;flex:1;">{{SIGNATORIES_HTML}}</div>
</div>
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ccc;font-size:8px;text-align:center;color:#999;">
  Verify at: <code style="font-size:7px;">{{qr_token}}</code>
</div>
{{#if QR_SRC}}
<div style="margin-top:8px;text-align:center;">
  <img src="{{QR_SRC}}" style="width:80px;height:80px;" alt="QR" />
</div>
{{/if}}
`;

export const GCT_LEAVING_TEMPLATE = `
<div style="text-align:center;padding:10px 0 6px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">{{INSTITUTION_NAME}}</div>
  <div style="font-size:10px;color:#555;">{{INSTITUTION_PLACE}}</div>
  <div style="font-size:8px;color:#888;margin-top:2px;">{{INSTITUTION_AFFILIATION}}</div>
</div>
<hr style="border:none;border-top:2px solid {{ACCENT_COLOR}};margin:4px 0;" />
<div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;letter-spacing:3px;text-transform:uppercase;color:{{ACCENT_COLOR}};">Leaving Certificate</div>
<div style="text-align:right;font-size:9px;margin-bottom:8px;">
  LC No: {{NO}} &nbsp;&nbsp; Date: {{DATED}}
</div>
<table style="width:100%;font-size:10px;line-height:1.8;border-collapse:collapse;">
  <tr><td style="width:40%;font-weight:600;">Name of the Student</td><td>: <strong>{{NAME}}</strong></td></tr>
  <tr><td style="font-weight:600;">Admission Number</td><td>: {{ROLL}}</td></tr>
  <tr><td style="font-weight:600;">Branch / Course</td><td>: {{BRANCH}}</td></tr>
  <tr><td style="font-weight:600;">Year of Study</td><td>: {{YEAR}}</td></tr>
  <tr><td style="font-weight:600;">Leaving Date</td><td>: {{DATED}}</td></tr>
</table>
<div style="font-size:10px;line-height:1.6;margin-top:10px;">
  <p>This is to certify that the above-named student has <strong>left the institution</strong> and has been issued this Leaving Certificate.</p>
  <p>He/She has cleared all academic and financial obligations with the institution. No dues are pending from his/her side.</p>
</div>
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;flex:1;">{{SIGNATORIES_HTML}}</div>
</div>
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ccc;font-size:8px;text-align:center;color:#999;">
  Verify at: <code style="font-size:7px;">{{qr_token}}</code>
</div>
{{#if QR_SRC}}
<div style="margin-top:8px;text-align:center;">
  <img src="{{QR_SRC}}" style="width:80px;height:80px;" alt="QR" />
</div>
{{/if}}
`;

export const GCT_INTERNSHIP_TEMPLATE = `
<div style="text-align:center;padding:10px 0 6px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">{{INSTITUTION_NAME}}</div>
  <div style="font-size:10px;color:#555;">{{INSTITUTION_PLACE}}</div>
  <div style="font-size:8px;color:#888;margin-top:2px;">{{INSTITUTION_AFFILIATION}}</div>
</div>
<hr style="border:none;border-top:2px solid {{ACCENT_COLOR}};margin:4px 0;" />
<div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;letter-spacing:3px;text-transform:uppercase;color:{{ACCENT_COLOR}};">Internship Completion Certificate</div>
<div style="text-align:right;font-size:9px;margin-bottom:8px;">
  No: {{NO}} &nbsp;&nbsp; Date: {{DATED}}
</div>
<div style="font-size:11px;line-height:1.6;">
  <p>This is to certify that <strong>{{NAME}}</strong> (Admission No: {{ROLL}}), a student of <strong>{{BRANCH}}</strong> at this institution, has successfully completed his/her <strong>internship training</strong> at <strong>{{APPLICATION_PURPOSE}}</strong> during the academic year <strong>{{ACADEMIC_YEAR}}</strong>.</p>
  <p>During the internship period, he/she has demonstrated excellent technical skills, professionalism, and dedication. His/her performance was found to be <strong>satisfactory</strong>.</p>
</div>
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;flex:1;">{{SIGNATORIES_HTML}}</div>
</div>
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ccc;font-size:8px;text-align:center;color:#999;">
  Verify at: <code style="font-size:7px;">{{qr_token}}</code>
</div>
{{#if QR_SRC}}
<div style="margin-top:8px;text-align:center;">
  <img src="{{QR_SRC}}" style="width:80px;height:80px;" alt="QR" />
</div>
{{/if}}
`;

export const GCT_COURSE_COMPLETION_TEMPLATE = `
<div style="text-align:center;padding:10px 0 6px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">{{INSTITUTION_NAME}}</div>
  <div style="font-size:10px;color:#555;">{{INSTITUTION_PLACE}}</div>
  <div style="font-size:8px;color:#888;margin-top:2px;">{{INSTITUTION_AFFILIATION}}</div>
</div>
<hr style="border:none;border-top:2px solid {{ACCENT_COLOR}};margin:4px 0;" />
<div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;letter-spacing:3px;text-transform:uppercase;color:{{ACCENT_COLOR}};">Course Completion Certificate</div>
<div style="text-align:right;font-size:9px;margin-bottom:8px;">
  No: {{NO}} &nbsp;&nbsp; Date: {{DATED}}
</div>
<div style="font-size:11px;line-height:1.6;">
  <p>This is to certify that <strong>{{NAME}}</strong> (Admission No: {{ROLL}}) has successfully completed the <strong>{{BRANCH}}</strong> programme offered by this institution during the academic year <strong>{{ACADEMIC_YEAR}}</strong>.</p>
  <p>He/She has fulfilled all the academic requirements prescribed by the institution and the affiliating university. He/She has secured the following grade: <strong>{{grade}}</strong>.</p>
  <p>We wish him/her success in all future endeavors.</p>
</div>
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;flex:1;">{{SIGNATORIES_HTML}}</div>
</div>
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ccc;font-size:8px;text-align:center;color:#999;">
  Verify at: <code style="font-size:7px;">{{qr_token}}</code>
</div>
{{#if QR_SRC}}
<div style="margin-top:8px;text-align:center;">
  <img src="{{QR_SRC}}" style="width:80px;height:80px;" alt="QR" />
</div>
{{/if}}
`;

export const GCT_NO_DUES_TEMPLATE = `
<div style="text-align:center;padding:10px 0 6px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">{{INSTITUTION_NAME}}</div>
  <div style="font-size:10px;color:#555;">{{INSTITUTION_PLACE}}</div>
  <div style="font-size:8px;color:#888;margin-top:2px;">{{INSTITUTION_AFFILIATION}}</div>
</div>
<hr style="border:none;border-top:2px solid {{ACCENT_COLOR}};margin:4px 0;" />
<div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;letter-spacing:3px;text-transform:uppercase;color:{{ACCENT_COLOR}};">No Dues Certificate</div>
<div style="text-align:right;font-size:9px;margin-bottom:8px;">
  No: {{NO}} &nbsp;&nbsp; Date: {{DATED}}
</div>
<div style="font-size:11px;line-height:1.6;">
  <p>This is to certify that <strong>{{NAME}}</strong> (Admission No: {{ROLL}}), a student of <strong>{{BRANCH}}</strong>, has <strong>no dues pending</strong> with the following departments of this institution:</p>
  <ul style="font-size:10px;margin:6px 0 6px 20px;">
    <li>Library</li>
    <li>Laboratory</li>
    <li>Hostel / Accommodation</li>
    <li>Accounts / Finance</li>
    <li>Department Store / Bookshop</li>
    <li>Sports & Games</li>
  </ul>
  <p>All accounts have been settled and he/she is hereby cleared from all financial and administrative obligations.</p>
</div>
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;flex:1;">{{SIGNATORIES_HTML}}</div>
</div>
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ccc;font-size:8px;text-align:center;color:#999;">
  Verify at: <code style="font-size:7px;">{{qr_token}}</code>
</div>
{{#if QR_SRC}}
<div style="margin-top:8px;text-align:center;">
  <img src="{{QR_SRC}}" style="width:80px;height:80px;" alt="QR" />
</div>
{{/if}}
`;

export const GCT_PROVISIONAL_TEMPLATE = `
<div style="text-align:center;padding:10px 0 6px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">{{INSTITUTION_NAME}}</div>
  <div style="font-size:10px;color:#555;">{{INSTITUTION_PLACE}}</div>
  <div style="font-size:8px;color:#888;margin-top:2px;">{{INSTITUTION_AFFILIATION}}</div>
</div>
<hr style="border:none;border-top:2px solid {{ACCENT_COLOR}};margin:4px 0;" />
<div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;letter-spacing:3px;text-transform:uppercase;color:{{ACCENT_COLOR}};">Provisional Certificate</div>
<div style="text-align:right;font-size:9px;margin-bottom:8px;">
  No: {{NO}} &nbsp;&nbsp; Date: {{DATED}}
</div>
<div style="font-size:11px;line-height:1.6;">
  <p>This is to certify that <strong>{{NAME}}</strong> (Admission No: {{ROLL}}) has successfully completed the <strong>{{BRANCH}}</strong> programme in the academic year <strong>{{ACADEMIC_YEAR}}</strong> and has passed all the examinations prescribed by the university.</p>
  <p>He/She is provisionally awarded the degree until the official degree certificate is issued by the university. The <strong>grade</strong> secured is: <strong>{{grade}}</strong>.</p>
  <p>This provisional certificate is issued for the purpose of <strong>{{APPLICATION_PURPOSE}}</strong>.</p>
</div>
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;flex:1;">{{SIGNATORIES_HTML}}</div>
</div>
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ccc;font-size:8px;text-align:center;color:#999;">
  Verify at: <code style="font-size:7px;">{{qr_token}}</code>
</div>
{{#if QR_SRC}}
<div style="margin-top:8px;text-align:center;">
  <img src="{{QR_SRC}}" style="width:80px;height:80px;" alt="QR" />
</div>
{{/if}}
`;

export const GCT_PROFICIENCY_TEMPLATE = `
<div style="text-align:center;padding:10px 0 6px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">{{INSTITUTION_NAME}}</div>
  <div style="font-size:10px;color:#555;">{{INSTITUTION_PLACE}}</div>
  <div style="font-size:8px;color:#888;margin-top:2px;">{{INSTITUTION_AFFILIATION}}</div>
</div>
<hr style="border:none;border-top:2px solid {{ACCENT_COLOR}};margin:4px 0;" />
<div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;letter-spacing:3px;text-transform:uppercase;color:{{ACCENT_COLOR}};">Proficiency Certificate</div>
<div style="text-align:right;font-size:9px;margin-bottom:8px;">
  No: {{NO}} &nbsp;&nbsp; Date: {{DATED}}
</div>
<div style="font-size:11px;line-height:1.6;">
  <p>This is to certify that <strong>{{NAME}}</strong> (Admission No: {{ROLL}}), a student of <strong>{{BRANCH}}</strong>, has demonstrated <strong>outstanding proficiency</strong> in <strong>{{APPLICATION_PURPOSE}}</strong> during the academic year <strong>{{ACADEMIC_YEAR}}</strong>.</p>
  <p>His/Her performance has been exceptional and he/she has been awarded this Proficiency Certificate in recognition of his/her meritorious achievement.</p>
</div>
<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="text-align:center;flex:1;">{{SIGNATORIES_HTML}}</div>
</div>
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ccc;font-size:8px;text-align:center;color:#999;">
  Verify at: <code style="font-size:7px;">{{qr_token}}</code>
</div>
{{#if QR_SRC}}
<div style="margin-top:8px;text-align:center;">
  <img src="{{QR_SRC}}" style="width:80px;height:80px;" alt="QR" />
</div>
{{/if}}
`;

export const DEFAULT_TEMPLATES: Array<{ code: string; name: string; body: string }> = [
  { code: "BONAFIDE", name: "Bonafide Certificate", body: GCT_BONAFIDE_TEMPLATE },
  { code: "TRANSFER", name: "Transfer Certificate (TC)", body: GCT_TRANSFER_TEMPLATE },
  { code: "CONDUCT", name: "Conduct Certificate", body: GCT_CONDUCT_TEMPLATE },
  { code: "STUDY", name: "Study Certificate", body: GCT_STUDY_TEMPLATE },
  { code: "CHARACTER", name: "Character Certificate", body: GCT_CHARACTER_TEMPLATE },
  { code: "LEAVING", name: "Leaving Certificate", body: GCT_LEAVING_TEMPLATE },
  { code: "INTERNSHIP", name: "Internship Completion Certificate", body: GCT_INTERNSHIP_TEMPLATE },
  { code: "COURSE_COMPLETION", name: "Course Completion Certificate", body: GCT_COURSE_COMPLETION_TEMPLATE },
  { code: "NO_DUES", name: "No Dues Certificate", body: GCT_NO_DUES_TEMPLATE },
  { code: "PROVISIONAL", name: "Provisional Certificate", body: GCT_PROVISIONAL_TEMPLATE },
  { code: "PROFICIENCY", name: "Proficiency Certificate", body: GCT_PROFICIENCY_TEMPLATE },
];

// ════════════════════════════════════════════════════════════
// PRINT / EXPORT HELPERS
// ════════════════════════════════════════════════════════════

export function applyPrintStyles(document: Document) {
  const style = document.createElement('style');
  style.textContent = CERTIFICATE_PRINT_CSS;
  document.head.appendChild(style);
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
  setTimeout(() => { win.print(); }, 300);
}

// ════════════════════════════════════════════════════════════
// DATA HELPERS
// ════════════════════════════════════════════════════════════

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
  const base: CertificateData = {
    student_name: request.student_name ?? "",
    admission_no: request.admission_no ?? "",
    template_name: request.template_name ?? "",
    template_code: request.template_code ?? "",
    purpose: request.purpose ?? undefined,
    issued_at: request.issued_at ? new Date(request.issued_at).toLocaleDateString() : undefined,
    qr_token: request.qr_token ?? undefined,
    qr_token_short: (request.qr_token ?? "").slice(0, 16),
  };

  const forwarded: Record<string, string | undefined> = {};
  for (const key of Object.keys(request)) {
    if (!(key in base) && key !== 'qr_token_short') {
      forwarded[key] = request[key] != null ? String(request[key]) : undefined;
    }
  }

  return { ...base, ...forwarded } as CertificateData;
}
