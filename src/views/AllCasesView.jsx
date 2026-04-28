import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { PROVIDERS, STATUS_OPTIONS } from "../constants";
import { ExportMenu, PrimaryButton, StatusBadge } from "../components/common";
import { Button, Card, CardContent, Select, SelectContent, SelectItem } from "../components/ui";

export default function AllCasesView({ cases, setActiveSection }) {
  const [filter, setFilter] = useState("All");

  const activeCases = cases.filter((c) => c.status !== "Closed");
  const filteredCases = filter === "All"
    ? activeCases
    : activeCases.filter((c) => c.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">All Active Cases</h2>
          <p className="mt-1 text-sm text-slate-500">
            Combined view of Life Insurance and Annuity cases. Click a row to go to its section.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu label="All Active Cases" rows={filteredCases} baseName="all-active-cases" />
          <div className="w-[180px]">
            <Select value={filter} onValueChange={setFilter}>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={() => setActiveSection("dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Case Ref</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Provider</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Follow-Up</th>
                  <th className="px-6 py-4 font-medium">Notes</th>
                  <th className="px-6 py-4 font-medium">Go To</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 align-top text-sm hover:bg-slate-50 transition">
                    <td className="px-6 py-5 font-mono">{item.case_ref || "—"}</td>
                    <td className="px-6 py-5 font-medium">{item.client_name}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                        item.case_type === "Life Insurance"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-purple-200 bg-purple-50 text-purple-700"
                      }`}>
                        {item.case_type}
                      </span>
                    </td>
                    <td className="px-6 py-5">{item.provider === "Other" ? item.provider_other : item.provider}</td>
                    <td className="px-6 py-5"><StatusBadge value={item.status} /></td>
                    <td className="px-6 py-5 whitespace-nowrap">{item.follow_up_date || "—"}</td>
                    <td className="px-6 py-5 max-w-[240px] text-slate-600">{item.notes}</td>
                    <td className="px-6 py-5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setActiveSection(
                          item.case_type === "Life Insurance" ? "life" : "annuity"
                        )}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        {item.case_type === "Life Insurance" ? "Life" : "Annuity"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-400">
                      No active cases found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
