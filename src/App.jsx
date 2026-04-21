import React, { Suspense, lazy, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AuthPanel from "./components/AuthPanel";
import AppShell from "./components/AppShell";
import { defaultData } from "./constants";
import { loadLocalData, saveLocalData, slugUser, getStorageKey, isRecognizedEmail } from "./utils/helpers";
import { fetchTableData, getSupabaseClient, upsertProfile } from "./lib/supabase";

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
  const [activeSection, setActiveSection] = useState("dashboard");
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [dataStore, setDataStore] = useState(defaultData);
  const [syncMode, setSyncMode] = useState("local");
  const [syncStatus, setSyncStatus] = useState("Ready");

  const { cases, members, smdBase, training } = dataStore;
  const client = getSupabaseClient(createClient);

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
        } catch (err) {
          console.error("initial session load error:", err);
          setDataStore({
            profile: null,
            cases: [],
            members: [],
            smdBase: [],
            training: [],
          });
          setSyncMode("local");
          setSyncStatus("Cloud error");
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
        } catch (err) {
          console.error("auth state load error:", err);
          setDataStore({
            profile: null,
            cases: [],
            members: [],
            smdBase: [],
            training: [],
          });
          setSyncMode("local");
          setSyncStatus("Cloud error");
        }
      } else {
        setUserEmail("");
        setDataStore(defaultData);
      }

      setAuthChecked(true);
    });

    return () => listener.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (userEmail) {
      saveLocalData(userEmail, dataStore);
    }
  }, [userEmail, dataStore]);

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
    } catch (err) {
      console.error("auth success load error:", err);
      setDataStore({
        profile: null,
        cases: [],
        members: [],
        smdBase: [],
        training: [],
      });
      setSyncMode("local");
      setSyncStatus("Cloud error");
    }
  };

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
    } catch (err) {
      console.error("handleSync error:", err);
      setSyncMode("local");
      setSyncStatus("Cloud error");
    }
  };

  const handleLogout = async () => {
    const currentEmail = userEmail;

    setUserEmail("");
    setDataStore(defaultData);
    setSyncMode("local");
    setSyncStatus("Logged out");

    if (typeof window !== "undefined" && currentEmail) {
      try {
        window.localStorage.removeItem(getStorageKey(currentEmail));
      } catch (err) {
        console.error("local cleanup error:", err);
      }
    }

    try {
      if (client) {
        await client.auth.signOut();
      }
    } catch (err) {
      console.error("logout error:", err);
    } finally {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  if (!authChecked) {
    return <div className="p-8 text-sm text-slate-500">Loading authentication...</div>;
  }

  if (!userEmail) {
    return <AuthPanel onAuthSuccess={handleAuthSuccess} createClient={createClient} />;
  }

  const activeSyncClient = syncMode === "cloud" ? client : null;

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
