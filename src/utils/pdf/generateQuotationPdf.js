import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateQuotationPdf(element, quotationNumber) {
  if (!element) throw new Error('Quotation preview is not available.');
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });
  const img = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(img, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(img, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  pdf.save(`MK-Quotation-${quotationNumber}.pdf`);
}
