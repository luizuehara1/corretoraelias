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

/**
 * Converte uma URL de imagem para Base64 de forma robusta
 */
const getBase64ImageFromUrl = async (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      } else {
        resolve(null);
      }
    };
    
    img.onerror = () => {
      console.error('Error loading image for PDF catalog:', url);
      resolve(null);
    };
    
    // Se for uma URL do Unsplash, garantir que ela tenha parâmetros que ajudem no redimensionamento para economizar memória no PDF
    let finalUrl = url;
    if (url.includes('unsplash.com')) {
      if (url.includes('?')) {
        finalUrl = `${url}&auto=format&fit=crop&w=400&q=80`;
      } else {
        finalUrl = `${url}?auto=format&fit=crop&w=400&q=80`;
      }
    }
    
    img.src = finalUrl;
  });
};

/**
 * Gera um catálogo PDF completo com todos os imóveis com fotos
 */
export const generateFullCatalogPDF = async (properties: any[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Cores do Tema
  const orange = [255, 92, 0];
  const dark = [15, 23, 42];
  const gray = [100, 116, 139];
  const lightGray = [241, 245, 249];

  // Função para desenhar o cabeçalho
  const drawHeader = (pageNum: number) => {
    // Retângulo superior
    pdf.setFillColor(dark[0], dark[1], dark[2]);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo Texto
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('RB', margin, 18);
    
    pdf.setTextColor(orange[0], orange[1], orange[2]);
    pdf.text('SOROCABA', margin + 12, 18);
    
    pdf.setFontSize(9);
    pdf.setTextColor(200, 200, 200);
    pdf.setFont('helvetica', 'normal');
    pdf.text('NEGÓCIOS IMOBILIÁRIOS - CATÁLOGO EXCLUSIVO', margin, 26);
    
    // Data e Página
    const date = new Date().toLocaleDateString('pt-BR');
    pdf.setFontSize(8);
    pdf.text(`Gerado em: ${date}`, pageWidth - margin - 35, 26);
    pdf.text(`Página ${pageNum}`, pageWidth - margin - 15, 18);
  };

  // Página de Capa
  pdf.setFillColor(dark[0], dark[1], dark[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(orange[0], orange[1], orange[2]);
  pdf.setFontSize(40);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CATÁLOGO', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(50);
  pdf.text('IMOBILIÁRIO', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(150, 150, 150);
  pdf.text('A seleção mais exclusiva de imóveis em Sorocaba e Região', pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });
  
  pdf.setDrawColor(orange[0], orange[1], orange[2]);
  pdf.setLineWidth(1);
  pdf.line(pageWidth / 2 - 30, pageHeight / 2 + 35, pageWidth / 2 + 30, pageHeight / 2 + 35);

  let currentY = 45;
  let pageCount = 1;

  // Listar Imóveis
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const cardHeight = 65;
    
    // Se não houver espaço suficiente para mais um imóvel, cria nova página
    if (currentY + cardHeight + 10 > pageHeight - margin) {
      pdf.addPage();
      pageCount++;
      drawHeader(pageCount);
      currentY = 45;
    } else if (i === 0) {
      // Primeira página de imóveis (após a capa)
      pdf.addPage();
      pageCount++;
      drawHeader(pageCount);
      currentY = 45;
    }

    // Fundo para o card do imóvel
    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, 'F');
    
    // Área da Imagem (Esquerda)
    const imgX = margin + 5;
    const imgY = currentY + 5;
    const imgW = 60;
    const imgH = 45;
    
    // Placeholder Cinza para Imagem
    pdf.setFillColor(220, 220, 220);
    pdf.roundedRect(imgX, imgY, imgW, imgH, 2, 2, 'F');
    
    // Carregar e Adicionar Imagem Real
    if (prop.images && prop.images.length > 0) {
      const base64Img = await getBase64ImageFromUrl(prop.images[0]);
      if (base64Img) {
        try {
          // Detectar formato da imagem (geralmente PNG ou JPEG de URL do Firebase/Unsplash)
          pdf.addImage(base64Img, 'JPEG', imgX, imgY, imgW, imgH, undefined, 'FAST');
        } catch (e) {
          console.warn('Could not add image to PDF', e);
        }
      }
    }

    // Conteúdo (Direita)
    const textX = imgX + imgW + 5;
    const textWidth = contentWidth - imgW - 15;
    
    // Título do Imóvel
    pdf.setTextColor(dark[0], dark[1], dark[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    const titleLines = pdf.splitTextToSize(prop.title.toUpperCase(), textWidth);
    pdf.text(titleLines[0], textX, currentY + 10);
    
    // Preço
    pdf.setTextColor(orange[0], orange[1], orange[2]);
    pdf.setFontSize(14);
    pdf.text(prop.price, textX + textWidth, currentY + 10, { align: 'right' });
    
    // Localização
    pdf.setTextColor(gray[0], gray[1], gray[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${prop.neighborhood}, ${prop.city}`, textX, currentY + 16);
    if (prop.condominium) {
      pdf.setFontSize(8);
      pdf.text(`Cond: ${prop.condominium}`, textX, currentY + 20);
    }
    
    // Características Principal
    pdf.setTextColor(dark[0], dark[1], dark[2]);
    pdf.setFont('helvetica', 'bold');
    const features = [];
    if (prop.beds) features.push(`${prop.beds} qtos`);
    if (prop.suites) features.push(`${prop.suites} suítes`);
    if (prop.area) features.push(`${prop.area}`);
    if (prop.parkingCovered || prop.parkingUncovered) features.push(`${(prop.parkingCovered || 0) + (prop.parkingUncovered || 0)} vagas`);
    
    pdf.setFontSize(9);
    pdf.text(features.join(' • '), textX, currentY + 28);
    
    // Descrição
    pdf.setTextColor(gray[0], gray[1], gray[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const descText = prop.description || '';
    const splitDesc = pdf.splitTextToSize(descText, textWidth);
    const descLines = splitDesc.slice(0, 3);
    pdf.text(descLines, textX, currentY + 34);
    
    // Selo de Verificado / Site
    pdf.setFillColor(dark[0], dark[1], dark[2]);
    pdf.roundedRect(textX, currentY + 54, 30, 6, 1, 1, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.text('DETALHES NO SITE', textX + 15, currentY + 58, { align: 'center' });
    
    currentY += cardHeight + 5;
  }

  // Finalizar e salvar
  pdf.save('Catalogo_RB_Sorocaba_Completo.pdf');
};

