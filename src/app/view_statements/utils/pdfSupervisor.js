import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { logoBase64, nombreEmpresa, meses } from './constants.js';

export async function descargarSupervisorPDF({ supervisor, claveSupervisor, data, usuarios, tipo = "supervisor", nombreAgente = "", fechaInicio = "", fechaFin = "", datosUsuario = null }) {
  const doc = new jsPDF({ orientation: "landscape" });


  // Logo y encabezado institucional
  // Logo: x=10, y=8, ancho=28, alto=14 aprox
  try {
    doc.addImage(logoBase64, 'PNG', 10, 8, 45, 20);
  } catch (e) {
    // Si falla el logo, no pasa nada
  }

  // Nombre de la empresa (centrado)
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(nombreEmpresa, 148, 18, { align: 'center' });
  doc.setFont(undefined, 'normal');

  // Subtítulo de tipo de PDF (centrado, debajo)
  doc.setFontSize(12);
  let subtitulo = '';
  if (tipo === "agente") {
    subtitulo = 'RELACION DE POLIZAS ACREDITADAS AL AGENTE';
  } else {
    subtitulo = 'RELACION DE POLIZAS ACREDITADAS AL SUPERVISOR';
  }
  doc.text(subtitulo, 148, 26, { align: 'center' });


  // Nombre del agente/supervisor (centrado, debajo)
  doc.setFontSize(11);
  let nombrePersona = '';
  if (tipo === "agente") {
    nombrePersona = nombreAgente || '';
  } else {
    nombrePersona = supervisor?.nombre || '';
  }
  let yDespuesEncabezado = 33;
  if (nombrePersona) {
    doc.text(nombrePersona, 148, yDespuesEncabezado, { align: 'center' });
    yDespuesEncabezado += 10; // Más espacio después del nombre
  } else {
    yDespuesEncabezado += 5; // Un poco de espacio si no hay nombre
  }

  // Encabezado superior: Fecha de pago y número de corte
  let diaFin = "";
  let mesFin = "";
  let anioFin = "";
  let fechaPagoStr = "";
  let corteNum = "";
  if (fechaFin && fechaFin.length >= 10) {
    diaFin = parseInt(fechaFin.slice(8,10), 10);
    mesFin = parseInt(fechaFin.slice(5,7), 10) - 1;
    anioFin = parseInt(fechaFin.slice(0,4), 10);
    // Fecha de pago: dos días después del fin de corte
    const fechaPago = new Date(anioFin, mesFin, diaFin + 2);
    const pad = n => n.toString().padStart(2, '0');
    fechaPagoStr = `${pad(fechaPago.getDate())}/${pad(fechaPago.getMonth() + 1)}/${fechaPago.getFullYear()}`;
  }
  // Número de corte (últimos 3 dígitos de claveSupervisor o lo que corresponda)
  corteNum = claveSupervisor ? String(claveSupervisor).padStart(4, '0') : '';

  // Imprimir encabezado superior derecha
  doc.setFontSize(10);
  doc.text(`Fecha para pago`, 270, 26, { align: 'right' });
  doc.setFontSize(12);
  doc.text(`${fechaPagoStr}`, 270, 32, { align: 'right' });


  // Título y resumen (más abajo)
  let yResumen = yDespuesEncabezado + 2;
  doc.setFontSize(16);
  if (tipo === "agente") {
    doc.text(`Estado de cuenta - Agente ${claveSupervisor} (${nombreAgente || ''})`, 14, yResumen);
  } else {
    doc.text(`Estado de cuenta - Supervisor ${claveSupervisor} (${supervisor?.nombre || ''})`, 14, yResumen);
  }
  yResumen += 10;

  // Datos bancarios del usuario (si están disponibles)
  if (datosUsuario) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(41, 98, 255);
    doc.text(`Datos Bancarios:`, 14, yResumen);
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    
    yResumen += 6;
    if (datosUsuario.rfc) {
      doc.text(`RFC: ${datosUsuario.rfc}`, 14, yResumen);
      yResumen += 5;
    }
    
    if (datosUsuario.banco) {
      doc.text(`Banco: ${datosUsuario.banco}`, 14, yResumen);
      yResumen += 5;
    }
    
    if (datosUsuario.cuenta_clabe) {
      doc.text(`Cuenta CLABE: ${datosUsuario.cuenta_clabe}`, 14, yResumen);
      yResumen += 5;
    }
    
    yResumen += 3; // Espacio adicional después de los datos bancarios
  }

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Recibos: ${data.recibos.length}`, 14, yResumen);

  // Tabla
  const columns = [
    { header: 'Póliza', dataKey: 'poliza' },
    { header: 'Asegurado', dataKey: 'asegurado' },
    { header: 'Fecha Mov.', dataKey: 'fechaMov' },
    { header: 'Año Vigencia', dataKey: 'anioVig' },
    { header: 'Plan', dataKey: 'dsn' },
    { header: 'Prima', dataKey: 'prima' },
    { header: '% Comisión', dataKey: 'pctComis' },
    { header: tipo === "agente" ? 'Comisión Agente' : 'Comisión Supervisor', dataKey: 'comisSupervisor' },
  ];

  const rows = data.recibos.map(recibo => {
    let agenteStr = '';
    if (recibo.claveAgente) {
      const agente = usuarios.find(u => String(u.clave) === String(recibo.claveAgente));
      agenteStr = agente ? `${recibo.claveAgente} (${agente.nombre})` : recibo.claveAgente;
    }
    
    // Usar las comisiones correctas según el tipo
    const porcentajeComision = tipo === "agente" ? (recibo.pctComisAgente || 0) : (recibo.pctComisSupervisor || 0);
    const valorComision = tipo === "agente" ? (recibo.comisAgente || 0) : (recibo.comisSupervisor || 0);
    
    return {
      poliza: recibo.polizaRef?.poliza || recibo.poliza,
      asegurado: recibo.nombreAsegurado,
      fechaMov: recibo.fechaMovimiento ? new Date(recibo.fechaMovimiento).toLocaleDateString('es-MX') : '',
      anioVig: recibo.anioVig || '',
      dsn: recibo.dsn || '',
      prima: (recibo.primaFracc || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
      pctComis: `${porcentajeComision}%`,
      comisSupervisor: valorComision.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
    };
  });


  // Tabla: más abajo
  autoTable(doc, {
    startY: yResumen + 8,
    head: [columns.map(col => col.header)],
    body: rows.map(row => columns.map(col => row[col.dataKey])),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 98, 255] },
    margin: { left: 14, right: 14 },
    theme: 'grid',
  });

  // Comisión total debajo de la tabla, con mejor diseño
  const comisionTotal = tipo === "agente" 
    ? (data.totalComisAgente || 0) 
    : (data.totalComisSupervisor || 0) + (data.totalComisAgente || 0); // Para supervisores, sumar ambas columnas
  const comisionTotalStr = comisionTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  let afterTableY = doc.lastAutoTable.finalY || (yResumen + 30);
  afterTableY += 12;
  doc.setFontSize(15);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(41, 98, 255);
  doc.text(`Comisión total:`, 14, afterTableY);
  doc.setFontSize(15);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(comisionTotal < 0 ? 200 : 34, comisionTotal < 0 ? 0 : 139, comisionTotal < 0 ? 0 : 34); // rojo si negativo, verde si positivo
  doc.text(`${comisionTotalStr}${comisionTotal < 0 ? '' : ''}`, 60, afterTableY);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0,0,0);

  // Nombre de archivo robusto usando props y no Date
  let corteStr = "";
  try {
    // Extraer días de las fechas (YYYY-MM-DD)
    const pad = n => n.toString().padStart(2, '0');
    let diaInicio = "";
    let diaFin = "";
    let mes = "";
    let anio = "";
    if (fechaInicio && fechaFin && fechaInicio.length >= 10 && fechaFin.length >= 10) {
      diaInicio = fechaInicio.slice(8,10);
      diaFin = fechaFin.slice(8,10);
      // mes y año del filtro (no de la fecha calculada)
      const mesNum = parseInt(fechaInicio.slice(5,7), 10) - 1;
      mes = meses[mesNum] || "";
      anio = fechaInicio.slice(0,4);
      corteStr = `${diaInicio}_${diaFin}_${mes}_${anio}`;
    }
  } catch (e) {
    corteStr = "";
  }
  if (tipo === "agente") {
    doc.save(`edo_${claveSupervisor}_corte${corteStr ? '_' + corteStr : ''}.pdf`);
  } else {
    doc.save(`estado_supervisor_${claveSupervisor}${corteStr ? '_' + corteStr : ''}.pdf`);
  }
}
