import React, { Suspense, lazy, useEffect, useState, useCallback } from "react";
import AuthPanel from "./components/AuthPanel";
import AppShell from "./components/AppShell";
import SetPasswordScreen from "./components/SetPasswordScreen";
import { defaultData } from "./constants";
import { loadLocalData, saveLocalData, slugUser, getStorageKey } from "./utils/helpers";
import { fetchTableData, getSupabaseClient, upsertProfile } from "./lib/supabase";

const DashboardView = lazy(() => import("./views/DashboardView"));
const CasesView = lazy(() => import("./views/CasesView"));
const NewMemberHub = lazy(() => import("./views/NewMemberHub"));
const SmdBaseView = lazy(() => import("./views/SmdBaseView"));
const TrainingView = lazy(() => import("./views/TrainingView"));
const AllCasesView = lazy(() => import("./views/AllCasesView"));

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

  // Auto-clear stale recovery flag older than 30 minutes
  useEffect(() => {
    const flag = localStorage.getItem("pendingPasswordReset");
    const timestamp = localStorage.getItem("pendingPasswordResetTime");
    if (flag && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age > 30 * 60 * 1000) {
        localStorage.removeItem("pendingPasswordReset");
        localStorage.removeItem("pendingPasswordResetTime");
      }
    }
  }, []);

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
    }));

  const setTraining = (updater) =>
    setDataStore((prev) => ({
      ...prev,
      training: typeof updater === "function" ? updater(prev.training) : updater,
    }));

  const syncUserData = useCallback(async (email, isMounted) => {
    if (!client || !email) return;
    const clean = slugUser(email);
    if (isMounted) setUserEmail(clean);
    try {
      setSyncStatus("Syncing...");
      await upsertProfile(client, clean);
      const remoteData = await fetchTableData(client, clean);
      if (isMounted) {
        setDataStore(remoteData);
        setSyncMode("cloud");
        setSyncStatus("Cloud synced");
      }
    } catch (err) {
      console.error("Sync error:", err);
      if (isMounted) {
        setSyncMode("local");
        setSyncStatus("Cloud error - Local mode");
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      const email = session?.user?.email;

      if (localStorage.getItem("pendingPasswordReset") === "true") {
        if (isMounted) {
          setNeedsPasswordSet(true);
          setAuthChecked(true);
        }
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        if (isMounted) {
          setNeedsPasswordSet(true);
          setAuthChecked(true);
        }
        return;
      }

      if (event === "SIGNED_IN" && window.location.search.includes("recovery=true")) {
        if (isMounted) {
          setNeedsPasswordSet(true);
          setAuthChecked(true);
        }
        return;
      }

      if (email) {
        if (isMounted) syncUserData(email, isMounted);
      } else {
        if (isMounted) {
          setUserEmail("");
          setDataStore(defaultData);
          setSyncMode("local");
          setSyncStatus("Logged out");
        }
      }

      if (isMounted) setAuthChecked(true);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [syncUserData]);

  useEffect(() => {
    if (userEmail && syncStatus !== "Syncing...") {
      saveLocalData(userEmail, dataStore);
    }
  }, [userEmail, dataStore, syncStatus]);

  const handleSync = async () => {
    if (!client || !userEmail) {
      setSyncStatus("Saved locally");
      if (userEmail) saveLocalData(userEmail, dataStore);
      return;
    }
    await syncUserData(userEmail, true);
  };

  const handleLogout = async () => {
    const currentEmail = userEmail;
    if (currentEmail) localStorage.removeItem(getStorageKey(currentEmail));
    localStorage.removeItem("pendingPasswordReset");
    localStorage.removeItem("pendingPasswordResetTime");
    if (client) await client.auth.signOut();
    setUserEmail("");
    setDataStore(defaultData);
    window.location.reload();
  };

  // --- Render Logic ---
  if (needsPasswordSet) {
    return (
      <SetPasswordScreen
        onComplete={(email) => {
          localStorage.removeItem("pendingPasswordReset");
          localStorage.removeItem("pendingPasswordResetTime");
          setNeedsPasswordSet(false);
          syncUserData(email, true);
        }}
      />
    );
  }

  if (!authChecked) {
    return <div className="p-8 text-sm text-slate-500">Loading authentication...</div>;
  }

  if (!userEmail) {
    return <AuthPanel onAuthSuccess={(email) => syncUserData(email, true)} />;
  }

  const activeSyncClient = client;

  // --- Search Filters ---
  const filteredCases = searchQuery.trim()
    ? cases.filter((c) =>
        c.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : cases;

  const filteredMembers = searchQuery.trim()
    ? members.filter((m) =>
        m.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;
  const handleSetActiveSection = (section) => {
  setSearchQuery("");
  setActiveSection(section);
};

  return (
    <AppShell
      activeSection={activeSection}
      setActiveSection={handleSetActiveSection}
      syncMode={syncMode}
      syncStatus={syncStatus}
      onSync={handleSync}
      userEmail={userEmail}
      onLogout={handleLogout}
      training={training}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      <Suspense fallback={<ViewFallback />}>
        {activeSection === "dashboard" && (
  <DashboardView
    cases={cases}
    members={members}
    training={training}
    smdBase={smdBase}
    setActiveSection={handleSetActiveSection}
    syncClient={activeSyncClient}
    ownerEmail={userEmail}
    filteredCases={filteredCases}
    filteredMembers={filteredMembers}
    searchQuery={searchQuery}
  />
)}
        {activeSection === "allcases" && (
          <AllCasesView
            cases={filteredCases}
            setActiveSection={handleSetActiveSection}
          />
        )}
        {activeSection === "members" && (
          <NewMemberHub
            members={filteredMembers}
            setMembers={setMembers}
            setSmdBase={setSmdBase}
            syncClient={activeSyncClient}
            ownerEmail={userEmail}
            setSyncStatus={setSyncStatus}
          />
        )}
        {activeSection === "smd" && (
          <SmdBaseView
            smdBase={smdBase}
            setSmdBase={setSmdBase}
            syncClient={activeSyncClient}
            setSyncStatus={setSyncStatus}
          />
        )}
        {activeSection === "life" && (
          <CasesView
            title="Life Insurance Case Management"
            seedType="Life Insurance"
            cases={filteredCases}
            setCases={setCases}
            syncClient={activeSyncClient}
            ownerEmail={userEmail}
            setSyncStatus={setSyncStatus}
          />
        )}
        {activeSection === "annuity" && (
          <CasesView
            title="Annuity Case Management"
            seedType="Annuity"
            cases={filteredCases}
            setCases={setCases}
            syncClient={activeSyncClient}
            ownerEmail={userEmail}
            setSyncStatus={setSyncStatus}
          />
        )}
        {activeSection === "training" && (
          <TrainingView
            training={training}
            setTraining={setTraining}
            syncClient={activeSyncClient}
            ownerEmail={userEmail}
            setSyncStatus={setSyncStatus}
          />
        )}
      </Suspense>
    </AppShell>
  );
}
