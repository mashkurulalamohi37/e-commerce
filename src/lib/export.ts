/**
 * Utility to trigger browser CSV download for admin records (orders, inventory, etc.)
 */

/**
 * Spreadsheets treat a leading =, +, - or @ as the start of a formula, so a
 * customer name of `=HYPERLINK(...)` runs when the admin opens the export.
 * Prefixing with an apostrophe makes the cell literal text; Excel and Sheets
 * both strip it on display.
 */
function neutraliseFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const escaped = String(row[header] ?? "").replace(/"/g, '""');
          return `"${neutraliseFormula(escaped)}"`;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // The blob stays in memory for the life of the document otherwise.
  URL.revokeObjectURL(url);
}
