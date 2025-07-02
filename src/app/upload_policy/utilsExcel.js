import * as XLSX from "xlsx";

export function generarPlantillaPolizas(solicitudes) {
  // Columnas requeridas para la carga masiva
  const headers = [
    "ID Solicitud",
    "Asegurado",
    "Contratante",
    "Clave Agente",
    "Forma de Pago",
    "No. de Póliza",
    "Fecha Recibida",
    "Prima Fraccionada",
    "Prima Anual",
  ];
  const data = solicitudes.map((s) => [
    s.id,
    s.asegurado,
    s.contratante,
    s.agenteClave,
    s.formaPago,
    "",
    "",
    "",
    "",
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Polizas");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}
