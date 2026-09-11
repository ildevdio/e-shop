export interface ExportSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string }[];
}

export interface ExportSheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

const BRAND = 'Multigrãos';

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportPdf(sections: ExportSection[], fileName: string) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(BRAND, 40, 44);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const gerado = `Gerado em ${new Date().toLocaleString('pt-BR')}`;
  doc.text(gerado, pageW - 40 - doc.getTextWidth(gerado), 44);

  sections.forEach((sec, idx) => {
    if (idx > 0) doc.addPage();

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(sec.title, 40, 86);

    autoTable(doc, {
      startY: 100,
      head: [sec.headers],
      body: sec.rows.map(r => r.map(String)),
      headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 40, right: 40 },
    });

    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0;
    if (sec.summary && sec.summary.length > 0) {
      let y = finalY + 18;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo', 40, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      for (const s of sec.summary) {
        doc.text(s.label, 40, y);
        doc.text(s.value, pageW - 40 - doc.getTextWidth(s.value), y);
        y += 14;
      }
    }
  });

  doc.save(fileName);
}

export async function exportXlsx(sheets: ExportSheet[], fileName: string) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows.map(r => r.map(c => (typeof c === 'number' ? c : String(c))))]);
    ws['!cols'] = sheet.headers.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  download(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
}
