// Agrega claveAgente a cada recibo usando la base de datos
export async function addClaveAgenteToRows(rows, setError) {
  try {
    const res = await fetch("/api/poliza");
    if (!res.ok) throw new Error("No se pudieron obtener las pólizas");
    const polizas = await res.json();
    const polizaMap = {};
    for (const p of polizas) {
      if (p.poliza) polizaMap[p.poliza] = p.agenteClave || "";
    }
    return rows.map((row) => ({
      ...row,
      claveAgente: row.poliza ? polizaMap[row.poliza] || "" : "",
    }));
  } catch (err) {
    setError("Error al obtener pólizas: " + err.message);
    return rows.map((row) => ({ ...row, claveAgente: "" }));
  }
}
