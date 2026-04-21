function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportRowsToCsv(filename, rows) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => `"${String(row[h] ?? "").replaceAll('"', '""')}"`)
        .join(",")
    ),
  ].join("\n");

  downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
}

export async function exportRowsToXlsx(filename, rows, sheetName = "Data") {
  if (!rows.length) return;

  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

export async function exportRowsToPdf(filename, title, rows) {
  if (!rows.length) return;

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);

  const headers = Object.keys(rows[0] || {});
  const body = rows.map((row) => headers.map((h) => String(row[h] ?? "")));

  autoTable(doc, {
    head: [headers],
    body,
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [31, 79, 163] },
  });

  doc.save(filename);
}
