/*
  Case Operations Center
  Copyright (c) 2026 Shanshan Li (Sunshine). All rights reserved.
  Unauthorized copying, distribution, modification, or commercial reuse
  of this code, in whole or in part, is prohibited without express permission.
*/

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Landmark,
  GraduationCap,
  Search,
  Bell,
  CalendarClock,
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  Clock3,
  Briefcase,
  ChevronRight,
  Building2,
  AlertCircle,
  Cloud,
  HardDrive,
  RefreshCcw,
  LogIn,
  LogOut,
  UserCircle2,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const STORAGE_KEY_PREFIX = "case_operations_center_data";
const SUPABASE_URL = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "";
const SUPABASE_ANON_KEY = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "";

const ALLOWED_MEMBER_EMAILS = [
  "shanshanli3055@gmail.com",
  "shanshanli3055@yahoo.com",
  "sli.life3055@gmail.com",
  "agent1@company.com",
  "agent2@company.com",
  "admin@company.com",
];

const PROVIDERS = ["Nationwide", "TFA", "Symetra", "Athene", "Allianz", "Pacific Life", "Other"];
const CASE_TYPES = ["Life Insurance", "Annuity"];
const STATUS_OPTIONS = ["Active", "Pending", "Submitted", "Urgent", "Closed"];
const TRAINING_TYPES = ["Internal", "Provider", "Continuing Education", "Product Special Training"];

const onboardingSteps = [
  "New Registered / Financial Academy",
  "Licensing Exam Preparation",
  "Finger Print Submission",
  "Licensing Exam",
  "License Application",
  "WFG Affiliation",
  "E&O Insurance",
  "New Agent Training",
  "Continue Education",
  "Provider Appointment",
  "Product Special Training",
  "BPM Training",
];

const weeklyData = [
  { day: "Mon", completed: 5 },
  { day: "Tue", completed: 7 },
  { day: "Wed", completed: 4 },
  { day: "Thu", completed: 8 },
  { day: "Fri", completed: 6 },
  { day: "Sat", completed: 2 },
  { day: "Sun", completed: 1 },
];

const defaultData = {
  profile: null,
  cases: [
    {
      id: "ANN-24018",
      client_name: "David Lin",
      case_type: "Annuity",
      provider: "Athene",
      provider_other: "",
      status: "Pending",
      follow_up_date: "2026-04-18",
      notes: "Waiting for transfer confirmation and follow-up with case manager.",
      last_log: "Checked funding status this morning.",
    },
    {
      id: "LIF-24019",
      client_name: "Hui Zhen Lin",
      case_type: "Life Insurance",
      provider: "Symetra",
      provider_other: "",
      status: "Submitted",
      follow_up_date: "2026-04-16",
      notes: "Application submitted. Monitor underwriting requirements.",
      last_log: "Cover letter sent to support underwriting review.",
    },
  ],
  members: [
    {
      id: "MBR-1021",
      member_name: "Kehui Xie",
      agent_id: "AG-7812",
      referral_agent_name: "Dening Fang",
      referral_agent_id: "AG-7001",
      current_step: "License Application",
      issue: "State submission mismatch needs review.",
      follow_up_date: "2026-04-19",
      notes: "Licensing record reviewed. Waiting for corrected submission confirmation.",
      completed_steps: [
        "New Registered / Financial Academy",
        "Licensing Exam Preparation",
        "Finger Print Submission",
        "Licensing Exam",
      ],
    },
  ],
  smdBase: [
    {
      id: "SMD-001",
      agent_name: "Alicia Chen",
      agent_id: "AG-6008",
      referral_agent_name: "Xiaoqin Niu",
      referral_agent_id: "AG-5001",
    },
  ],
  training: [
    {
      id: "TRN-01",
      title: "Athene Product Basics",
      event_date: "2026-04-17",
      event_type: "Provider",
      status: "Scheduled",
      notes: "Review annuity product positioning and client profile fit.",
    },
  ],
};

function Card({ className = "", children }) {
  return <div className={cn("bg-white", className)}>{children}</div>;
}

