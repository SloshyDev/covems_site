import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";

const HEADERS = [
  "NUMERO DE SOLICITUD",
  "FECHA DE RECEPCION",
  "ASEGURADO",
  "CONTRATANTE",
  "CLAVE DE AGENTE",
  "PRIMA DE AHORRO",
  "FORMA DE PAGO",
  "PRIMA SOLICITADA",
];

export default function SolicitudExcelUpload({ onSuccess }) {
  const fileInputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFile = async (e) => {
    setError("");
    setSuccess("");
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rows.length) throw new Error("El archivo está vacío");
      const headers = rows[0].map((h) => h?.toString().trim().toUpperCase());
      if (headers.join() !== HEADERS.join()) {
        throw new Error(
          "Los encabezados no coinciden. Usa la plantilla exacta."
        );
      }
      const solicitudes = rows.slice(1).map((row) => ({
        solicitud: row[0]?.toString() || "",
        recepcion: row[1]
          ? new Date((row[1] - 25569) * 86400 * 1000).toISOString().slice(0, 10)
          : "",
        asegurado: row[2] || "",
        contratante: row[3] || "",
        agenteClave: row[4]?.toString() || "",
        primaAhorro: row[5] || "",
        pase: !!row[5],
        formaPago: row[6] || "",
        primaSolicitada: row[7] || "",
      }));
      // Validar que no haya campos obligatorios vacíos
      for (const [i, s] of solicitudes.entries()) {
        if (
          !s.solicitud ||
          !s.recepcion ||
          !s.asegurado ||
          !s.contratante ||
          !s.agenteClave ||
          !s.formaPago
        ) {
          throw new Error(`Faltan campos obligatorios en la fila ${i + 2}`);
        }
      }
      // Enviar solicitudes una a una (puedes optimizar con batch si tu API lo permite)
      let successCount = 0;
      let failCount = 0;
      for (const s of solicitudes) {
        const res = await fetch("/api/solicitud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(s),
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }
      setSuccess(
        `Solicitudes cargadas: ${successCount}. Errores: ${failCount}`
      );
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="my-6 p-6 bg-gray-900 rounded-xl border border-cyan-800 shadow-lg">
      <h2 className="text-lg font-bold text-cyan-300 mb-2">
        Carga masiva de solicitudes
      </h2>
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        onChange={handleFile}
        disabled={loading}
        className="mb-2"
      />
      <div className="text-xs text-cyan-200 mb-2">
        Descarga la plantilla y respeta los encabezados exactos.
        <br />
        <a
          href="/plantilla_solicitudes.xlsx"
          className="text-cyan-400 underline"
          download
        >
          Descargar plantilla
        </a>
      </div>
      {loading && <div className="text-cyan-400">Cargando...</div>}
      {error && <div className="text-red-400 font-bold">{error}</div>}
      {success && <div className="text-green-400 font-bold">{success}</div>}
    </div>
  );
}
