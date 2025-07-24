import React from "react";

export default function SelectorCortes({ year, setYear, month, setMonth, corteIdx, setCorteIdx, cortes }) {
  return (
    <section className="flex flex-wrap gap-6 mb-6">
      <label className="flex items-center gap-2 text-white font-medium">
        Año:
        <input
          type="number"
          value={year}
          min={2000}
          max={2100}
          onChange={e => setYear(Number(e.target.value))}
          className="border border-gray-600 rounded px-3 py-2 w-24 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ backgroundColor: '#284a59' }}
        />
      </label>
      <label className="flex items-center gap-2 text-white font-medium">
        Mes:
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ backgroundColor: '#284a59' }}
        >
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1} className="bg-slate-700 text-white">{i + 1}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-white font-medium">
        Corte:
        <select
          value={corteIdx}
          onChange={e => setCorteIdx(Number(e.target.value))}
          className="border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ backgroundColor: '#284a59' }}
        >
          {cortes.map((c, i) => (
            <option key={i} value={i} className="bg-slate-700 text-white">{`Del ${c.inicio} al ${c.fin}`}</option>
          ))}
        </select>
      </label>
    </section>
  );
}
