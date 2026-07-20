export function downloadCsv(filename, rows) {
  if (!rows?.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => {
      const v = String(r[k] ?? "").replace(/"/g, '""');
      return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v}"` : v;
    }).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printSection(sectionId) {
  if (sectionId) document.getElementById(sectionId)?.setAttribute("data-print-target", "true");
  window.print();
  if (sectionId) document.getElementById(sectionId)?.removeAttribute("data-print-target");
}

export function copyText(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}
