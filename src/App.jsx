import React, { Suspense, lazy, useEffect, useState, useCallback } from "react";
import AuthPanel from "./components/AuthPanel";
import AppShell from "./components/AppShell";
import SetPasswordScreen from "./components/SetPasswordScreen";
import { defaultData } from "./constants";
import { loadLocalData, saveLocalData, slugUser, getStorageKey } from "./utils/helpers";
import { fetchTableData, getSupabaseClient, upsertProfile } from "./lib/supabase";

const AllCasesView = lazy(() => import("./views/AllCasesView"));
const DashboardView = lazy(() => import("./views/DashboardView"));
const CasesView = lazy(() => import("./views/CasesView"));
const NewMemberHub = lazy(() => import("./views/NewMemberHub"));
const SmdBaseView = lazy(() => import("./views/SmdBaseView"));
const TrainingView = lazy(() => import("./views/TrainingView"));

const client = getSupabaseClient();

function ViewFallback() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      Loading section...
    </div>
  );
}

export default function CaseOperationsCenter() {
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [dataStore, setDataStore] = useState(defaultData);
  const [syncMode, setSyncMode] = useState("local");
  const [syncStatus, setSyncStatus] = useState("Ready");
  const [searchQuery, setSearchQuery] = useState("");

  const { cases, members, smdBase, training } = dataStore;

  const setCases = (updater) =>
    setDataStore((prev) => ({
      ...prev,
      cases: typeof updater === "function" ? updater(prev.cases) : updater,
    }));

  const setMembers = (updater) =>
    setDataStore((prev) => ({
      ...prev,
      members: typeof updater === "function" ? updater(prev.members) : updater,
    }));

  const setSmdBase = (updater) =>
    setDataStore((prev) => ({
      ...prev,
      smdBase: typeof updater === "function" ? updater(prev.smdBase) : updater,
