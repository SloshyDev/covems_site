import * as XLSX from "xlsx";

export function parseExcel(file, HEADERS, VISIBLE_HEADERS, setData, setError) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    const bstr = evt.target.result;
    const wb = XLSX.read(bstr, { type: "binary" });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!json.length) {
      setError("El archivo está vacío.");
      return;
    }
    const headers = json[0];
    // Validar encabezados
    const missing = HEADERS.filter((h, i) => headers[i] !== h);
    if (missing.length) {
      setError(
        `Encabezados incorrectos. Esperado: ${HEADERS.join(", ")}`
      );
      return;
    }
    // Filtrar solo las columnas visibles
    const visibleIndexes = VISIBLE_HEADERS.map((h) => headers.indexOf(h));
    const filteredData = json.slice(1).map((row) =>
      visibleIndexes.map((idx) => row[idx])
    );
    setData(filteredData);
  };
  reader.readAsBinaryString(file);
}
