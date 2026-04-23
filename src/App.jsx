import React, { Suspense, lazy, useEffect, useState, useCallback } from "react"; // Added useCallback
import AuthPanel from "./components/AuthPanel";
import AppShell from "./components/AppShell";
import SetPasswordScreen from "./components/SetPasswordScreen";
import { defaultData } from "./constants";
import { loadLocalData, saveLocalData, slugUser, getStorageKey } from "./utils/helpers";
import { fetchTableData, getSupabaseClient, upsertProfile } from "./lib/supabase";

// Lazy views
const DashboardView = lazy(() => import("./views/DashboardView"));
const CasesView = lazy(() => import("./views/CasesView"));
const NewMemberHub = lazy(() => import("./views/NewMemberHub"));
const SmdBaseView = lazy(() => import("./views/SmdBaseView"));
const TrainingView = lazy(() => import("./views/TrainingView"));

function ViewFallback() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      Loading section...
    </div>
  );
}
export default function CaseOperationsCenter() {
  console.log("HASH:", window.location.hash); // ← add this
  const isRecoveryFlow = window.location.hash.includes("type=recovery");
  console.log("IS RECOVERY:", isRecoveryFlow); // ← and this
  const [needsPasswordSet, setNeedsPasswordSet] = useState(isRecoveryFlow);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [dataStore, setDataStore] = useState(defaultData);
  const [syncMode, setSyncMode] = useState("local");
  const [syncStatus, setSyncStatus] = useState("Ready");
  const isRecoveryFlow = window.location.hash.includes("type=recovery");
  const [needsPasswordSet, setNeedsPasswordSet] = useState(isRecoveryFlow);

  const { cases, members, smdBase, training } = dataStore;
  const client = getSupabaseClient();

  // --- State Updaters ---
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

  // --- Unified Auth & Sync Logic ---

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
        // Fallback to local if cloud fails
        const local = loadLocalData(clean);
        setSyncMode("local");
        setSyncStatus("Cloud error - Local mode");
      }
    }
  }, [client]);

  useEffect(() => {
  let isMounted = true;

  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
  console.log("AUTH EVENT:", event, session?.user?.email); // ← add this line
  const email = session?.user?.email;
  // ... rest of your code

  // Intercept password recovery — don't let them in, force password reset
  if (event === "PASSWORD_RECOVERY") {
    if (isMounted) {
      setNeedsPasswordSet(true);
      setAuthChecked(true);
    }
    return;
  }

  if (email) {
    setNeedsPasswordSet(false);
    syncUserData(email, isMounted);
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
}, [client, syncUserData]);

  // --- Local Persistence ---
  useEffect(() => {
    if (userEmail && syncStatus !== "Syncing...") {
      saveLocalData(userEmail, dataStore);
    }
  }, [userEmail, dataStore, syncStatus]);

  // --- Handlers ---

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
  if (client) await client.auth.signOut(); // await fully
  setUserEmail("");
  setDataStore(defaultData);
  window.location.reload();
};

  // --- Render Logic ---
if (!authChecked) {
  return <div className="p-8 text-sm text-slate-500">Loading authentication...</div>;
}

if (needsPasswordSet) {
  return (
    <SetPasswordScreen
      onComplete={(email) => {
        setNeedsPasswordSet(false);
        syncUserData(email, true);
      }}
    />
  );
}

if (!userEmail) {
  return <AuthPanel onAuthSuccess={(email) => syncUserData(email, true)} />;
}

  // Instead of killing syncClient when cloud fails, 
// pass client always and let individual writes handle errors
const activeSyncClient = client; // always pass the client

  return (
    <AppShell
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      syncMode={syncMode}
      syncStatus={syncStatus}
      onSync={handleSync}
      userEmail={userEmail}
      onLogout={handleLogout}
    >
      <Suspense fallback={<ViewFallback />}>
        {activeSection === "dashboard" && (
          <DashboardView
            cases={cases}
            members={members}
            training={training}
            smdBase={smdBase}
            setActiveSection={setActiveSection}
          />
        )}

        {activeSection === "members" && (
          <NewMemberHub
            members={members}
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
            cases={cases}
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
            cases={cases}
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
