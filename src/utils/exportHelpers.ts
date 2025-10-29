import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface LeadExport {
  nome: string;
  telefone: string;
}

export const exportToExcel = (leads: LeadExport[], filename: string) => {
  // Preparar dados (apenas nome e telefone)
  const data = leads.map(lead => ({
    Nome: lead.nome,
    Telefone: lead.telefone
  }));
  
  // Criar workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Repiques');
  
  // Ajustar largura das colunas
  ws['!cols'] = [
    { wch: 30 }, // Nome
    { wch: 20 }  // Telefone
  ];
  
  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (leads: LeadExport[], filename: string, companyName: string) => {
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFontSize(18);
  doc.text(companyName, 14, 20);
  doc.setFontSize(12);
  doc.text('Repiques - Exportação de Leads', 14, 28);
  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34);
  doc.text(`Total de leads: ${leads.length}`, 14, 40);
  
  // Tabela
  autoTable(doc, {
    startY: 45,
    head: [['Nome', 'Telefone']],
    body: leads.map(lead => [lead.nome, lead.telefone]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] }, // Azul primário
    margin: { top: 45 }
  });
  
  // Download
  doc.save(`${filename}.pdf`);
};
