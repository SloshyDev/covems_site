import { useEffect, useState } from "react";

export function usePolizas() {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPolizas() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/poliza");
        if (!res.ok) throw new Error("Error al obtener pólizas");
        const data = await res.json();
        setPolizas(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPolizas();
  }, []);

  return { polizas, loading, error };
}
