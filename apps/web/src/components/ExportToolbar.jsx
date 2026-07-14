import React from "react";
import { Copy, Download, FileJson, Printer } from "lucide-react";
import { downloadCsv, downloadJson, printSection, copyText, todayStamp } from "../utils/exports";

export default function ExportToolbar({ csvFilename, csvRows, jsonData, printId, copyText: copyContent, label }) {
  const date = todayStamp();
  return (
    <div className="export-toolbar">
      {csvRows?.length > 0 && (
        <button className="export-btn" onClick={() => downloadCsv(`${csvFilename}_${date}.csv`, csvRows)} title="Export CSV">
          <Download size={13} /><span>CSV</span>
        </button>
      )}
      {jsonData != null && (
        <button className="export-btn" onClick={() => downloadJson(`${csvFilename}_${date}.json`, jsonData)} title="Export JSON">
          <FileJson size={13} /><span>JSON</span>
        </button>
      )}
      {printId && (
        <button className="export-btn" onClick={() => printSection()} title="Print">
          <Printer size={13} /><span>Print</span>
        </button>
      )}
      {copyContent && (
        <button className="export-btn" onClick={() => copyText(copyContent)} title="Copy brief">
          <Copy size={13} /><span>Copy</span>
        </button>
      )}
    </div>
  );
}
