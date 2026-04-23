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
    // Fetch everything in parallel
    const [casesRes, membersRes, smdRes, trainingRes] = await Promise.all([
      client.from('case_records').select('*').eq('owner_email', userEmail),
      client.from('member_onboarding').select('*').eq('owner_email', userEmail),
      client.from('smd_base').select('*').eq('owner_email', userEmail),
      client.from('training_events').select('*').eq('owner_email', userEmail)
    ]);

    // Check for errors in any of the requests
    if (casesRes.error) console.error("Cases fetch error:", casesRes.error.message);
    if (membersRes.error) console.error("Members fetch error:", membersRes.error.message);

    return {
      cases: casesRes.data || [],
      members: membersRes.data || [],
      smdBase: smdRes.data || [],
      training: trainingRes.data || [],
      profile: { email: userEmail }
    };
  } catch (err) {
    console.error("Critical fetchTableData error:", err);
    return defaultData; // Return empty state instead of crashing
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
  const { data, error } = await client.from("case_records").insert(row).select().single();
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
  const { data, error } = await client.from("member_onboarding").insert(row).select().single();
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
  const { data, error } = await client.from("smd_base").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateSmdBase(client, id, row) {
  const { data, error } = await client.from("smd_base").update(row).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function insertTrainingEvent(client, row) {
  const { data, error } = await client.from("training_events").insert(row).select().single();
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


