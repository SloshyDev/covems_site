"use client";
import React, { useState } from "react";
import useAgentesMenor1800 from "./useAgentesMenor1800";
import FormInput from "../../components/FormInput";
import AgenteSelect from "../../components/AgenteSelect";
import SolicitudExcelUpload from "./components/SolicitudExcelUpload";

const initialState = {
  solicitud: "",
  recepcion: "",
  asegurado: "",
  contratante: "",
  agenteClave: "",
  primaAhorro: "",
  formaPago: "",
  primaSolicitada: "",
  pase: false,
};

export default function SolicitudForm() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    agentes,
    loading: loadingAgentes,
    error: errorAgentes,
  } = useAgentesMenor1800();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Si se desactiva pase, limpiar primaAhorro
    if (name === "pase" && !checked) {
      setForm((prev) => ({
        ...prev,
        pase: false,
        primaAhorro: "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear solicitud");
      }
      setSuccess("Solicitud creada correctamente");
      setForm(initialState);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center">
      <div className="w-full max-w-3xl rounded-2xl shadow-2xl border border-cyan-800/40 bg-gray-800/70 p-10">
        <h1 className="text-3xl font-extrabold text-cyan-300 mb-8 text-center drop-shadow-lg tracking-tight">
          <span className="inline-block border-b-4 border-cyan-500 pb-1">
            Nueva Solicitud
          </span>
        </h1>
        <SolicitudExcelUpload onSuccess={() => {}} />
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Primera fila */}
            <FormInput
              label="No. Solicitud"
              name="solicitud"
              value={form.solicitud}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Fecha de Recepción"
              name="recepcion"
              type="date"
              value={form.recepcion}
              onChange={handleChange}
              required
            />
            {/* Segunda fila */}
            <FormInput
              label="Asegurado"
              name="asegurado"
              value={form.asegurado}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Contratante"
              name="contratante"
              value={form.contratante}
              onChange={handleChange}
              required
            />
            {/* Tercera fila */}
            <AgenteSelect
              value={form.agenteClave}
              onChange={handleChange}
              agentes={agentes}
              loading={loadingAgentes}
              error={errorAgentes}
            />
            <div className="flex flex-col md:flex-row gap-2 items-center w-full">
              <div className="flex items-center gap-2 mt-6 md:ml-4">
                <input
                  type="checkbox"
                  name="pase"
                  checked={form.pase}
                  onChange={handleChange}
                  className="accent-cyan-500 w-5 h-5 "
                />
                <label className="text-cyan-100 font-semibold">Pase</label>
              </div>
              <div className="flex-1">
                <FormInput
                  label="Prima Ahorro"
                  name="primaAhorro"
                  value={form.primaAhorro}
                  onChange={handleChange}
                  disabled={!form.pase}
                  className={!form.pase ? "opacity-50 cursor-not-allowed" : ""}
                />
              </div>
            </div>
            {/* Cuarta fila */}
            <FormInput
              label="Forma de Pago"
              name="formaPago"
              value={form.formaPago}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Prima Solicitada"
              name="primaSolicitada"
              value={form.primaSolicitada}
              onChange={handleChange}
            />
          </div>
          {error && (
            <div className="text-red-400 font-bold text-center mt-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-400 font-bold text-center mt-2">
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-700 to-cyan-500 hover:from-cyan-800 hover:to-cyan-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg mt-4 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                Guardando...
              </span>
            ) : (
              "Guardar Solicitud"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
