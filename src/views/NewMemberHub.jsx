import React, { useEffect, useState } from "react";
import { ChevronRight, Clock3, Plus } from "lucide-react";
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
  const [newDob, setNewDob] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRegistrationDate, setNewRegistrationDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (!members.length) { setSelectedId(""); return; }
    if (!members.some((m) => m.id === selectedId)) setSelectedId(members[0].id);
  }, [members, selectedId]);

  const selectedMember = members.find((m) => m.id === selectedId) || null;

  const updateMemberField = async (field, value) => {
    if (!selectedMember) return;
    const updatedRow = normalizeMember({ ...selectedMember, [field]: value });
    setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? updatedRow : m)));
    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await updateMemberOnboarding(syncClient, selectedMember.id, { [field]: value });
        setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? saved : m)));
        setSyncStatus("Saved");
      } catch (err) {
        console.error("member update error:", err);
        setSyncStatus("Save error");
      }
    }
  };

  const archiveMember = async (member) => {
    const archivedAgent = {
      agent_name: member.member_name,
      agent_id: member.agent_id,
      referral_agent_name: member.referral_agent_name,
      referral_agent_id: member.referral_agent_id,
      dob: member.dob || null,
      address: member.address || null,
      email: member.email || null,
      registration_date: member.registration_date || null,
      license_effective_date: member.license_effective_date || null,
      notes: member.notes || null,
      status: "Active",
      owner_email: ownerEmail,
    };

    if (syncClient) {
      try {
        setSyncStatus("Archiving...");
        const savedAgent = await insertSmdBase(syncClient, archivedAgent);
        await deleteMemberOnboarding(syncClient, member.id);
        setSmdBase((prev) => [savedAgent, ...prev]);
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        setSelectedId("");
        setSyncStatus("Agent Activated");
      } catch (err) {
        console.error("member archive error:", err);
        setSyncStatus("Archive error");
      }
    } else {
      setSmdBase((prev) => [{ id: `SMD-${Date.now()}`, ...archivedAgent }, ...prev]);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setSelectedId("");
    }
  };

  const toggleStep = async (step) => {
    if (!selectedMember) return;
    const completed = (selectedMember.completed_steps || []).includes(step)
      ? (selectedMember.completed_steps || []).filter((s) => s !== step)
      : [...(selectedMember.completed_steps || []), step];

    const allCompleted = completed.length === onboardingSteps.length;

    if (allCompleted) {
      const confirmed = window.confirm(
        `All 12 steps completed for ${selectedMember.member_name}. Move to SMD Base as Active Agent?`
      );
      if (confirmed) {
        const fullyUpdated = { ...selectedMember, completed_steps: completed };
        await archiveMember(fullyUpdated);
        return;
      }
    }

    const currentStep = onboardingSteps.find((s) => !completed.includes(s)) || "Completed";
    const updatedRow = normalizeMember({
      ...selectedMember,
      completed_steps: completed,
      current_step: currentStep,
    });
    setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? updatedRow : m)));

    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await updateMemberOnboarding(syncClient, selectedMember.id, {
          completed_steps: completed,
          current_step: currentStep,
        });
        setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? saved : m)));
        setSyncStatus("Saved");
      } catch (err) {
        console.error("member step update error:", err);
        setSyncStatus("Save error");
      }
    }
  };

  const toggleSelectAll = async () => {
    if (!selectedMember) return;
    const allSelected = (selectedMember.completed_steps || []).length === onboardingSteps.length;
    const completed = allSelected ? [] : [...onboardingSteps];

    if (!allSelected) {
      const confirmed = window.confirm(
        `Select all 12 steps for ${selectedMember.member_name}? This will move them to SMD Base as Active Agent.`
      );
      if (confirmed) {
        const fullyUpdated = { ...selectedMember, completed_steps: completed };
        await archiveMember(fullyUpdated);
        return;
      }
    }

    const updatedRow = normalizeMember({
      ...selectedMember,
      completed_steps: completed,
      current_step: allSelected ? onboardingSteps[0] : "Completed",
    });
    setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? updatedRow : m)));

    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await updateMemberOnboarding(syncClient, selectedMember.id, {
          completed_steps: completed,
          current_step: updatedRow.current_step,
        });
        setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? saved : m)));
        setSyncStatus("Saved");
      } catch (err) {
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
      dob: newDob || null,
      address: newAddress.trim() || null,
      email: newEmail.trim() || null,
      registration_date: newRegistrationDate || null,
      license_effective_date: null,
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
    }

    setNewName(""); setNewAgentId(""); setNewReferralAgent("");
    setNewReferralAgentId(""); setNewIssue(""); setNewDob("");
    setNewAddress(""); setNewEmail("");
    setNewRegistrationDate(new Date().toISOString().split("T")[0]);
  };

  const allStepsComplete = selectedMember
    ? (selectedMember.completed_steps || []).length === onboardingSteps.length
    : false;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.78fr_1.22fr]">

      {/* Left Panel — Add Member + Member List */}
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>New Member Hub</CardTitle>
              <CardDescription>Licensing, affiliation, and training progress in one pipeline</CardDescription>
            </div>
            <ExportMenu label="New Member Hub" rows={members.map((row) => ({ ...row, completed_steps: (row.completed_steps || []).join(" | ") }))} baseName="new-member-hub" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium">Add New Member</div>
            <div className="mt-3 space-y-3">
              <Input placeholder="Member Name *" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Agent ID" value={newAgentId} onChange={(e) => setNewAgentId(e.target.value)} />
              <Input placeholder="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <div>
                  <Label className="text-xs text-slate-500">Date of Birth</Label>
                  <Input type="date" className="mt-1" value={newDob} onChange={(e) => setNewDob(e.target.value)} />