function CardHeader({ className = "", children }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

function CardContent({ className = "", children }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

function CardTitle({ className = "", children }) {
  return <h3 className={cn("text-xl font-semibold text-slate-900", className)}>{children}</h3>;
}

function CardDescription({ className = "", children }) {
  return <p className={cn("mt-1 text-sm text-slate-500", className)}>{children}</p>;
}

function Button({ className = "", variant = "default", size = "default", children, ...props }) {
  const variantClasses = {
    default: "bg-[#1f4fa3] text-white hover:bg-[#173d82] border-transparent",
    outline: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    secondary: "bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200",
    ghost: "bg-transparent text-slate-700 border-transparent hover:bg-slate-100",
  };
  const sizeClasses = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 py-2 text-sm",
  };
  return (
    <button className={cn("inline-flex items-center justify-center rounded-xl transition disabled:opacity-50", variantClasses[variant] || variantClasses.default, sizeClasses[size] || sizeClasses.default, className)} {...props}>
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return <input className={cn("w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#1f4fa3]", className)} {...props} />;
}

function Textarea({ className = "", ...props }) {
  return <textarea className={cn("w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#1f4fa3]", className)} {...props} />;
}

function Badge({ className = "", children }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", className)}>{children}</span>;
}

function Label({ className = "", children, ...props }) {
  return <label className={cn("text-sm font-medium text-slate-700", className)} {...props}>{children}</label>;
}

function Separator({ className = "" }) {
  return <div className={cn("h-px w-full bg-slate-200", className)} />;
}

function ScrollArea({ className = "", children }) {
  return <div className={cn("overflow-auto", className)}>{children}</div>;
}

function Checkbox({ checked, onCheckedChange, className = "" }) {
  return (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={() => onCheckedChange?.(!checked)}
      className={cn("h-4 w-4 rounded border-slate-300 accent-[#1f4fa3]", className)}
    />
  );
}

function Select({ value, onValueChange, children }) {
  const options = [];
  React.Children.forEach(children, (child) => {
    if (!child) return;
    if (child.type === SelectContent) {
      React.Children.forEach(child.props.children, (grandchild) => {
        if (grandchild && grandchild.type === SelectItem) {
          options.push({ value: grandchild.props.value, label: grandchild.props.children });
        }
      });
    }
  });
  return (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1f4fa3]">
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function SelectTrigger({ className = "", children }) {
  return <div className={className}>{children}</div>;
}
function SelectValue({ placeholder }) {
  return <span>{placeholder || "Select"}</span>;
}
function SelectContent({ children }) {
  return <>{children}</>;
}
function SelectItem() {
  return null;
}

function Dialog({ open, children }) {
  if (!open) return null;
  return <>{children}</>;
}

function DialogContent({ className = "", children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-auto">
      <div className={cn("w-full bg-white shadow-xl", className)}>{children}</div>
    </div>
  );
}

function DialogHeader({ className = "", children }) {
  return <div className={cn("p-6 pb-0", className)}>{children}</div>;
}

function DialogTitle({ className = "", children }) {
  return <h3 className={cn("text-lg font-semibold text-slate-900", className)}>{children}</h3>;
}

function DialogFooter({ className = "", children }) {
  return <div className={cn("flex justify-end gap-3 p-6 pt-4", className)}>{children}</div>;
}

const statusClasses = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Submitted: "bg-blue-100 text-blue-700 border-blue-200",
  Urgent: "bg-rose-100 text-rose-700 border-rose-200",
  Closed: "bg-slate-200 text-slate-700 border-slate-300",
  Scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Done: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getFollowUpStatus(date) {
  if (!date) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return "none";
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "soon";
  return "normal";
}

function slugUser(email) {
  return (email || "guest").trim().toLowerCase();
}

function getStorageKey(userEmail) {
  return `${STORAGE_KEY_PREFIX}_${slugUser(userEmail)}`;
}

function loadLocalData(userEmail) {
  if (typeof window === "undefined" || !userEmail) return defaultData;
  try {
    const raw = window.localStorage.getItem(getStorageKey(userEmail));
    return raw ? { ...defaultData, ...JSON.parse(raw) } : defaultData;
  } catch {
    return defaultData;
  }
}

function saveLocalData(userEmail, data) {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    window.localStorage.setItem(getStorageKey(userEmail), JSON.stringify(data));
  } catch {}
}

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch {
    return null;
  }
}

function isRecognizedEmail(email) {
  return ALLOWED_MEMBER_EMAILS.includes(slugUser(email));
}
async function fetchTableData(client, userEmail) {
  const [
    profileRes,
    casesRes,
    membersRes,
    smdBaseRes,
    trainingRes,
  ] = await Promise.all([
    client.from("profiles").select("*").eq("email", slugUser(userEmail)).maybeSingle(),
    client.from("case_records").select("*").order("created_at", { ascending: false }),
    client.from("member_onboarding").select("*").order("created_at", { ascending: false }),
    client.from("smd_base").select("*").order("created_at", { ascending: false }),
    client.from("training_events").select("*").order("created_at", { ascending: false }),
  ]);

  if (profileRes.error) console.error("profiles fetch error:", profileRes.error);
  if (casesRes.error) console.error("case_records fetch error:", casesRes.error);
  if (membersRes.error) console.error("member_onboarding fetch error:", membersRes.error);
  if (smdBaseRes.error) console.error("smd_base fetch error:", smdBaseRes.error);
  if (trainingRes.error) console.error("training_events fetch error:", trainingRes.error);

  return {
    profile: profileRes.data || null,
    cases: casesRes.data || [],
    members: membersRes.data || [],
    smdBase: smdBaseRes.data || [],
    training: trainingRes.data || [],
  };
}
#async function fetchTableData(client, userEmail) {
  const [{ data: profile }, { data: cases }, { data: members }, { data: smdBase }, { data: training }] = await Promise.all([
    client.from("profiles").select("*").eq("email", slugUser(userEmail)).maybeSingle(),
    client.from("case_records").select("*").order("created_at", { ascending: false }),
    client.from("member_onboarding").select("*").order("created_at", { ascending: false }),
    client.from("smd_base").select("*").order("created_at", { ascending: false }),
    client.from("training_events").select("*").order("created_at", { ascending: false }),
  ]);

  return {
    profile: profile || null,
    cases: cases || [],
    members: members || [],
    smdBase: smdBase || [],
    training: training || [],
  };
}#

async function upsertProfile(client, userEmail) {
  const payload = {
    email: slugUser(userEmail),
    display_name: "Shanshan Li (Sunshine)",
  };
  await client.from("profiles").upsert(payload, { onConflict: "email" });
}

async function insertCaseRecord(client, row) {
  const { data, error } = await client.from("case_records").insert(row).select().single();
  if (error) throw error;
  return data;
}

