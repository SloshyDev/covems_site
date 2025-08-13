import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function printMovimientosPDF(movimientos) {
  // Calcular el total
  const total = movimientos.reduce((sum, m) => sum + parseFloat(m.importe), 0);
  const doc = new jsPDF({ orientation: "landscape" });
  const columns = ["Empresa", "Fecha", "Concepto", "Tipo", "Importe", "Banco", "Estatus"];
  const rowsData = movimientos.map(m => [
    m.empresa,
    m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX') : '',
    m.subconcepto
      ? { content: m.concepto + '\n' + m.subconcepto }
      : m.concepto,
    m.tipoMovimiento,
    `$${parseFloat(m.importe).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    m.banco,
    m.estatus
  ]);
  // Título centrado
  doc.setFontSize(18);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text("MOVIMIENTOS", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(12);
  try {
        const logoBase64 = 'data:image/png;base64,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'; // Reemplaza con tu logo en base64
      doc.addImage(logoBase64, 'PNG', 20, 10, 45, 20);
      } catch (error) {
        // Fallback: si hay error con la imagen, usar el círculo azul
        doc.setFillColor(65, 105, 225); // Azul del logo
        doc.circle(35, 20, 15, 'F'); // Círculo azul simulando el logo
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('COVEMS', 30, 22);
        doc.text('S.C.', 32, 25);
      }
  const fechaActual = new Date().toLocaleString();
  doc.text(`Impreso: ${fechaActual}`, pageWidth / 2, 30, { align: "center" });
  autoTable(doc, {
    head: [columns],
    body: rowsData,
    startY: 40,
    styles: {
      fontSize: 8,
      minCellHeight: 12,
      cellPadding: 3
    },
    headStyles: {
      fontSize: 9,
      fillColor: [52, 152, 219]
    },
    columnStyles: {
      0: { valign: 'middle' },
      1: { valign: 'middle' },
      4: { valign: 'middle' },
      5: { valign: 'middle' },
      7: { valign: 'middle' },
      3: { valign: 'middle' },
      2: {
        cellWidth: 70,
        valign: 'top'
      },
      6: {
        cellWidth: 25,
        valign: 'middle'
      }
    },
    willDrawCell: function(data) {
      if (data.column.index === 2 && typeof data.cell.raw === 'object' && data.cell.raw.content) {
        const lines = data.cell.raw.content.split('\n');
        if (lines.length > 1) {
          data.cell.text = [lines[0]];
        }
      }
    },
    didDrawCell: function (data) {
      if (data.column.index === 2 && typeof data.cell.raw === 'object' && data.cell.raw.content) {
        const lines = data.cell.raw.content.split('\n');
        if (lines.length > 1) {
          doc.setFontSize(6);
          doc.setTextColor(100);
          doc.text(lines[1], data.cell.x + 3, data.cell.y + 10);
          doc.setFontSize(8);
          doc.setTextColor(0);
        }
      }
    }
  });

  // Apartado para total y firma de autorización
  const finalY = doc.lastAutoTable.finalY || 100;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 60, finalY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('FIRMA DE AUTORIZACIÓN:', 30, finalY + 40);
  doc.line(30, finalY + 50, 120, finalY + 50); // Línea para la firma
  doc.save("movimientos_seleccionados.pdf");
}

export default function MovimientosPrintCheckbox({ checked, onChange }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 accent-blue-600 cursor-pointer"
      title="Seleccionar para imprimir"
    />
  );
}
