import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { updateSmdBase } from "../lib/supabase";
import { ExportMenu, PrimaryButton } from "../components/common";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "../components/ui";

export default function SmdBaseView({ smdBase, setSmdBase, syncClient, setSyncStatus }) {
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ agent_name: "", agent_id: "", referral_agent_name: "", referral_agent_id: "" });

  const referralGroups = smdBase.reduce((acc, agent) => {
    const key = agent.referral_agent_name || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(agent);
    return acc;
  }, {});

  const startEdit = (agent) => {
    setEditingId(agent.id);
    setEditForm({
      agent_name: agent.agent_name || "",
      agent_id: agent.agent_id || "",
      referral_agent_name: agent.referral_agent_name || "",
      referral_agent_id: agent.referral_agent_id || "",
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm({ agent_name: "", agent_id: "", referral_agent_name: "", referral_agent_id: "" });
  };

  const saveEdit = async (id) => {
    const updated = { ...editForm };
    setSmdBase((prev) => prev.map((agent) => (agent.id === id ? { ...agent, ...updated } : agent)));
    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await updateSmdBase(syncClient, id, updated);
        setSmdBase((prev) => prev.map((agent) => (agent.id === id ? saved : agent)));
        setSyncStatus("Saved");
      } catch (err) {
        console.error("smd save error:", err);
        setSyncStatus("Save error");
        return;
      }
    }
    cancelEdit();
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>SMD Base</CardTitle><CardDescription>Completed agents archived from the onboarding hub</CardDescription></div><ExportMenu label="SMD Base" rows={smdBase} baseName="smd-base" /></div></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {smdBase.map((agent) => {
              const isEditing = editingId === agent.id;
              return (
                <div key={agent.id} className="rounded-2xl border border-slate-200 p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div><Label>Agent Name</Label><Input className="mt-2" value={editForm.agent_name} onChange={(e) => setEditForm((prev) => ({ ...prev, agent_name: e.target.value }))} /></div>
                      <div><Label>Agent ID</Label><Input className="mt-2 font-mono" value={editForm.agent_id} onChange={(e) => setEditForm((prev) => ({ ...prev, agent_id: e.target.value }))} /></div>
                      <div><Label>Referral Agent</Label><Input className="mt-2" value={editForm.referral_agent_name} onChange={(e) => setEditForm((prev) => ({ ...prev, referral_agent_name: e.target.value }))} /></div>
                      <div><Label>Referral Agent ID</Label><Input className="mt-2 font-mono" value={editForm.referral_agent_id} onChange={(e) => setEditForm((prev) => ({ ...prev, referral_agent_id: e.target.value }))} /></div>
                      <div className="flex gap-2 pt-2"><PrimaryButton className="flex-1" onClick={() => saveEdit(agent.id)}>Save</PrimaryButton><Button variant="outline" className="flex-1 rounded-2xl" onClick={cancelEdit}>Cancel</Button></div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3"><div><div className="font-medium text-slate-900">{agent.agent_name}</div><div className="mt-2 text-sm text-slate-500">Agent ID: {agent.agent_id || "—"}</div><div className="text-sm text-slate-500">Referral Agent: {agent.referral_agent_name || "—"}</div><div className="text-sm text-slate-500">Referral Agent ID: {agent.referral_agent_id || "—"}</div></div><Button size="sm" variant="outline" className="rounded-xl" onClick={() => startEdit(agent)}><Pencil className="h-4 w-4" /></Button></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle>SMD Hierarchy View</CardTitle><CardDescription>Grouped by referral agent for a simple downline view</CardDescription></CardHeader><CardContent className="space-y-6">{Object.entries(referralGroups).map(([referralName, agents]) => <div key={referralName} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3"><div><div className="text-sm text-slate-500">Referral Agent</div><div className="text-lg font-semibold text-slate-900">{referralName}</div></div><Badge className="border border-blue-200 bg-blue-50 text-blue-700">{agents.length} Agent{agents.length > 1 ? "s" : ""}</Badge></div><div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{agents.map((agent) => <div key={`${agent.id}-hierarchy`} className="rounded-2xl bg-slate-50 p-4"><div className="font-medium text-slate-900">{agent.agent_name}</div><div className="mt-2 text-sm text-slate-500">Agent ID: {agent.agent_id || "—"}</div><div className="text-sm text-slate-500">Referral Agent ID: {agent.referral_agent_id || "—"}</div></div>)}</div></div>)}</CardContent></Card>
    </div>
  );
}
