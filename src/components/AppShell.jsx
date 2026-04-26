import React from "react";
import { Bell, Building2, GraduationCap, Landmark, LayoutDashboard, LogOut, Search, ShieldCheck, UserCircle2, Users } from "lucide-react";
import { cn } from "../utils/helpers";
import { Button, Input } from "./ui";
import { SyncBadge } from "./common";

export default function AppShell({ children, activeSection, setActiveSection, syncMode, syncStatus, onSync, userEmail, onLogout, training = [], searchQuery = "", setSearchQuery }) {
  
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
          <div className="flex h-24 items-center border-b border-white/10 px-6 py-6 mt-2">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-blue-100">Professional Case Management</div>
              <div className="mt-1 text-2xl font-semibold">Case Operations Center</div>
            </div>
          </div>
          <div className="px-4 py-5">
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wider text-blue-100">Signed In</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium"><UserCircle2 className="h-4 w-4" /> {userEmail}</div>
              <Button variant="secondary" className="mt-3 h-9 rounded-xl bg-white text-[#1f4fa3] hover:bg-slate-100" onClick={onLogout}><LogOut className="mr-2 h-4 w-4" /> Log Out</Button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.key;
                return (
                  <button key={item.key} onClick={() => setActiveSection(item.key)} className={cn("flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition", active ? "bg-white text-[#1f4fa3] shadow-sm" : "text-blue-50 hover:bg-white/10")}>
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Upcoming Training */}
            {training.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 px-1 text-xs uppercase tracking-wider text-blue-100">Upcoming Training</div>
                <div className="space-y-2">
                  {training.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/10 p-3">
                      <div className="text-sm font-medium text-white">{item.title}</div>
                      <div className="mt-1 text-xs text-blue-200">{item.event_date} · {item.event_type}</div>
                      {item.notes && <div className="mt-1 text-xs text-blue-300 line-clamp-2">{item.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
  <Input
    placeholder="Search client name, member name..."
    className="pl-9"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
</div>
                <SyncBadge mode={syncMode} syncStatus={syncStatus} onSync={onSync} />
                <Button variant="outline" className="rounded-xl"><Bell className="mr-2 h-4 w-4" /> Alerts</Button>
              </div>
            </div>
          </header>
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