</div>
              <Input placeholder="Address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
              <Input placeholder="Referral Agent" value={newReferralAgent} onChange={(e) => setNewReferralAgent(e.target.value)} />
              <Input placeholder="Referral Agent ID" value={newReferralAgentId} onChange={(e) => setNewReferralAgentId(e.target.value)} />
              <div>
                <Label className="text-xs text-slate-500">Registration Date</Label>
                <Input type="date" className="mt-1" value={newRegistrationDate} onChange={(e) => setNewRegistrationDate(e.target.value)} />
              </div>
              <Textarea placeholder="Current issue or support needed" value={newIssue} onChange={(e) => setNewIssue(e.target.value)} className="min-h-[70px]" />
              <PrimaryButton className="w-full" onClick={addMember}>
                <Plus className="mr-2 h-4 w-4" /> Add Member
              </PrimaryButton>
            </div>
          </div>

          <ScrollArea className="h-[420px] pr-3">
            <div className="space-y-3">
              {members.map((member) => {
                const active = selectedId === member.id;
                const progress = Math.round(((member.completed_steps || []).length / onboardingSteps.length) * 100);
                const followUpStatus = getFollowUpStatus(member.license_effective_date);
                return (
                  <button key={member.id} onClick={() => setSelectedId(member.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition
                      ${active ? "border-[#1f4fa3] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}
                      ${!active && followUpStatus === "overdue" ? "border-rose-300 bg-rose-50" : ""}
                      ${!active && followUpStatus === "soon" ? "border-amber-300 bg-amber-50" : ""}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{member.member_name}</div>
                        <div className="mt-1 text-xs text-slate-500">Agent ID: {member.agent_id || "—"}</div>
                        <div className="text-xs text-slate-500">Referral: {member.referral_agent_name || "—"}</div>
                        <div className="text-xs text-slate-500">Registered: {member.registration_date || "—"}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-[#1f4fa3]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{progress}% complete</div>
                  </button>
                );
              })}
              {members.length === 0 && <div className="text-sm text-slate-500">No members in onboarding right now.</div>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right Panel — Member Detail */}
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>{selectedMember?.member_name || "Member Detail"}</CardTitle>
          <CardDescription>Manage onboarding details and track progress through all 12 steps</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedMember ? (
            <div className="space-y-5">

              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">Member Name</div>
                  <Input className="mt-3" value={selectedMember.member_name || ""} onChange={(e) => updateMemberField("member_name", e.target.value)} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">Agent ID</div>
                  <Input className="mt-3 font-mono" value={selectedMember.agent_id || ""} onChange={(e) => updateMemberField("agent_id", e.target.value)} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">Email</div>
                  <Input className="mt-3" type="email" value={selectedMember.email || ""} onChange={(e) => updateMemberField("email", e.target.value)} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">Date of Birth</div>
                  <Input className="mt-3" type="date" value={selectedMember.dob || ""} onChange={(e) => updateMemberField("dob", e.target.value)} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">Referral Agent</div>
                  <Input className="mt-3" value={selectedMember.referral_agent_name || ""} onChange={(e) => updateMemberField("referral_agent_name", e.target.value)} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">Referral Agent ID</div>
                  <Input className="mt-3 font-mono" value={selectedMember.referral_agent_id || ""} onChange={(e) => updateMemberField("referral_agent_id", e.target.value)} />
                </div>
              </div>

              {/* Address */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-sm text-slate-500">Address</div>
                <Input className="mt-3" value={selectedMember.address || ""} onChange={(e) => updateMemberField("address", e.target.value)} />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">Registration Date</div>
                  <Input type="date" className="mt-3" value={selectedMember.registration_date || ""} onChange={(e) => updateMemberField("registration_date", e.target.value)} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">License Effective Date</div>
                  <Input type="date" className="mt-3" value={selectedMember.license_effective_date || ""} onChange={(e) => updateMemberField("license_effective_date", e.target.value)} />
                </div>
              </div>

              {/* Issue + Notes */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">Open Issue</div>
                  <Textarea className="mt-3 min-h-[90px]" value={selectedMember.issue || ""} onChange={(e) => updateMemberField("issue", e.target.value)} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-500">Notes</div>
                  <Textarea className="mt-3 min-h-[90px]" value={selectedMember.notes || ""} onChange={(e) => updateMemberField("notes", e.target.value)} />
                </div>
              </div>

              {/* Onboarding Steps */}
              <div className="rounded-3xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Clock3 className="h-4 w-4" /> Onboarding Progress Workflow
                  </div>
                  {/* Select All */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allStepsComplete}
                      onCheckedChange={toggleSelectAll}
                      id="select-all"
                    />
                    <label htmlFor="select-all" className="text-sm text-slate-600 cursor-pointer">
                      Select All
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {onboardingSteps.map((step, index) => {
                    const checked = (selectedMember.completed_steps || []).includes(step);
                    return (
                      <div key={step} className={`flex items-start gap-3 rounded-2xl border p-4 ${checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                        <Checkbox checked={checked} onCheckedChange={() => toggleStep(step)} className="mt-1" />
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-500">Step {index + 1}</div>
                          <div className="mt-1 font-medium">{step}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-sm text-slate-500">Select a member from the list to view details.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
