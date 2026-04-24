import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const exportReportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // html2canvas fails on oklch() colors which are standard in Tailwind v4
        // We must strip them before the internal parser runs
        const allElements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          
          // Force standard colors for common brand elements if they use oklch/oklab
          if (el.classList.contains('text-brand-orange')) el.style.setProperty('color', '#FF5C00', 'important');
          if (el.classList.contains('bg-brand-orange')) el.style.setProperty('background-color', '#FF5C00', 'important');
          if (el.classList.contains('text-brand-dark')) el.style.setProperty('color', '#0F172A', 'important');
          if (el.classList.contains('bg-brand-dark')) el.style.setProperty('background-color', '#0F172A', 'important');
          
          // Remove any CSS variables and computed styles that might contain oklch/oklab which confuse the library
          // This is a common issue with Tailwind CSS v4 in html2canvas
          const styles = window.getComputedStyle(el);
          const hasUnsupportedColor = (val: string) => val.includes('oklch') || val.includes('oklab');
          
          if (hasUnsupportedColor(styles.color)) el.style.color = '#333333';
          if (hasUnsupportedColor(styles.backgroundColor)) {
             // If it's a known background with oklab/oklch, fallback to something safe
             if (el.classList.contains('bg-slate-50')) el.style.backgroundColor = '#F8FAFC';
             else if (el.classList.contains('bg-green-50')) el.style.backgroundColor = '#F0FDF4';
             else if (el.classList.contains('bg-orange-50')) el.style.backgroundColor = '#FFF7ED';
             else if (el.classList.contains('bg-slate-900')) el.style.backgroundColor = '#0F172A';
             else el.style.backgroundColor = 'transparent';
          }
          if (hasUnsupportedColor(styles.borderColor)) el.style.borderColor = '#e2e8f0';
        }
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};
