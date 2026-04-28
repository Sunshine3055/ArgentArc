import React from "react";
import { Cloud, Download, FileSpreadsheet, FileText, HardDrive, RefreshCcw } from "lucide-react";
import { statusClasses } from "../constants";
import { exportRowsToCsv, exportRowsToPdf, exportRowsToXlsx } from "../utils/exporters";
import { Badge, Button, Card, CardContent } from "./ui";
import { cn } from "../utils/helpers";

export function ExportMenu({ label, rows, baseName }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => exportRowsToCsv(`${baseName}.csv`, rows)}>
        <Download className="mr-2 h-4 w-4" /> CSV
      </Button>
      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => exportRowsToXlsx(`${baseName}.xlsx`, rows, label)}>
        <FileSpreadsheet className="mr-2 h-4 w-4" /> XLSX
      </Button>
      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => exportRowsToPdf(`${baseName}.pdf`, label, rows)}>
        <FileText className="mr-2 h-4 w-4" /> PDF
      </Button>
    </div>
  );
}

export function SyncBadge({ mode, syncStatus, onSync }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
      {mode === "cloud" ? <Cloud className="h-4 w-4 text-[#1f4fa3]" /> : <HardDrive className="h-4 w-4 text-slate-500" />}
      <span>{mode === "cloud" ? "Cloud Sync" : "Local Mode"}</span>
      <Badge className="border border-slate-200 bg-slate-50 text-slate-700">{syncStatus}</Badge>
      <Button variant="ghost" size="sm" className="h-8 rounded-xl px-2" onClick={onSync}>
        <RefreshCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function StatusBadge({ value }) {
  return <Badge className={cn("border font-medium", statusClasses[value] || "bg-slate-100 text-slate-700")}>{value}</Badge>;
}

export function PrimaryButton({ children, className = "", ...props }) {
  return <Button className={cn("rounded-2xl bg-[#1f4fa3] text-white hover:bg-[#173d82]", className)} {...props}>{children}</Button>;
}

export function KpiCard({ title, value, hint, icon: Icon, onClick }) {
  return (
    <div onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
      <Card className={`rounded-3xl border-slate-200 bg-white shadow-sm transition ${onClick ? "hover:border-[#1f4fa3] hover:shadow-md" : ""}`}>
        <CardContent className="flex items-start justify-between p-6">
          <div>
            <div className="text-sm font-medium text-slate-500">{title}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
            <div className="mt-2 text-sm text-slate-500">{hint}</div>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-[#1f4fa3]"><Icon className="h-5 w-5" /></div>
        </CardContent>
      </Card>
    </div>
  );
}