async function updateCaseRecord(client, id, row) {
  const { data, error } = await client.from("case_records").update(row).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

async function deleteCaseRecord(client, id) {
  const { error } = await client.from("case_records").delete().eq("id", id);
  if (error) throw error;
}

async function insertMemberOnboarding(client, row) {
  const { data, error } = await client.from("member_onboarding").insert(row).select().single();
  if (error) throw error;
  return data;
}

async function updateMemberOnboarding(client, id, row) {
  const { data, error } = await client.from("member_onboarding").update(row).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

async function deleteMemberOnboarding(client, id) {
  const { error } = await client.from("member_onboarding").delete().eq("id", id);
  if (error) throw error;
}

async function insertSmdBase(client, row) {
  const { data, error } = await client.from("smd_base").insert(row).select().single();
  if (error) throw error;
  return data;
}

async function insertTrainingEvent(client, row) {
  const { data, error } = await client.from("training_events").insert(row).select().single();
  if (error) throw error;
  return data;
}

async function updateTrainingEvent(client, id, row) {
  const { data, error } = await client.from("training_events").update(row).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

async function deleteTrainingEvent(client, id) {
  const { error } = await client.from("training_events").delete().eq("id", id);
  if (error) throw error;
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportRowsToCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replaceAll('"', '""')}"`).join(",")
    ),
  ].join("\n");
  downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
}

function exportRowsToXlsx(filename, rows, sheetName = "Data") {
  if (!rows.length) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

function exportRowsToPdf(filename, title, rows) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const body = rows.map((row) => headers.map((h) => String(row[h] ?? "")));
  autoTable(doc, {
    head: [headers],
    body,
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [31, 79, 163] },
  });
  doc.save(filename);
}

