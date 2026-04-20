import React, { useEffect, useState } from "react";
import { ChevronRight, Clock3, Pencil, Plus } from "lucide-react";
import { onboardingSteps } from "../constants";
import { deleteMemberOnboarding, insertMemberOnboarding, insertSmdBase, updateMemberOnboarding } from "../lib/supabase";
import { getFollowUpStatus, normalizeMember } from "../utils/helpers";
import { ExportMenu, PrimaryButton } from "../components/common";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Input, Label, ScrollArea, Textarea } from "../components/ui";

export default function NewMemberHub({ members, setMembers, setSmdBase, syncClient, ownerEmail, setSyncStatus }) {
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [newReferralAgent, setNewReferralAgent] = useState("");
  const [newReferralAgentId, setNewReferralAgentId] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [newFollowUp, setNewFollowUp] = useState("");

  useEffect(() => {
    if (!members.length) {
      setSelectedId("");
      return;
    }
    if (!members.some((m) => m.id === selectedId)) {
      setSelectedId(members[0].id);
    }
  }, [members, selectedId]);

  const selectedMember = members.find((m) => m.id === selectedId) || null;

  const updateMemberField = async (field, value) => {
    if (!selectedMember) return;
    const updatedRow = normalizeMember({ ...selectedMember, [field]: value });
    setMembers((prev) => prev.map((member) => (member.id === selectedMember.id ? updatedRow : member)));
    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await updateMemberOnboarding(syncClient, selectedMember.id, { [field]: value });
        setMembers((prev) => prev.map((member) => (member.id === selectedMember.id ? saved : member)));
        setSyncStatus("Saved");
      } catch (err) {
        console.error("member update error:", err);
        setSyncStatus("Save error");
      }
    }
  };

  const toggleStep = async (step) => {
    if (!selectedMember) return;
    const completed = (selectedMember.completed_steps || []).includes(step)
      ? (selectedMember.completed_steps || []).filter((s) => s !== step)
      : [...(selectedMember.completed_steps || []), step];
    const currentStep = onboardingSteps.find((s) => !completed.includes(s)) || "Completed";

    if (currentStep === "Completed") {
      const archivedAgent = {
        agent_name: selectedMember.member_name,
        agent_id: selectedMember.agent_id,
        referral_agent_name: selectedMember.referral_agent_name,
        referral_agent_id: selectedMember.referral_agent_id,
        owner_email: ownerEmail,
      };
      if (syncClient) {
        try {
          setSyncStatus("Archiving...");
          const savedAgent = await insertSmdBase(syncClient, archivedAgent);
          await deleteMemberOnboarding(syncClient, selectedMember.id);
          setSmdBase((prev) => [savedAgent, ...prev]);
          setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
          setSelectedId("");
          setSyncStatus("Archived");
        } catch (err) {
          console.error("member archive error:", err);
          setSyncStatus("Archive error");
        }
        return;
      }
      setSmdBase((prev) => [{ id: `SMD-${Date.now()}`, ...archivedAgent }, ...prev]);
      setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      setSelectedId("");
      return;
    }

    const updatedRow = normalizeMember({
      ...selectedMember,
      completed_steps: completed,
      current_step: currentStep,
      issue: selectedMember.issue || `${currentStep} requires follow-up.`,
    });
    setMembers((prev) => prev.map((member) => (member.id === selectedMember.id ? updatedRow : member)));

    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await updateMemberOnboarding(syncClient, selectedMember.id, {
          completed_steps: completed,
          current_step: currentStep,
          issue: updatedRow.issue,
        });
        setMembers((prev) => prev.map((member) => (member.id === selectedMember.id ? saved : member)));
        setSyncStatus("Saved");
      } catch (err) {
        console.error("member step update error:", err);
        setSyncStatus("Save error");
      }
    }
  };

  const addMember = async () => {
    if (!newName.trim()) return;
    const item = {
      member_name: newName.trim(),
      agent_id: newAgentId.trim() || `AG-${Math.floor(1000 + Math.random() * 9000)}`,
      referral_agent_name: newReferralAgent.trim() || "",
      referral_agent_id: newReferralAgentId.trim() || "",
      current_step: onboardingSteps[0],
      issue: newIssue.trim() || `${onboardingSteps[0]} requires follow-up.`,
      follow_up_date: newFollowUp || null,
      notes: "",
      completed_steps: [],
      owner_email: ownerEmail,
    };

    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await insertMemberOnboarding(syncClient, item);
        setMembers((prev) => [saved, ...prev]);
        setSelectedId(saved.id);
        setSyncStatus("Saved");
      } catch (err) {
        console.error("member insert error:", err);
        setSyncStatus("Save error");
        return;
      }
    } else {
      const localItem = normalizeMember({ id: `MBR-${Date.now()}`, ...item });
      setMembers((prev) => [localItem, ...prev]);
      setSelectedId(localItem.id);
      setSyncStatus("Saved locally");
    }

    setNewName("");
    setNewAgentId("");
    setNewReferralAgent("");
    setNewReferralAgentId("");
    setNewIssue("");
    setNewFollowUp("");
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>New Member Hub</CardTitle><CardDescription>Licensing, affiliation, and training progress in one pipeline</CardDescription></div><ExportMenu label="New Member Hub" rows={members.map((row) => ({ ...row, completed_steps: (row.completed_steps || []).join(" | ") }))} baseName="new-member-hub" /></div></CardHeader><CardContent className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-medium">Add New Member</div><div className="mt-3 space-y-3"><Input placeholder="Member Name" value={newName} onChange={(e) => setNewName(e.target.value)} /><Input placeholder="Agent ID" value={newAgentId} onChange={(e) => setNewAgentId(e.target.value)} /><Input placeholder="Referral Agent" value={newReferralAgent} onChange={(e) => setNewReferralAgent(e.target.value)} /><Input placeholder="Referral Agent ID" value={newReferralAgentId} onChange={(e) => setNewReferralAgentId(e.target.value)} /><Textarea placeholder="Current issue or support needed" value={newIssue} onChange={(e) => setNewIssue(e.target.value)} className="min-h-[90px]" /><Input type="date" value={newFollowUp} onChange={(e) => setNewFollowUp(e.target.value)} /><PrimaryButton className="w-full" onClick={addMember}><Plus className="mr-2 h-4 w-4" /> Add Member</PrimaryButton></div></div><ScrollArea className="h-[520px] pr-3"><div className="space-y-3">{members.map((member) => { const active = selectedId === member.id; const progress = Math.round(((member.completed_steps || []).length / onboardingSteps.length) * 100); const followUpStatus = getFollowUpStatus(member.follow_up_date); return <button key={member.id} onClick={() => setSelectedId(member.id)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-[#1f4fa3] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"} ${!active && followUpStatus === "overdue" ? "border-rose-300 bg-rose-50" : ""} ${!active && followUpStatus === "soon" ? "border-amber-300 bg-amber-50" : ""}`}><div className="flex items-center justify-between gap-3"><div><div className="font-medium">{member.member_name}</div><div className="mt-1 text-xs text-slate-500">Agent ID: {member.agent_id || "—"}</div><div className="text-xs text-slate-500">Referral Agent: {member.referral_agent_name || "—"}</div><div className="text-xs text-slate-500">Referral Agent ID: {member.referral_agent_id || "—"}</div></div><ChevronRight className="h-4 w-4 text-slate-400" /></div><div className="mt-3 text-sm text-slate-600">Current: {member.current_step}</div><div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-[#1f4fa3]" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500"><span>{progress}% complete · Follow-up: {member.follow_up_date || "—"}</span>{followUpStatus === "overdue" && <span className="font-medium text-rose-600">Overdue</span>}{followUpStatus === "soon" && <span className="font-medium text-amber-600">Due Soon</span>}</div></button>; })}{members.length === 0 && <div className="text-sm text-slate-500">No members in onboarding right now.</div>}</div></ScrollArea></CardContent></Card>
      <Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle>{selectedMember?.member_name || "Member Detail"}</CardTitle><CardDescription>Use the checklist to manage each onboarding stage clearly</CardDescription></CardHeader><CardContent>{selectedMember ? <div className="space-y-5"><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Name</div><Input className="mt-3" value={selectedMember.member_name || ""} onChange={(e) => updateMemberField("member_name", e.target.value)} /></div><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Agent ID</div><Input className="mt-3 font-mono" value={selectedMember.agent_id || ""} onChange={(e) => updateMemberField("agent_id", e.target.value)} /></div><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Referral Agent</div><Input className="mt-3" value={selectedMember.referral_agent_name || ""} onChange={(e) => updateMemberField("referral_agent_name", e.target.value)} /></div><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Referral Agent ID</div><Input className="mt-3 font-mono" value={selectedMember.referral_agent_id || ""} onChange={(e) => updateMemberField("referral_agent_id", e.target.value)} /></div></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Follow-Up Date</div><Input type="date" className="mt-3" value={selectedMember.follow_up_date || ""} onChange={(e) => updateMemberField("follow_up_date", e.target.value)} /></div><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Open Issue</div><Textarea className="mt-3 min-h-[102px]" value={selectedMember.issue || ""} onChange={(e) => updateMemberField("issue", e.target.value)} /></div></div><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Notes</div><Textarea className="mt-3 min-h-[120px]" value={selectedMember.notes || ""} onChange={(e) => updateMemberField("notes", e.target.value)} /></div><div className="rounded-3xl border border-slate-200 p-4"><div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700"><Clock3 className="h-4 w-4" /> Onboarding Progress Workflow</div><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{onboardingSteps.map((step, index) => { const checked = (selectedMember.completed_steps || []).includes(step); return <div key={step} className={`flex items-start gap-3 rounded-2xl border p-4 ${checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}><Checkbox checked={checked} onCheckedChange={() => toggleStep(step)} className="mt-1" /><div><div className="text-xs uppercase tracking-wide text-slate-500">Step {index + 1}</div><div className="mt-1 font-medium">{step}</div></div></div>; })}</div></div></div> : <div className="text-sm text-slate-500">No member selected.</div>}</CardContent></Card>
    </div>
  );
}
