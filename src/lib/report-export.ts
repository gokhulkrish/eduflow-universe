import { toast } from "sonner";
import { downloadFile, toCsv } from "@/lib/reports";

export async function exportToPdf(
  elementId: string,
  filename: string,
): Promise<void> {
  const node = document.getElementById(elementId);
  if (!node) {
    toast.error("Report content not found");
    return;
  }
  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    let remainingHeight = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (remainingHeight <= pageHeight) {
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
    } else {
      const totalPages = Math.ceil(pdfHeight / pageHeight);
      for (let i = 0; i < totalPages; i++) {
        const sourceY = (pageHeight / pdfHeight) * canvas.height * i;
        const sourceHeight = Math.min(
          (pageHeight / pdfHeight) * canvas.height,
          canvas.height - sourceY,
        );
        const canvasPage = document.createElement("canvas");
        canvasPage.width = canvas.width;
        canvasPage.height = (sourceHeight * canvas.width) / pdfWidth;
        const ctx = canvasPage.getContext("2d")!;
        ctx.drawImage(
          canvas, 0, sourceY, canvas.width, sourceHeight,
          0, 0, canvasPage.width, canvasPage.height,
        );
        const pageImgData = canvasPage.toDataURL("image/png");
        if (i > 0) pdf.addPage();
        pdf.addImage(pageImgData, "PNG", 0, 0, pdfWidth, pdfHeight / totalPages);
        canvasPage.remove();
      }
    }
    pdf.save(`${filename}.pdf`);
    toast.success(`${filename}.pdf downloaded`);
  } catch {
    toast.error("PDF generation failed");
  }
}

export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: string; label: string }[],
): Promise<void> {
  if (data.length === 0) {
    toast.error("No data to export");
    return;
  }
  try {
    const XLSX = await import("xlsx");
    const rows = columns
      ? data.map((item) => {
          const row: Record<string, unknown> = {};
          columns.forEach((col) => { row[col.label] = item[col.key] ?? ""; });
          return row;
        })
      : data;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadFileArrayBuffer(wbout, `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    toast.success(`${filename}.xlsx downloaded`);
  } catch {
    toast.error("Excel export failed");
  }
}

function downloadFileArrayBuffer(data: ArrayBuffer, filename: string, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCsvWithColumns<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: string; label: string }[],
) {
  const rows = columns
    ? data.map((item) => {
        const row: Record<string, unknown> = {};
        columns.forEach((col) => { row[col.label] = item[col.key] ?? ""; });
        return row;
      })
    : data;
  downloadFile(toCsv(rows), `${filename}.csv`, "text/csv");
  toast.success(`${filename}.csv downloaded`);
}

export function exportToJson<T>(data: T[], filename: string) {
  downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, "application/json");
  toast.success(`${filename}.json downloaded`);
}
