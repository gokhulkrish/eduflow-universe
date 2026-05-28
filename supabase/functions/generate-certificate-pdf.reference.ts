// Follow this structure to deploy at supabase/functions/generate-certificate-pdf/index.ts
// This is a reference implementation for Supabase Edge Functions

/**
 * Supabase Edge Function for server-side certificate PDF generation
 * Deploy with: supabase functions deploy generate-certificate-pdf
 * 
 * This function:
 * 1. Receives certificate data and template HTML
 * 2. Renders HTML to PDF via Deno + puppeteer or pdf-lib
 * 3. Optionally signs the PDF (add signature layer)
 * 4. Stores in Supabase Storage
 * 5. Returns public URL and storage reference
 */

// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { PDFDocument, rgb } from "npm:pdf-lib";

// const CERTIFICATES_BUCKET = "certificates-pdfs";
// const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
// const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// interface CertificateRequest {
//   requestId: string;
//   studentId: string;
//   studentName: string;
//   admissionNo: string;
//   templateName: string;
//   templateCode: string;
//   templateHtml: string;
//   purpose?: string;
//   qrToken: string;
//   issuedAt?: string;
// }

// serve(async (req: Request) => {
//   if (req.method !== "POST") {
//     return new Response("Method not allowed", { status: 405 });
//   }

//   try {
//     const payload: CertificateRequest = await req.json();

//     // 1. Render HTML to PDF
//     const pdfBytes = await renderHtmlToPdf(payload.templateHtml);

//     // 2. Optionally sign the PDF
//     const signedPdfBytes = await signPdf(pdfBytes, {
//       name: "Authorized Signatory",
//       role: "Principal",
//     });

//     // 3. Upload to Supabase Storage
//     const storageKey = `student-${payload.studentId}/certificate-${payload.requestId}.pdf`;
//     const { error: uploadError } = await uploadPdfToStorage(
//       storageKey,
//       signedPdfBytes
//     );

//     if (uploadError) {
//       throw new Error(`Upload failed: ${uploadError.message}`);
//     }

//     // 4. Return public URL
//     const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${CERTIFICATES_BUCKET}/${storageKey}`;

//     return new Response(
//       JSON.stringify({
//         success: true,
//         pdfUrl: publicUrl,
//         pdfPath: storageKey,
//         storageKey,
//       }),
//       {
//         headers: { "Content-Type": "application/json" },
//         status: 200,
//       }
//     );
//   } catch (error) {
//     return new Response(
//       JSON.stringify({
//         success: false,
//         error: error.message,
//       }),
//       {
//         headers: { "Content-Type": "application/json" },
//         status: 500,
//       }
//     );
//   }
// });

// async function renderHtmlToPdf(htmlContent: string): Promise<Uint8Array> {
//   // Use puppeteer (headless Chrome) or similar
//   // For now, this is a placeholder
//   // In production, use: https://deno.land/x/puppeteer or similar
//   throw new Error("PDF rendering not yet implemented - use client-side fallback");
// }

// async function signPdf(
//   pdfBytes: Uint8Array,
//   signatureInfo: { name: string; role: string }
// ): Promise<Uint8Array> {
//   // Optional: Add digital signature to PDF
//   // This requires certificate infrastructure
//   // For now, just return the unsigned PDF
//   return pdfBytes;
// }

// async function uploadPdfToStorage(
//   storageKey: string,
//   pdfBytes: Uint8Array
// ): Promise<{ error?: Error }> {
//   // Upload to Supabase Storage via REST API
//   const formData = new FormData();
//   formData.append("file", new Blob([pdfBytes], { type: "application/pdf" }));

//   const response = await fetch(
//     `${SUPABASE_URL}/storage/v1/object/${CERTIFICATES_BUCKET}/${storageKey}`,
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${SUPABASE_KEY}`,
//       },
//       body: formData,
//     }
//   );

//   if (!response.ok) {
//     const error = await response.json();
//     return { error };
//   }

//   return { error: undefined };
// }

// Export this comment block for documentation:
export const EDGE_FUNCTION_README = `
# Certificate PDF Generation - Edge Function Setup

## Deployment Steps

1. Create the function file:
   \`\`\`bash
   supabase functions new generate-certificate-pdf
   \`\`\`

2. Copy the implementation to \`supabase/functions/generate-certificate-pdf/index.ts\`

3. Set environment variables in \`.env.local\`:
   \`\`\`
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   \`\`\`

4. Deploy:
   \`\`\`bash
   supabase functions deploy generate-certificate-pdf
   \`\`\`

## Alternative: Use Third-party PDF Service

If server-side PDF generation is complex, consider:
- **html2pdf.com API** - Simple HTML to PDF
- **PDFMonkey** - Template-based PDF generation
- **WeasyPrint** (Python) - Advanced HTML/CSS rendering
- **Playwright** (Deno) - Screenshot-based PDF

## Current Recommendation

For MVP, use the **client-side html2canvas + jsPDF** approach in Certificates.tsx.
Migrate to server-side PDF generation when:
- Bulk generation is needed
- PDF signing/watermarking is required
- Storage/archival of PDFs is critical
`;
