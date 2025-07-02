// Hook para obtener los agentes con clave < 1800
import { useEffect, useState } from "react";

export default function useAgentesMenor1800() {
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAgentes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Error al obtener agentes");
        const data = await res.json();
        setAgentes(data.filter((a) => a.clave < 1800));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAgentes();
  }, []);

  return { agentes, loading, error };
}
