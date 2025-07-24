export function printEstadosJson(filtered) {
 
}
import * as XLSX from "xlsx";

const HEADERS = [
  "Grupo",
  "Clave del agente",
  "Nombre del agente",
  "Fecha movimiento",
  "No. Poliza",
  "Nivel",
  "Nombre Asegurado",
  "Recibo",
  "LOC",
  "Dsn",
  "Sts",
  "Año Vig.",
  "Fecha Inicio",
  "Fecha vencimiento",
  "Agente Cedente",
  "Prima Fracc",
  "Recargo Fijo",
  "Importe Comble",
  "% Comis",
  "Nivelacion Variable",
  "Comis 1er Año",
  "Comis Renvovacion",
  "Forma de pago"
];

export function readEstadosExcel(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rows.length || rows[0].length < HEADERS.length) {
        onError("El archivo no tiene el formato esperado.");
        return;
      }
      const headersOk = HEADERS.every((h, i) => (rows[0][i] || "").toString().trim() === h);
      if (!headersOk) {
        onError("Los encabezados no coinciden con el formato requerido.");
        return;
      }
      onSuccess(rows.slice(1));
    } catch (err) {
      onError("Error al leer el archivo: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}
