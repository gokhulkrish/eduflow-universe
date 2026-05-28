/**
 * Server-side Certificate PDF Generation
 * 
 * Service for generating, signing, and storing certificate PDFs server-side
 * via Supabase Edge Functions or API routes.
 */

import { supabase } from "./supabase";

export interface PdfGenerationRequest {
  requestId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  templateName: string;
  templateCode: string;
  templateHtml: string;
  purpose?: string;
  qrToken: string;
  issuedAt?: string;
}

export interface PdfGenerationResponse {
  success: boolean;
  pdfUrl?: string;
  pdfPath?: string;
  storageKey?: string;
  error?: string;
  message?: string;
}

const CERTIFICATES_BUCKET = "certificates-pdfs";
const PDF_GENERATION_ENDPOINT = "/api/certificates/generate-pdf";

/**
 * Generate PDF via client-side html2canvas + jsPDF (fallback)
 */
export async function generatePdfClientSide(
  htmlElement: HTMLElement,
  filename: string
): Promise<{ success: boolean; message: string }> {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(htmlElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = (pdf as any).getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);

    return { success: true, message: "PDF downloaded successfully" };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message ?? "Failed to generate PDF",
    };
  }
}

/**
 * Generate PDF server-side via Edge Function
 * Provides better performance, signing, and long-term storage
 */
export async function generatePdfServerSide(
  request: PdfGenerationRequest
): Promise<PdfGenerationResponse> {
  try {
    // Call Edge Function to generate PDF
    const { data, error } = await supabase.functions.invoke(
      "generate-certificate-pdf",
      {
        body: request,
      }
    );

    if (error) {
      return {
        success: false,
        error: error.message || "Server PDF generation failed",
      };
    }

    // data should contain { pdfUrl, pdfPath, storageKey }
    return {
      success: true,
      pdfUrl: data?.pdfUrl,
      pdfPath: data?.pdfPath,
      storageKey: data?.storageKey,
      message: "PDF generated successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message ?? "Unknown error during PDF generation",
    };
  }
}

/**
 * Retrieve stored PDF from Supabase Storage
 */
export async function retrieveStoredPdf(
  storageKey: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data } = supabase.storage
      .from(CERTIFICATES_BUCKET)
      .getPublicUrl(storageKey);

    if (!data) {
      return { success: false, error: "Unable to retrieve PDF URL" };
    }

    return { success: true, url: data.publicUrl };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message ?? "Failed to retrieve PDF",
    };
  }
}

/**
 * List all PDFs for a student
 */
export async function listStudentCertificatePdfs(
  studentId: string
): Promise<{ success: boolean; pdfs?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(CERTIFICATES_BUCKET)
      .list(`student-${studentId}/`, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URLs for each file
    const pdfs = (data || [])
      .filter((f) => f.name.endsWith(".pdf"))
      .map((f) => ({
        name: f.name,
        createdAt: f.created_at,
        url: supabase.storage
          .from(CERTIFICATES_BUCKET)
          .getPublicUrl(`student-${studentId}/${f.name}`).data.publicUrl,
      }));

    return { success: true, pdfs };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message ?? "Failed to list PDFs",
    };
  }
}

/**
 * Delete a stored PDF
 */
export async function deleteStoredPdf(
  storageKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(CERTIFICATES_BUCKET)
      .remove([storageKey]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message ?? "Failed to delete PDF",
    };
  }
}

/**
 * Stream PDF directly without saving (useful for immediate download)
 */
export async function streamPdfForDownload(
  request: PdfGenerationRequest,
  onDownload?: (filename: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(PDF_GENERATION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return { success: false, error: "PDF generation failed" };
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${request.requestId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    onDownload?.(a.download);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message ?? "Failed to stream PDF",
    };
  }
}
