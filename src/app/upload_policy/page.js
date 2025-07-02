"use client";
import React, { useState } from "react";
import FormInput from "../../components/FormInput";
import PolizaFormModal from "./components/PolizaFormModal";
import PolizaExcelActions from "./components/PolizaExcelActions";
import { generarPlantillaPolizas } from "./utilsExcel";
import * as XLSX from "xlsx";

const initialState = {
  poliza: "",
  asegurado: "",
  agenteClave: "",
  fechaRecibida: "",
  solicitudId: "",
  primaFraccionada: "",
  primaAnual: "",
  formaPago: "",
};

export default function UploadPolizaPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);

  const fetchSolicitudes = async () => {
    setLoading(true);
    const res = await fetch("/api/solicitud?sinPoliza=1");
    const data = await res.json();
    setSolicitudes(data);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchSolicitudes();
  }, []);

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center  to-cyan-800">
      <div className="w-full max-w-6xl rounded-3xl shadow-2xl border border-cyan-800/60 bg-gray-800/80 p-12 backdrop-blur-md">
        <h1 className="text-4xl font-extrabold text-cyan-300 mb-10 text-center drop-shadow-lg tracking-tight">
          <span className="inline-block border-b-4 border-cyan-500 pb-1">
            Solicitudes sin Póliza
          </span>
        </h1>
        {loading ? (
          <div className="text-cyan-400 text-center animate-pulse">
            Cargando...
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="text-green-400 text-center font-semibold">
            Todas las solicitudes tienen póliza.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-cyan-100 mb-8 rounded-xl overflow-hidden shadow-lg">
              <thead>
                <tr className="bg-cyan-900/80 border-b-2 border-cyan-700">
                  <th className="py-3 px-2 font-bold"># Solicitud</th>
                  <th className="px-2 font-bold">Asegurado</th>
                  <th className="px-2 font-bold">Contratante</th>
                  <th className="px-2 font-bold">Clave Agente</th>
                  <th className="px-2 font-bold">Forma de Pago</th>
                  <th className="px-2"></th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`border-b border-cyan-800/30 hover:bg-cyan-800/20 transition-colors ${idx % 2 === 0 ? "bg-gray-900/60" : "bg-gray-800/60"}`}
                  >
                    <td className="py-2 px-2 font-mono text-cyan-200">
                      {s.solicitud}
                    </td>
                    <td className="px-2 py-2">{s.asegurado}</td>
                    <td className="px-2 py-2">{s.contratante}</td>
                    <td className="px-2 py-2">{s.agenteClave}</td>
                    <td className="px-2 py-2">{s.formaPago}</td>
                    <td className="px-2 py-2">
                      <button
                        className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white font-bold py-1.5 px-4 rounded-lg shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        onClick={() => {
                          setSelectedSolicitud(s);
                          setShowForm(true);
                        }}
                      >
                        Agregar Póliza
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:justify-end gap-4 mb-6">
          <PolizaExcelActions
            solicitudes={solicitudes}
            onUploadFinish={fetchSolicitudes}
          />
        </div>
        {showForm && selectedSolicitud && (
          <PolizaFormModal
            solicitud={selectedSolicitud}
            onClose={() => setShowForm(false)}
            onSuccess={fetchSolicitudes}
          />
        )}
      </div>
    </div>
  );
}