function ExportMenu({ label, rows, baseName }) {
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

function SyncBadge({ mode, syncStatus, onSync }) {
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

function AuthPanel({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const client = getSupabaseClient();

  const handleSignIn = async () => {
    const cleanEmail = slugUser(email);
    if (!isRecognizedEmail(cleanEmail)) {
      setMessage("Access denied. Only recognized members can use this app.");
      return;
    }
    if (!client) {
      setMessage("Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    if (!password || password.length < 6) {
      setMessage("Enter your invited account password.");
      return;
    }
    const { error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Signed in.");
    onAuthSuccess(cleanEmail);
  };

  return (
    <Card className="mx-auto mt-16 max-w-md rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5 text-[#1f4fa3]" /> Member Sign In</CardTitle>
        <CardDescription>Invite-only access. Only approved members can use this application.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input className="mt-2" placeholder="member@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Password</Label>
          <Input className="mt-2" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button className="w-full rounded-2xl bg-[#1f4fa3] text-white hover:bg-[#173d82]" onClick={handleSignIn}>
          <LogIn className="mr-2 h-4 w-4" /> Sign In
        </Button>
        {message && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <div className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 text-[#1f4fa3]" /> <span>{message}</span></div>
          </div>
        )}
        <div className="text-xs text-slate-500">Invite-only mode is active. Create or invite approved users in Supabase Auth first, then sign in here.</div>
      </CardContent>
    </Card>
  );
}

function AppShell({ children, activeSection, setActiveSection, syncMode, syncStatus, onSync, userEmail, onLogout }) {
  const navItems = [
    { key: "dashboard", label: "Operations Dashboard", icon: LayoutDashboard },
    { key: "members", label: "New Member Hub", icon: Users },
    { key: "smd", label: "SMD Base", icon: Building2 },
    { key: "life", label: "Life Insurance Cases", icon: ShieldCheck },
    { key: "annuity", label: "Annuity Cases", icon: Landmark },
    { key: "training", label: "Training Schedule", icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-[#eef2f6] text-slate-900 [font-family:Inter,ui-sans-serif,system-ui,sans-serif]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-[#1f4fa3] text-white">
          <div className="flex h-20 items-center border-b border-white/10 px-6">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-blue-100">Professional Case Management</div>
              <div className="mt-1 text-2xl font-semibold">Case Operations Center</div>
            </div>
          </div>
          <div className="px-4 py-5">
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wider text-blue-100">Signed In</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium"><UserCircle2 className="h-4 w-4" /> {userEmail}</div>
              <Button variant="secondary" className="mt-3 h-9 rounded-xl bg-white text-[#1f4fa3] hover:bg-slate-100" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Log Out
              </Button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition",
                      active ? "bg-white text-[#1f4fa3] shadow-sm" : "text-blue-50 hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Daily Workflow Console</div>
                <h1 className="text-2xl font-semibold text-slate-900">Structured tracking for cases, licensing, and training</h1>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Search client, case ID, provider..." className="pl-9" />
                </div>
                <SyncBadge mode={syncMode} syncStatus={syncStatus} onSync={onSync} />
                <Button variant="outline" className="rounded-xl">
                  <Bell className="mr-2 h-4 w-4" /> Alerts
                </Button>
              </div>
            </div>
          </header>
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function KpiCard({ title, value, hint, icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-start justify-between p-6">
          <div>
            <div className="text-sm font-medium text-slate-500">{title}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
            <div className="mt-2 text-sm text-slate-500">{hint}</div>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-[#1f4fa3]"><Icon className="h-5 w-5" /></div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ value }) {
  return <Badge className={cn("border font-medium", statusClasses[value] || "bg-slate-100 text-slate-700")}>{value}</Badge>;
}

function PrimaryButton({ children, className = "", ...props }) {
  return <Button className={cn("rounded-2xl bg-[#1f4fa3] text-white hover:bg-[#173d82]", className)} {...props}>{children}</Button>;
}

function DashboardView({ cases, members, training, smdBase, setActiveSection }) {
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Operations Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Export current saved data when you need offline review, reporting, or audit support.</p>
        </div>
        <ExportMenu label="Dashboard Export" rows={exportRows} baseName="case-operations-dashboard" />
      </div>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard title="Active Cases" value={activeCases} hint="Open items across workflows" icon={Briefcase} />
        <KpiCard title="Pending Follow-Ups" value={pendingFollowups} hint="Scheduled actions requiring review" icon={CalendarClock} />
        <KpiCard title="New Member Progress" value={newMembersInProgress} hint="Licensing and affiliation pipeline" icon={Users} />
        <KpiCard title="Follow-Ups Due Soon" value={dueSoon} hint="Needs attention within 2 days" icon={CalendarClock} />
        <KpiCard title="Overdue Items" value={overdueItems} hint="Requires urgent action" icon={AlertCircle} />
        <KpiCard title="SMD Base" value={smdBase.length} hint="Completed agent records" icon={Building2} />
      </section>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle>Weekly Productivity</CardTitle><CardDescription>Visible output keeps the week honest.</CardDescription></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="completed" radius={[8, 8, 0, 0]} fill="#1f4fa3" /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle>Priority Focus</CardTitle><CardDescription>What deserves attention first</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {cases.filter((c) => c.status === "Urgent" || c.status === "Pending").slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3"><div><div className="font-medium">{item.client_name}</div><div className="mt-1 font-mono text-xs text-slate-500">{item.id}</div></div><StatusBadge value={item.status} /></div>
                <div className="mt-3 text-sm text-slate-600">{item.notes}</div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-500"><span>{item.provider === "Other" ? item.provider_other : item.provider}</span><span>Follow-up: {item.follow_up_date || "—"}</span></div>
              </div>
            ))}
            <Separator />
            <div className="grid grid-cols-2 gap-3"><PrimaryButton onClick={() => setActiveSection("members")}>Open Member Hub</PrimaryButton><PrimaryButton onClick={() => setActiveSection("training")}>View Training</PrimaryButton></div>
          </CardContent>
        </Card>
      </section>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]"><RecentCasesPanel cases={cases.slice(0, 6)} title="Recent Case Activity" /><UpcomingTrainingPanel training={training} /></section>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle>Today Focus</CardTitle><CardDescription>Immediate follow-ups and priority actions</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {members.filter((m) => {
              const s = getFollowUpStatus(m.follow_up_date);
              return s === "overdue" || s === "soon";
            }).map((m) => <div key={m.id} className="rounded-xl border p-3"><div className="font-medium">{m.member_name}</div><div className="text-sm text-slate-500">{m.current_step}</div><div className="text-xs text-slate-400">Follow-up: {m.follow_up_date || "—"}</div></div>)}
            {members.filter((m) => {
              const s = getFollowUpStatus(m.follow_up_date);
              return s === "overdue" || s === "soon";
            }).length === 0 && <div className="text-sm text-slate-500">No urgent follow-ups 🎯</div>}
          </CardContent>
        </Card>
        <UpcomingTrainingPanel training={training} />
      </section>
    </div>
  );
}

function RecentCasesPanel({ cases, title = "Case Activity" }) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Fast scanning with structure, status, and due dates</CardDescription></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead><tr className="border-b border-slate-200 text-sm text-slate-500"><th className="pb-3 font-medium">Case ID</th><th className="pb-3 font-medium">Client</th><th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Provider</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Follow-Up</th></tr></thead>
            <tbody>{cases.map((row) => <tr key={row.id} className="border-b border-slate-100 text-sm"><td className="py-4 font-mono">{row.id}</td><td className="py-4 font-medium">{row.client_name}</td><td className="py-4">{row.case_type}</td><td className="py-4">{row.provider === "Other" ? row.provider_other : row.provider}</td><td className="py-4"><StatusBadge value={row.status} /></td><td className="py-4">{row.follow_up_date || "—"}</td></tr>)}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingTrainingPanel({ training }) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader><CardTitle>Upcoming Training</CardTitle><CardDescription>Internal and provider sessions in one place</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {training.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{item.title}</div><div className="mt-1 text-sm text-slate-500">{item.event_date} · {item.event_type}</div></div><StatusBadge value={item.status} /></div><div className="mt-3 text-sm text-slate-600">{item.notes}</div></div>)}
      </CardContent>
    </Card>
  );
}

function CasesView({ title, seedType, cases, setCases, syncClient, ownerEmail, setSyncStatus }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState({ id: "", client_name: "", case_type: seedType, provider: "Nationwide", provider_other: "", status: "Active", follow_up_date: "", notes: "", last_log: "" });
  const filteredCases = useMemo(() => cases.filter((item) => (seedType === "All" || item.case_type === seedType) && (filter === "All" || item.status === filter)), [cases, seedType, filter]);
  const resetForm = () => { setEditingId(null); setForm({ id: "", client_name: "", case_type: seedType === "All" ? "Life Insurance" : seedType, provider: "Nationwide", provider_other: "", status: "Active", follow_up_date: "", notes: "", last_log: "" }); };
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
        const saved = await updateCaseRecord(syncClient, editingId, form);
        setCases((prev) => prev.map((item) => (item.id === editingId ? saved : item)));
      } else {
        const saved = await insertCaseRecord(syncClient, { ...form, owner_email: ownerEmail });
        setCases((prev) => [saved, ...prev]);
      }
      setSyncStatus("Saved");
      setOpen(false);
      resetForm();
    } catch {
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
    } catch {
      setSyncStatus("Delete error");
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">Track case status, follow-ups, provider details, and daily notes.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><ExportMenu label={title} rows={filteredCases} baseName={title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} /><div className="w-[180px]"><Select value={filter} onValueChange={setFilter}><SelectContent><SelectItem value="All">All Statuses</SelectItem>{STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div><PrimaryButton onClick={() => { resetForm(); setOpen(true); }}><Plus className="mr-2 h-4 w-4" /> New Case</PrimaryButton></div></div>
      <Card className="rounded-3xl border-slate-200 shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50 text-sm text-slate-500"><tr><th className="px-6 py-4 font-medium">Case ID</th><th className="px-6 py-4 font-medium">Client</th><th className="px-6 py-4 font-medium">Type</th><th className="px-6 py-4 font-medium">Provider</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Follow-Up</th><th className="px-6 py-4 font-medium">Notes</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead><tbody>{filteredCases.map((item) => <tr key={item.id} className="border-t border-slate-100 align-top text-sm"><td className="px-6 py-5 font-mono">{item.id}</td><td className="px-6 py-5 font-medium">{item.client_name}</td><td className="px-6 py-5">{item.case_type}</td><td className="px-6 py-5">{item.provider === "Other" ? item.provider_other : item.provider}</td><td className="px-6 py-5"><StatusBadge value={item.status} /></td><td className="px-6 py-5 whitespace-nowrap">{item.follow_up_date || "—"}</td><td className="px-6 py-5 max-w-[320px] text-slate-600">{item.notes}</td><td className="px-6 py-5"><div className="flex gap-2"><Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setEditingId(item.id); setForm(item); setOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table></div></CardContent></Card>
      <Dialog open={open}><DialogContent className="max-w-3xl rounded-3xl"><DialogHeader><DialogTitle>{editingId ? "Edit Case Record" : "Create Case Record"}</DialogTitle></DialogHeader><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div><Label>Case ID</Label><Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="mt-2 font-mono" /></div><div><Label>Client / Member Name</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="mt-2" /></div><div><Label>Case Type</Label><div className="mt-2"><Select value={form.case_type} onValueChange={(v) => setForm({ ...form, case_type: v })}><SelectContent>{CASE_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Status</Label><div className="mt-2"><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectContent>{STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Provider</Label><div className="mt-2"><Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}><SelectContent>{PROVIDERS.map((provider) => <SelectItem key={provider} value={provider}>{provider}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Follow-Up Date</Label><Input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} className="mt-2" /></div>{form.provider === "Other" && <div className="md:col-span-2"><Label>Custom Provider Name</Label><Input value={form.provider_other} onChange={(e) => setForm({ ...form, provider_other: e.target.value })} className="mt-2" /></div>}<div className="md:col-span-2"><Label>Case Note</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-2 min-h-[96px]" /></div></div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button><PrimaryButton onClick={handleSave}>Save Record</PrimaryButton></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function NewMemberHub({ members, setMembers, setSmdBase, syncClient, ownerEmail, setSyncStatus }) {
  const [selectedId, setSelectedId] = useState(members[0]?.id || "");
  const selectedMember = members.find((m) => m.id === selectedId) || members[0] || null;
  const [newName, setNewName] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [newReferralAgent, setNewReferralAgent] = useState("");
  const [newReferralAgentId, setNewReferralAgentId] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [newFollowUp, setNewFollowUp] = useState("");
  const updateMemberField = async (field, value) => {
    if (!selectedMember) return;
    const updatedRow = { ...selectedMember, [field]: value };
    setMembers((prev) => prev.map((member) => (member.id === selectedMember.id ? updatedRow : member)));
    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await updateMemberOnboarding(syncClient, selectedMember.id, updatedRow);
        setMembers((prev) => prev.map((member) => (member.id === selectedMember.id ? saved : member)));
        setSyncStatus("Saved");
      } catch {
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
        } catch {
          setSyncStatus("Archive error");
        }
        return;
      }
      setSmdBase((prev) => [{ id: `SMD-${Date.now()}`, ...archivedAgent }, ...prev]);
      setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      setSelectedId("");
      return;
    }
    const updatedRow = { ...selectedMember, completed_steps: completed, current_step: currentStep, issue: selectedMember.issue || `${currentStep} requires follow-up.` };
    setMembers((prev) => prev.map((member) => (member.id === selectedMember.id ? updatedRow : member)));
    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await updateMemberOnboarding(syncClient, selectedMember.id, updatedRow);
        setMembers((prev) => prev.map((member) => (member.id === selectedMember.id ? saved : member)));
        setSyncStatus("Saved");
      } catch {
        setSyncStatus("Save error");
      }
    }
  };
  #const addMember = async () => {
    if (!newName) return;
    const item = {
      member_name: newName,
      agent_id: newAgentId || `AG-${Math.floor(1000 + Math.random() * 9000)}`,
      referral_agent_name: newReferralAgent || "",
      referral_agent_id: newReferralAgentId || "",
      current_step: onboardingSteps[0],
      issue: newIssue || `${onboardingSteps[0]} requires follow-up.`,
      follow_up_date: newFollowUp,
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
      } catch {
        setSyncStatus("Save error");
        return;
      }
    } else {
      const localItem = { id: `MBR-${Date.now()}`, ...item };
      setMembers((prev) => [localItem, ...prev]);
      setSelectedId(localItem.id);
    }
    setNewName(""); setNewAgentId(""); setNewReferralAgent(""); setNewReferralAgentId(""); setNewIssue(""); setNewFollowUp("");
  };#
