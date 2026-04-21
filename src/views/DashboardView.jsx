import React from "react";
import { AlertCircle, Briefcase, Building2, CalendarClock, Users } from "lucide-react";
import { ResponsiveContainer, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { weeklyData } from "../constants";
import { getFollowUpStatus } from "../utils/helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "../components/ui";
import { ExportMenu, KpiCard, PrimaryButton, StatusBadge } from "../components/common";

function RecentCasesPanel({ cases, title = "Case Activity" }) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Fast scanning with structure, status, and due dates</CardDescription></CardHeader>
      <CardContent><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-slate-200 text-sm text-slate-500"><th className="pb-3 font-medium">Case ID</th><th className="pb-3 font-medium">Client</th><th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Provider</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Follow-Up</th></tr></thead><tbody>{cases.map((row) => <tr key={row.id} className="border-b border-slate-100 text-sm"><td className="py-4 font-mono">{row.id}</td><td className="py-4 font-medium">{row.client_name}</td><td className="py-4">{row.case_type}</td><td className="py-4">{row.provider === "Other" ? row.provider_other : row.provider}</td><td className="py-4"><StatusBadge value={row.status} /></td><td className="py-4">{row.follow_up_date || "—"}</td></tr>)}</tbody></table></div></CardContent>
    </Card>
  );
}

function UpcomingTrainingPanel({ training }) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader><CardTitle>Upcoming Training</CardTitle><CardDescription>Internal and provider sessions in one place</CardDescription></CardHeader>
      <CardContent className="space-y-4">{training.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{item.title}</div><div className="mt-1 text-sm text-slate-500">{item.event_date} · {item.event_type}</div></div><StatusBadge value={item.status} /></div><div className="mt-3 text-sm text-slate-600">{item.notes}</div></div>)}</CardContent>
    </Card>
  );
}

export default function DashboardView({ cases, members, training, smdBase, setActiveSection }) {
  const activeCases = cases.filter((c) => c.status !== "Closed").length;
  const pendingFollowups = cases.filter((c) => c.follow_up_date).length;
  const newMembersInProgress = members.length;
  const dueSoon = members.filter((m) => getFollowUpStatus(m.follow_up_date) === "soon").length;
  const overdueItems = members.filter((m) => getFollowUpStatus(m.follow_up_date) === "overdue").length;
  const exportRows = [
    ...cases.map((row) => ({ section: "Case", ...row })),
    ...members.map((row) => ({ section: "New Member", ...row, completed_steps: (row.completed_steps || []).join(" | ") })),
    ...smdBase.map((row) => ({ section: "SMD Base", ...row })),
    ...training.map((row) => ({ section: "Training", ...row })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-2xl font-semibold">Operations Dashboard</h2><p className="mt-1 text-sm text-slate-500">Export current saved data when you need offline review, reporting, or audit support.</p></div><ExportMenu label="Dashboard Export" rows={exportRows} baseName="case-operations-dashboard" /></div>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6"><KpiCard title="Active Cases" value={activeCases} hint="Open items across workflows" icon={Briefcase} /><KpiCard title="Pending Follow-Ups" value={pendingFollowups} hint="Scheduled actions requiring review" icon={CalendarClock} /><KpiCard title="New Member Progress" value={newMembersInProgress} hint="Licensing and affiliation pipeline" icon={Users} /><KpiCard title="Follow-Ups Due Soon" value={dueSoon} hint="Needs attention within 2 days" icon={CalendarClock} /><KpiCard title="Overdue Items" value={overdueItems} hint="Requires urgent action" icon={AlertCircle} /><KpiCard title="SMD Base" value={smdBase.length} hint="Completed agent records" icon={Building2} /></section>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]"><Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle>Weekly Productivity</CardTitle><CardDescription>Visible output keeps the week honest.</CardDescription></CardHeader><CardContent className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="completed" radius={[8, 8, 0, 0]} fill="#1f4fa3" /></BarChart></ResponsiveContainer></CardContent></Card><Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle>Priority Focus</CardTitle><CardDescription>What deserves attention first</CardDescription></CardHeader><CardContent className="space-y-4">{cases.filter((c) => c.status === "Urgent" || c.status === "Pending").slice(0, 4).map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{item.client_name}</div><div className="mt-1 font-mono text-xs text-slate-500">{item.id}</div></div><StatusBadge value={item.status} /></div><div className="mt-3 text-sm text-slate-600">{item.notes}</div><div className="mt-3 flex items-center justify-between text-sm text-slate-500"><span>{item.provider === "Other" ? item.provider_other : item.provider}</span><span>Follow-up: {item.follow_up_date || "—"}</span></div></div>)}<Separator /><div className="grid grid-cols-2 gap-3"><PrimaryButton onClick={() => setActiveSection("members")}>Open Member Hub</PrimaryButton><PrimaryButton onClick={() => setActiveSection("training")}>View Training</PrimaryButton></div></CardContent></Card></section>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]"><RecentCasesPanel cases={cases.slice(0, 6)} title="Recent Case Activity" /><UpcomingTrainingPanel training={training} /></section>
    </div>
  );
}

