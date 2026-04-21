import { slugUser, normalizeMember } from "../utils/helpers";

const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "";
const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "";

export function getSupabaseClient(createClient) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch {
    return null;
  }
}

export async function fetchTableData(client, userEmail) {
  const cleanEmail = slugUser(userEmail);

  const [profileRes, casesRes, membersRes, smdBaseRes, trainingRes] =
    await Promise.all([
      client
        .from("profiles")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle(),

      client
        .from("case_records")
        .select("*")
        .eq("owner_email", cleanEmail)
        .order("created_at", { ascending: false }),

      client
        .from("member_onboarding")
        .select("*")
        .eq("owner_email", cleanEmail)
        .order("created_at", { ascending: false }),

      client
        .from("smd_base")
        .select("*")
        .eq("owner_email", cleanEmail)
        .order("created_at", { ascending: false }),

      client
        .from("training_events")
        .select("*")
        .eq("owner_email", cleanEmail)
        .order("created_at", { ascending: false }),
    ]);

  if (profileRes.error) throw profileRes.error;
  if (casesRes.error) throw casesRes.error;
  if (membersRes.error) throw membersRes.error;
  if (smdBaseRes.error) throw smdBaseRes.error;
  if (trainingRes.error) throw trainingRes.error;

  return {
    profile: profileRes.data || null,
    cases: casesRes.data || [],
    members: (membersRes.data || []).map(normalizeMember),
    smdBase: smdBaseRes.data || [],
    training: trainingRes.data || [],
  };
}

export async function upsertProfile(client, userEmail) {
  const payload = {
    email: slugUser(userEmail),
    display_name: "Shanshan Li (Sunshine)",
  };
  await client.from("profiles").upsert(payload, { onConflict: "email" });
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


