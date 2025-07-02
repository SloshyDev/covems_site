import React from "react";

export default function AgenteSelect({
  value,
  onChange,
  agentes = [],
  loading = false,
  error = "",
  ...props
}) {
  return (
    <div>
      <label className="block text-cyan-100 font-semibold mb-1">
        Clave Agente *
      </label>
      <select
        name="agenteClave"
        value={value}
        onChange={onChange}
        required
        className="w-full p-2 rounded-lg bg-gray-800 text-cyan-200 border-2 border-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
        disabled={loading || !!error}
        {...props}
      >
        <option value="">
          {loading ? "Cargando..." : "Seleccione un agente"}
        </option>
        {agentes &&
          agentes.map((agente) => (
            <option key={agente.clave} value={agente.clave}>
              {agente.clave} - {agente.nombre}
            </option>
          ))}
      </select>
      {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
    </div>
  );
}
