import React from "react";
import { generarPlantillaPolizas } from "../utilsExcel";
import * as XLSX from "xlsx";

export default function PolizaExcelActions({ solicitudes, onUploadFinish }) {
  return (
    <div className="flex flex-col md:flex-row md:justify-end gap-4 mb-6">
      <button
        className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-all duration-150"
        onClick={() => {
          if (!solicitudes.length) return;
          const blob = new Blob([generarPlantillaPolizas(solicitudes)], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "plantilla_polizas.xlsx";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }}
        disabled={solicitudes.length === 0}
      >
        Descargar plantilla Excel
      </button>
      <label className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-all duration-150 cursor-pointer">
        Carga masiva
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            for (const row of rows) {
              await fetch("/api/poliza", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  solicitudId: row["ID Solicitud"],
                  poliza: row["No. de Póliza"],
                  asegurado: row["Asegurado"],
                  agenteClave: row["Clave Agente"],
                  fechaRecibida: row["Fecha Recibida"],
                  primaFraccionada: row["Prima Fraccionada"],
                  primaAnual: row["Prima Anual"],
                  formaPago: row["Forma de Pago"],
                }),
              });
            }
            if (onUploadFinish) onUploadFinish();
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
