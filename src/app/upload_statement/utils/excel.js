import * as XLSX from "xlsx";

// Lee y convierte el archivo Excel a objetos JS
export async function parseExcelFile(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const parsedRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return parsedRows.map((row) => ({
    grupo: row["Grupo"] || null,
    claveAgente: "", // se llenará después
    fechaMovimiento: row["Fecha movimiento"] || null,
    poliza: row["No. Poliza"] || null,
    nombreAsegurado: row["Nombre Asegurado"] || null,
    recibo: row["Recibo"] || null,
    dsn: row["Dsn"] || null,
    sts: row["Sts"] || null,
    anioVig: row["Año Vig."] || null,
    fechaInicio: row["Fecha Inicio"] || null,
    fechaVencimiento: row["Fecha vencimiento"] || null,
    primaFracc: row["Prima Fracc"] || null,
    recargoFijo: row["Recargo Fijo"] || null,
    importeComble: row["Importe Comble"] || null,
    pctComisPromotoria: row["% Comis"] || null,
    comisPromotoria: row["Comis Promotoria"] || null,
    pctComisAgente: row["% Comis Agente"] || null,
    comisAgente: row["Comis Agente"] || null,
    pctComisSupervisor: row["% Comis Supervisor"] || null,
    comisSupervisor: row["Comis Supervisor"] || null,
    nivelacionVariable: row["Nivelacion Variable"] || null,
    comisPrimerAnio: row["Comis 1er Año"] || null,
    comisRenovacion: row["Comis Renvovacion"] || null,
    formaPago: row["Forma de pago"] || null,
  }));
}
