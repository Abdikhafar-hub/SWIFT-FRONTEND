import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Downloads a DOM element as a high-resolution A4 portrait PDF document.
 */
export async function downloadElementAsPdf(
  elementId: string,
  filename: string = "Invoice.pdf"
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`PDF Generation Error: Element with ID #${elementId} not found.`);
    return false;
  }

  try {
    // Clone or capture element with html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution crisp text and graphics
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL("image/png");
    
    // Create A4 PDF (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add subsequent pages if content overflows 1 A4 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (error) {
    console.error("Failed to generate PDF document:", error);
    return false;
  }
}

/**
 * Triggers standard browser window printing with @media print CSS optimization.
 */
export function printInvoiceDocument(): void {
  if (typeof window !== "undefined") {
    window.print();
  }
}
