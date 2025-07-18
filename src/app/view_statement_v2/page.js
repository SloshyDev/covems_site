'use client'
import React, { useEffect } from 'react'

export default function page() {

  const [recibos, setRecibos] = React.useState([]);
  const [recibosPorUsuario, setRecibosPorUsuario] = React.useState({});
  const [loading, setLoading] = React.useState(true); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/recibo?fechaInicio=2025-07-01&fechaFin=2025-07-17");
        if (!response.ok) throw new Error("Error al obtener recibos");
        const data = await response.json();
        setRecibos(data.recibos);

        // Agrupar recibos por claveAgente
        const agrupados = {};
        data.recibos.forEach(recibo => {
          const clave = recibo.claveAgente || 'SIN_AGENTE';
          if (!agrupados[clave]) agrupados[clave] = [];
          agrupados[clave].push(recibo);
        });
        setRecibosPorUsuario(agrupados);

        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {/* Ejemplo de renderizado */}
      {Object.entries(recibosPorUsuario).map(([usuario, recibos]) => (
        <div key={usuario}>
          <h3>Usuario: {usuario}</h3>
          <ul>
            {recibos.map(r => (
              <li key={r.id || r.recibo}>
                {r.polizaRef?.poliza} - {r.nombreAsegurado}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