const addMember = async () => {
  if (!newName) return;

  const item = {
    member_name: newName,
    agent_id: newAgentId || `AG-${Math.floor(1000 + Math.random() * 9000)}`,
    referral_agent_name: newReferralAgent || "",
    referral_agent_id: newReferralAgentId || "",
    current_step: onboardingSteps[0],
    issue: newIssue || `${onboardingSteps[0]} requires follow-up.`,
    follow_up_date: newFollowUp,
    notes: "",
    completed_steps: [],
    owner_email: ownerEmail,
  };

  if (syncClient) {
    try {
      setSyncStatus("Saving...");
      const saved = await insertMemberOnboarding(syncClient, item);
      console.log("member insert success:", saved);
      setMembers((prev) => [saved, ...prev]);
      setSelectedId(saved.id);
      setSyncStatus("Saved");
    } catch (err) {
      console.error("member insert error:", err);
      setSyncStatus(`Save error`);
      return;
    }
  } else {
    const localItem = { id: `MBR-${Date.now()}`, ...item };
    setMembers((prev) => [localItem, ...prev]);
    setSelectedId(localItem.id);
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
      <Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>New Member Hub</CardTitle><CardDescription>Licensing, affiliation, and training progress in one pipeline</CardDescription></div><ExportMenu label="New Member Hub" rows={members.map((row) => ({ ...row, completed_steps: (row.completed_steps || []).join(" | ") }))} baseName="new-member-hub" /></div></CardHeader><CardContent className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-medium">Add New Member</div><div className="mt-3 space-y-3"><Input placeholder="Member Name" value={newName} onChange={(e) => setNewName(e.target.value)} /><Input placeholder="Agent ID" value={newAgentId} onChange={(e) => setNewAgentId(e.target.value)} /><Input placeholder="Referral Agent" value={newReferralAgent} onChange={(e) => setNewReferralAgent(e.target.value)} /><Input placeholder="Referral Agent ID" value={newReferralAgentId} onChange={(e) => setNewReferralAgentId(e.target.value)} /><Textarea placeholder="Current issue or support needed" value={newIssue} onChange={(e) => setNewIssue(e.target.value)} className="min-h-[90px]" /><Input type="date" value={newFollowUp} onChange={(e) => setNewFollowUp(e.target.value)} /><PrimaryButton className="w-full" onClick={addMember}><Plus className="mr-2 h-4 w-4" /> Add Member</PrimaryButton></div></div><ScrollArea className="h-[520px] pr-3"><div className="space-y-3">{members.map((member) => { const active = selectedId === member.id; const progress = Math.round(((member.completed_steps || []).length / onboardingSteps.length) * 100); const followUpStatus = getFollowUpStatus(member.follow_up_date); return <button key={member.id} onClick={() => setSelectedId(member.id)} className={cn("w-full rounded-2xl border p-4 text-left transition", active ? "border-[#1f4fa3] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50", !active && followUpStatus === "overdue" && "border-rose-300 bg-rose-50", !active && followUpStatus === "soon" && "border-amber-300 bg-amber-50")}><div className="flex items-center justify-between gap-3"><div><div className="font-medium">{member.member_name}</div><div className="mt-1 text-xs text-slate-500">Agent ID: {member.agent_id || "—"}</div><div className="text-xs text-slate-500">Referral Agent: {member.referral_agent_name || "—"}</div><div className="text-xs text-slate-500">Referral Agent ID: {member.referral_agent_id || "—"}</div></div><ChevronRight className="h-4 w-4 text-slate-400" /></div><div className="mt-3 text-sm text-slate-600">Current: {member.current_step}</div><div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-[#1f4fa3]" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500"><span>{progress}% complete · Follow-up: {member.follow_up_date || "—"}</span>{followUpStatus === "overdue" && <span className="font-medium text-rose-600">Overdue</span>}{followUpStatus === "soon" && <span className="font-medium text-amber-600">Due Soon</span>}</div></button>; })}{members.length === 0 && <div className="text-sm text-slate-500">No members in onboarding right now.</div>}</div></ScrollArea></CardContent></Card>
      <Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle>{selectedMember?.member_name || "Member Detail"}</CardTitle><CardDescription>Use the checklist to manage each onboarding stage clearly</CardDescription></CardHeader><CardContent>{selectedMember ? <div className="space-y-5"><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Name</div><div className="mt-2 font-medium">{selectedMember.member_name}</div></div><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Agent ID</div><div className="mt-2 font-mono font-medium">{selectedMember.agent_id || "—"}</div></div><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Referral Agent</div><div className="mt-2 font-medium">{selectedMember.referral_agent_name || "—"}</div></div><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Referral Agent ID</div><div className="mt-2 font-mono font-medium">{selectedMember.referral_agent_id || "—"}</div></div></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Follow-Up Date</div><Input type="date" className="mt-3" value={selectedMember.follow_up_date || ""} onChange={(e) => updateMemberField("follow_up_date", e.target.value)} /></div><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Open Issue</div><Textarea className="mt-3 min-h-[102px]" value={selectedMember.issue || ""} onChange={(e) => updateMemberField("issue", e.target.value)} /></div></div><div className="rounded-2xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Notes</div><Textarea className="mt-3 min-h-[120px]" value={selectedMember.notes || ""} onChange={(e) => updateMemberField("notes", e.target.value)} /></div><div className="rounded-3xl border border-slate-200 p-4"><div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700"><Clock3 className="h-4 w-4" /> Onboarding Progress Workflow</div><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{onboardingSteps.map((step, index) => { const checked = (selectedMember.completed_steps || []).includes(step); return <div key={step} className={cn("flex items-start gap-3 rounded-2xl border p-4", checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}><Checkbox checked={checked} onCheckedChange={() => toggleStep(step)} className="mt-1" /><div><div className="text-xs uppercase tracking-wide text-slate-500">Step {index + 1}</div><div className="mt-1 font-medium">{step}</div></div></div>; })}</div></div></div> : <div className="text-sm text-slate-500">No member selected.</div>}</CardContent></Card>
    </div>
  );
}

function TrainingView({ training, setTraining, syncClient, ownerEmail, setSyncStatus }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("Internal");
  const [notes, setNotes] = useState("");
  const addTraining = async () => {
    if (!title || !date) return;
    const row = { title, event_date: date, event_type: type, status: "Scheduled", notes, owner_email: ownerEmail };
    if (syncClient) {
      try {
        setSyncStatus("Saving...");
        const saved = await insertTrainingEvent(syncClient, row);
        setTraining((prev) => [saved, ...prev]);
        setSyncStatus("Saved");
      } catch {
        setSyncStatus("Save error");
        return;
      }
    } else {
      setTraining((prev) => [{ id: `TRN-${Date.now()}`, ...row }, ...prev]);
    }
    setTitle(""); setDate(""); setType("Internal"); setNotes("");
  };
  const toggleDone = async (item) => {
    const updated = { ...item, status: item.status === "Done" ? "Scheduled" : "Done" };
    setTraining((prev) => prev.map((row) => row.id === item.id ? updated : row));
    if (syncClient) {
      try {
        await updateTrainingEvent(syncClient, item.id, updated);
      } catch {
        setSyncStatus("Save error");
      }
    }
  };
  const handleDelete = async (item) => {
    setTraining((prev) => prev.filter((row) => row.id !== item.id));
    if (syncClient) {
      try {
        await deleteTrainingEvent(syncClient, item.id);
      } catch {
        setSyncStatus("Delete error");
      }
    }
  };
  return <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]"><Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>Schedule Training</CardTitle><CardDescription>Track internal training, provider sessions, and special product education</CardDescription></div><ExportMenu label="Training Schedule" rows={training} baseName="training-schedule" /></div></CardHeader><CardContent className="space-y-4"><div><Label>Training Title</Label><Input className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} /></div><div><Label>Date</Label><Input className="mt-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div><Label>Training Type</Label><div className="mt-2"><Select value={type} onValueChange={setType}><SelectContent>{TRAINING_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Notes</Label><Textarea className="mt-2 min-h-[120px]" value={notes} onChange={(e) => setNotes(e.target.value)} /></div><PrimaryButton className="w-full" onClick={addTraining}><Plus className="mr-2 h-4 w-4" /> Add Training Event</PrimaryButton></CardContent></Card><Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle>Training Schedule</CardTitle><CardDescription>Compact list view for quick operational planning</CardDescription></CardHeader><CardContent className="space-y-4">{training.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="font-medium">{item.title}</div><div className="mt-1 text-sm text-slate-500">{item.event_date} · {item.event_type}</div><div className="mt-3 text-sm text-slate-600">{item.notes}</div></div><div className="flex flex-wrap gap-2"><StatusBadge value={item.status} /><Button size="sm" variant="outline" className="rounded-xl" onClick={() => toggleDone(item)}>{item.status === "Done" ? "Reopen" : "Mark Done"}</Button><Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button></div></div></div>)}</CardContent></Card></div>;
}

function SmdBaseView({ smdBase }) {
  const referralGroups = smdBase.reduce((acc, agent) => { const key = agent.referral_agent_name || "Unassigned"; if (!acc[key]) acc[key] = []; acc[key].push(agent); return acc; }, {});
  return <div className="space-y-6"><Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>SMD Base</CardTitle><CardDescription>Completed agents archived from the onboarding hub</CardDescription></div><ExportMenu label="SMD Base" rows={smdBase} baseName="smd-base" /></div></CardHeader><CardContent><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{smdBase.map((agent) => <div key={agent.id} className="rounded-2xl border border-slate-200 p-4"><div className="font-medium text-slate-900">{agent.agent_name}</div><div className="mt-2 text-sm text-slate-500">Agent ID: {agent.agent_id || "—"}</div><div className="text-sm text-slate-500">Referral Agent: {agent.referral_agent_name || "—"}</div><div className="text-sm text-slate-500">Referral Agent ID: {agent.referral_agent_id || "—"}</div></div>)}</div></CardContent></Card><Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle>SMD Hierarchy View</CardTitle><CardDescription>Grouped by referral agent for a simple downline view</CardDescription></CardHeader><CardContent className="space-y-6">{Object.entries(referralGroups).map(([referralName, agents]) => <div key={referralName} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3"><div><div className="text-sm text-slate-500">Referral Agent</div><div className="text-lg font-semibold text-slate-900">{referralName}</div></div><Badge className="border border-blue-200 bg-blue-50 text-blue-700">{agents.length} Agent{agents.length > 1 ? "s" : ""}</Badge></div><div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{agents.map((agent) => <div key={`${agent.id}-hierarchy`} className="rounded-2xl bg-slate-50 p-4"><div className="font-medium text-slate-900">{agent.agent_name}</div><div className="mt-2 text-sm text-slate-500">Agent ID: {agent.agent_id || "—"}</div><div className="text-sm text-slate-500">Referral Agent ID: {agent.referral_agent_id || "—"}</div></div>)}</div></div>)}</CardContent></Card></div>;
}

export default function CaseOperationsCenter() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [dataStore, setDataStore] = useState(defaultData);
  const [syncMode, setSyncMode] = useState("local");
  const [syncStatus, setSyncStatus] = useState("Ready");

  const { profile, cases, members, smdBase, training } = dataStore;
  const client = getSupabaseClient();

  const setCases = (updater) => setDataStore((prev) => ({ ...prev, cases: typeof updater === "function" ? updater(prev.cases) : updater }));
  const setMembers = (updater) => setDataStore((prev) => ({ ...prev, members: typeof updater === "function" ? updater(prev.members) : updater }));
  const setSmdBase = (updater) => setDataStore((prev) => ({ ...prev, smdBase: typeof updater === "function" ? updater(prev.smdBase) : updater }));
  const setTraining = (updater) => setDataStore((prev) => ({ ...prev, training: typeof updater === "function" ? updater(prev.training) : updater }));

  useEffect(() => {
    if (!client) {
      setAuthChecked(true);
      return;
    }
    client.auth.getSession().then(async ({ data }) => {
      const email = data.session?.user?.email || "";
      if (email && isRecognizedEmail(email)) {
        const clean = slugUser(email);
        setUserEmail(clean);
        try {
          await upsertProfile(client, clean);
          const remoteData = await fetchTableData(client, clean);
          setDataStore(remoteData);
          setSyncMode("cloud");
          setSyncStatus("Cloud synced");
        } catch {
          setDataStore(loadLocalData(clean));
          setSyncMode("local");
          setSyncStatus("Loaded locally");
        }
      }
      setAuthChecked(true);
    });
    const { data: listener } = client.auth.onAuthStateChange(async (_event, session) => {
      const email = session?.user?.email || "";
      if (email && isRecognizedEmail(email)) {
        const clean = slugUser(email);
        setUserEmail(clean);
        try {
          await upsertProfile(client, clean);
          const remoteData = await fetchTableData(client, clean);
          setDataStore(remoteData);
          setSyncMode("cloud");
          setSyncStatus("Cloud synced");
        } catch {
          setDataStore(loadLocalData(clean));
          setSyncMode("local");
          setSyncStatus("Loaded locally");
        }
      } else {
        setUserEmail("");
        setDataStore(defaultData);
      }
      setAuthChecked(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userEmail && syncMode === "local") saveLocalData(userEmail, dataStore);
  }, [userEmail, dataStore, syncMode]);

  const handleSync = async () => {
    if (!client || !userEmail) {
      setSyncMode("local");
      setSyncStatus("Saved locally");
      if (userEmail) saveLocalData(userEmail, dataStore);
      return;
    }
    try {
      setSyncStatus("Syncing...");
      const remoteData = await fetchTableData(client, userEmail);
      setDataStore(remoteData);
      setSyncMode("cloud");
      setSyncStatus("Cloud synced");
    } catch {
      setSyncMode("local");
      setSyncStatus("Cloud error");
    }
  };

  const handleAuthSuccess = async (email) => {
    const clean = slugUser(email);
    setUserEmail(clean);
    if (!client) {
      setDataStore(loadLocalData(clean));
      setSyncMode("local");
      setSyncStatus("Workspace loaded locally");
      return;
    }
    try {
      await upsertProfile(client, clean);
      const remoteData = await fetchTableData(client, clean);
      setDataStore(remoteData);
      setSyncMode("cloud");
      setSyncStatus("Cloud synced");
    } catch {
      setDataStore(loadLocalData(clean));
      setSyncMode("local");
      setSyncStatus("Workspace loaded locally");
    }
  };

  const handleLogout = async () => {
    if (client) await client.auth.signOut();
    setUserEmail("");
    setDataStore(defaultData);
    setSyncMode("local");
    setSyncStatus("Logged out");
  };

  if (!authChecked) return <div className="p-8 text-sm text-slate-500">Loading authentication...</div>;
  if (!userEmail) return <AuthPanel onAuthSuccess={handleAuthSuccess} />;

  return (
    <AppShell activeSection={activeSection} setActiveSection={setActiveSection} syncMode={syncMode} syncStatus={syncStatus} onSync={handleSync} userEmail={userEmail} onLogout={handleLogout}>
      {activeSection === "dashboard" && <DashboardView cases={cases} members={members} training={training} smdBase={smdBase} setActiveSection={setActiveSection} />}
      {activeSection === "members" && <NewMemberHub members={members} setMembers={setMembers} setSmdBase={setSmdBase} syncClient={client} ownerEmail={userEmail} setSyncStatus={setSyncStatus} />}
      {activeSection === "smd" && <SmdBaseView smdBase={smdBase} />}
      {activeSection === "life" && <CasesView title="Life Insurance Case Management" seedType="Life Insurance" cases={cases} setCases={setCases} syncClient={client} ownerEmail={userEmail} setSyncStatus={setSyncStatus} />}
      {activeSection === "annuity" && <CasesView title="Annuity Case Management" seedType="Annuity" cases={cases} setCases={setCases} syncClient={client} ownerEmail={userEmail} setSyncStatus={setSyncStatus} />}
      {activeSection === "training" && <TrainingView training={training} setTraining={setTraining} syncClient={client} ownerEmail={userEmail} setSyncStatus={setSyncStatus} />}
    </AppShell>
  );
}
