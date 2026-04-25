import React, { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CASE_TYPES, PROVIDERS, STATUS_OPTIONS } from "../constants";
import { deleteCaseRecord, insertCaseRecord, updateCaseRecord } from "../lib/supabase";
import { ExportMenu, PrimaryButton, StatusBadge } from "../components/common";
import { Button, Card, CardContent, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, Textarea } from "../components/ui";

export default function CasesView({ title, seedType, cases, setCases, syncClient, ownerEmail, setSyncStatus }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState({ id: "", client_name: "", case_type: seedType, provider: "Nationwide", provider_other: "", status: "Active", follow_up_date: "", notes: "", last_log: "" });

  const filteredCases = useMemo(() => cases.filter((item) => (seedType === "All" || item.case_type === seedType) && (filter === "All" || item.status === filter)), [cases, seedType, filter]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ id: "", client_name: "", case_type: seedType === "All" ? "Life Insurance" : seedType, provider: "Nationwide", provider_other: "", status: "Active", follow_up_date: "", notes: "", last_log: "" });
  };

  const handleSave = async () => {
    if (!form.id || !form.client_name) return;
    if (!syncClient) {
      if (editingId) setCases((prev) => prev.map((item) => (item.id === editingId ? { ...form } : item)));
      else setCases((prev) => [{ ...form }, ...prev]);
      setOpen(false);
      resetForm();
      return;
    }
    try {
      setSyncStatus("Saving...");
      if (editingId) {
        const { id: _removed, ...formWithoutId } = form;
        const saved = await insertCaseRecord(syncClient, { ...formWithoutId, owner_email: ownerEmail });
        setCases((prev) => prev.map((item) => (item.id === editingId ? saved : item)));
      } else {
        const saved = await insertCaseRecord(syncClient, { ...form, owner_email: ownerEmail });
        setCases((prev) => [saved, ...prev]);
      }
      setSyncStatus("Saved");
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error("case save error:", err);
      setSyncStatus("Save error");
    }
  };

  const handleDelete = async (id) => {
    if (!syncClient) {
      setCases((prev) => prev.filter((row) => row.id !== id));
      return;
    }
    try {
      setSyncStatus("Deleting...");
      await deleteCaseRecord(syncClient, id);
      setCases((prev) => prev.filter((row) => row.id !== id));
      setSyncStatus("Deleted");
    } catch (err) {
      console.error("case delete error:", err);
      setSyncStatus("Delete error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">Track case status, follow-ups, provider details, and daily notes.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><ExportMenu label={title} rows={filteredCases} baseName={title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} /><div className="w-[180px]"><Select value={filter} onValueChange={setFilter}><SelectContent><SelectItem value="All">All Statuses</SelectItem>{STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div><PrimaryButton onClick={() => { resetForm(); setOpen(true); }}><Plus className="mr-2 h-4 w-4" /> New Case</PrimaryButton></div></div>
      <Card className="rounded-3xl border-slate-200 shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50 text-sm text-slate-500"><tr><th className="px-6 py-4 font-medium">Case ID</th><th className="px-6 py-4 font-medium">Client</th><th className="px-6 py-4 font-medium">Type</th><th className="px-6 py-4 font-medium">Provider</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Follow-Up</th><th className="px-6 py-4 font-medium">Notes</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead><tbody>{filteredCases.map((item) => <tr key={item.id} className="border-t border-slate-100 align-top text-sm"><td className="px-6 py-5 font-mono">{item.id}</td><td className="px-6 py-5 font-medium">{item.client_name}</td><td className="px-6 py-5">{item.case_type}</td><td className="px-6 py-5">{item.provider === "Other" ? item.provider_other : item.provider}</td><td className="px-6 py-5"><StatusBadge value={item.status} /></td><td className="px-6 py-5 whitespace-nowrap">{item.follow_up_date || "—"}</td><td className="px-6 py-5 max-w-[320px] text-slate-600">{item.notes}</td><td className="px-6 py-5"><div className="flex gap-2"><Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setEditingId(item.id); setForm(item); setOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table></div></CardContent></Card>
      <Dialog open={open}><DialogContent className="max-w-3xl rounded-3xl"><DialogHeader><DialogTitle>{editingId ? "Edit Case Record" : "Create Case Record"}</DialogTitle></DialogHeader><div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-6 pt-4"><div><Label>Case ID</Label><Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="mt-2 font-mono" /></div><div><Label>Client / Member Name</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="mt-2" /></div><div><Label>Case Type</Label><div className="mt-2"><Select value={form.case_type} onValueChange={(v) => setForm({ ...form, case_type: v })}><SelectContent>{CASE_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Status</Label><div className="mt-2"><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectContent>{STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Provider</Label><div className="mt-2"><Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}><SelectContent>{PROVIDERS.map((provider) => <SelectItem key={provider} value={provider}>{provider}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Follow-Up Date</Label><Input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} className="mt-2" /></div>{form.provider === "Other" && <div className="md:col-span-2"><Label>Custom Provider Name</Label><Input value={form.provider_other} onChange={(e) => setForm({ ...form, provider_other: e.target.value })} className="mt-2" /></div>}<div className="md:col-span-2"><Label>Case Note</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-2 min-h-[96px]" /></div></div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button><PrimaryButton onClick={handleSave}>Save Record</PrimaryButton></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
