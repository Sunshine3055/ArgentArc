import { createClient } from "@supabase/supabase-js";
import { slugUser, normalizeMember } from "../utils/helpers";
import { defaultData } from "../constants";

const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "";
const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "";

let supabaseClient = null;

export function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!supabaseClient) {
   supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true,
    flowType: "pkce",
  }
});
  }
  return supabaseClient;
}

export async function isAllowedUser(client, email) {
  const cleanEmail = (email || "").trim().toLowerCase();

  const { data, error } = await client
    .from("allowed_users")
    .select("email")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
// src/lib/supabase.js

export const fetchTableData = async (client, userEmail) => {
  try {
    const { data: { user } } = await client.auth.getUser();
    console.log("FETCH USER:", user?.id, user?.email);
    if (!user) return defaultData;

    const [casesRes, membersRes, smdRes, trainingRes] = await Promise.all([
      client.from('case_records').select('*').eq('owner_id', user.id),
      client.from('member_onboarding').select('*').eq('owner_id', user.id),
      client.from('smd_base').select('*').eq('owner_id', user.id),
      client.from('training_events').select('*').eq('owner_id', user.id),
    ]);

    console.log("CASES:", casesRes.data, casesRes.error);
    console.log("TRAINING:", trainingRes.data, trainingRes.error);
    console.log("MEMBERS:", membersRes.data, membersRes.error);
    console.log("SMD:", smdRes.data, smdRes.error);

    return {
      cases: casesRes.data || [],
      members: membersRes.data || [],
      smdBase: smdRes.data || [],
      training: trainingRes.data || [],
      profile: { email: userEmail }
    };
  } catch (err) {
    console.error("Critical fetchTableData error:", err);
    return defaultData;
  }
};

export async function upsertProfile(client, userEmail) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  const payload = {
    id: user.id,
    email: userEmail,
    display_name: "Shanshan Li (Sunshine)",
    role: "agent",
    is_approved: true,
    approved: true,
  };
  await client.from("profiles").upsert(payload, { onConflict: "id" });
}

export async function insertCaseRecord(client, row) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await client.from("case_records")
    .insert({ ...row, owner_id: user.id })
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateCaseRecord(client, id, row) {
  const { data, error } = await client.from("case_records").update(row).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCaseRecord(client, id) {
  const { error } = await client.from("case_records").delete().eq("id", id);
  if (error) throw error;
}

export async function insertMemberOnboarding(client, row) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await client.from("member_onboarding")
    .insert({ ...row, owner_id: user.id })
    .select().single();
  if (error) throw error;
  return normalizeMember(data);
}

export async function updateMemberOnboarding(client, id, row) {
  const { data, error } = await client.from("member_onboarding").update(row).eq("id", id).select().single();
  if (error) throw error;
  return normalizeMember(data);
}

export async function deleteMemberOnboarding(client, id) {
  const { error } = await client.from("member_onboarding").delete().eq("id", id);
  if (error) throw error;
}

export async function insertSmdBase(client, row) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await client.from("smd_base")
    .insert({ ...row, owner_id: user.id })
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateSmdBase(client, id, row) {
  const { data, error } = await client.from("smd_base").update(row).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function insertTrainingEvent(client, row) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload = {
    ...row,
    owner_id: user.id,
  };

  const { data, error } = await client.from("training_events").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateTrainingEvent(client, id, row) {
  const { data, error } = await client.from("training_events").update(row).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTrainingEvent(client, id) {
  const { error } = await client.from("training_events").delete().eq("id", id);
  if (error) throw error;
}
export async function fetchWeeklyActivity(client, userEmail) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const start = monday.toISOString();
  const end = sunday.toISOString();

  const [casesRes, membersRes, smdRes, trainingRes] = await Promise.all([
    client.from("case_records").select("created_at").eq("owner_email", userEmail).gte("created_at", start).lte("created_at", end),
    client.from("member_onboarding").select("created_at").eq("owner_email", userEmail).gte("created_at", start).lte("created_at", end),
    client.from("smd_base").select("created_at").eq("owner_email", userEmail).gte("created_at", start).lte("created_at", end),
    client.from("training_events").select("created_at").eq("owner_email", userEmail).gte("created_at", start).lte("created_at", end),
  ]);

  const allRecords = [
    ...(casesRes.data || []),
    ...(membersRes.data || []),
    ...(smdRes.data || []),
    ...(trainingRes.data || []),
  ];

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

  allRecords.forEach((record) => {
    const d = new Date(record.created_at);
    const dayIndex = d.getDay(); // 0=Sun, 1=Mon...
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex];
    if (counts[dayName] !== undefined) counts[dayName]++;
  });

  return days.map((day) => ({ day, completed: counts[day] }));
}

