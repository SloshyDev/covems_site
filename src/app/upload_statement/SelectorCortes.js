import React, { useEffect, useRef } from "react";

export default function SelectorCortes({ year, setYear, month, setMonth, corteIdx, setCorteIdx, cortes }) {
  // Selección automática y almacenamiento del corte sugerido
  const initialSet = useRef(false);
  const autoCorteIdxRef = useRef(null);
  useEffect(() => {
    if (!initialSet.current && cortes && cortes.length > 0) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      setYear(y);
      setMonth(m);
      const todayDay = now.getDate();
      let idx = cortes.findIndex(c => todayDay >= c.inicio && todayDay <= c.fin);
      if (idx > 0) {
        setCorteIdx(idx - 1);
        autoCorteIdxRef.current = idx - 1;
      } else if (idx === 0) {
        setCorteIdx(0);
        autoCorteIdxRef.current = 0;
      } else {
        setCorteIdx(cortes.length - 1);
        autoCorteIdxRef.current = cortes.length - 1;
      }
      initialSet.current = true;
    }
  }, [cortes, setYear, setMonth, setCorteIdx]);

  // Alert si el usuario selecciona corte anterior o posterior al sugerido
  const handleCorteChange = (e) => {
    const selectedIdx = Number(e.target.value);
    if (autoCorteIdxRef.current !== null && selectedIdx !== autoCorteIdxRef.current) {
      alert('¡Advertencia! Seleccionar cortes diferentes al sugerido puede duplicar o perder datos.');
    }
    setCorteIdx(selectedIdx);
  };

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
          onChange={handleCorteChange}
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
