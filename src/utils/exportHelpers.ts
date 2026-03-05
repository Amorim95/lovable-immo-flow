import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface LeadExport {
  nome: string;
  telefone: string;
  created_at: string;
  stage_name?: string;
  renda?: number | null;
}

export const exportToExcel = (leads: LeadExport[], filename: string) => {
  // Preparar dados com todos os campos
  const data = leads.map(lead => ({
    Nome: lead.nome,
    Telefone: lead.telefone,
    'Data de Criação': new Date(lead.created_at).toLocaleString('pt-BR'),
    Etapa: lead.stage_name || 'Sem etapa',
    Renda: lead.renda != null ? `R$ ${lead.renda.toLocaleString('pt-BR')}` : 'Não informada'
  }));
  
  // Criar workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Repiques');
  
  // Ajustar largura das colunas
  ws['!cols'] = [
    { wch: 30 }, // Nome
    { wch: 20 }, // Telefone
    { wch: 18 }, // Data de Criação
    { wch: 20 }, // Etapa
    { wch: 18 }  // Renda
  ];
  
  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = async (leads: LeadExport[], filename: string, companyName: string, logoUrl?: string) => {
  const doc = new jsPDF();
  
  let startY = 20;

  // Tentar carregar logo
  if (logoUrl) {
    try {
      const img = await loadImage(logoUrl);
      doc.addImage(img, 'PNG', 14, 10, 20, 20);
      startY = 18;
      doc.setFontSize(18);
      doc.text(companyName, 38, startY);
      doc.setFontSize(12);
      doc.text(`Perfil de Cliente / ${filterLabel}`, 38, startY + 8);
      doc.setFontSize(10);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 38, startY + 15);
      startY = startY + 22;
    } catch {
      doc.setFontSize(18);
      doc.text(companyName, 14, startY);
      doc.setFontSize(12);
      doc.text(`Perfil de Cliente / ${filterLabel}`, 14, startY + 8);
      doc.setFontSize(10);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, startY + 15);
      startY = startY + 22;
    }
  } else {
    doc.setFontSize(18);
    doc.text(companyName, 14, startY);
    doc.setFontSize(12);
    doc.text(`Perfil de Cliente / ${filterLabel}`, 14, startY + 8);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, startY + 15);
    startY = startY + 22;
  }

  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, startY);
  doc.text(`Total de leads: ${leads.length}`, 14, startY + 6);
  
  // Tabela
  autoTable(doc, {
    startY: startY + 10,
    head: [['Nome', 'Telefone', 'Data de Criação', 'Etapa', 'Renda']],
    body: leads.map(lead => [
      lead.nome, 
      lead.telefone,
      new Date(lead.created_at).toLocaleString('pt-BR'),
      lead.stage_name || 'Sem etapa',
      lead.renda != null ? `R$ ${lead.renda.toLocaleString('pt-BR')}` : 'Não informada'
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
    margin: { top: startY + 10 }
  });
  
  // Download
  doc.save(`${filename}.pdf`);
};

function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('no ctx');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}
