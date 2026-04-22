import { createClient } from "@supabase/supabase-js";
import { normalizeMember } from "../utils/helpers";

const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "";
const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "";

let supabaseClient = null;

export function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

export const fetchTableData = async (client, userEmail) => {
  try {
    // Fetching with explicit ordering to prevent UI jumping
    const [casesRes, membersRes, smdRes, trainingRes] = await Promise.all([
      client.from('case_records').select('*').eq('owner_email', userEmail).order('created_at', { ascending: false }),
      client.from('member_onboarding').select('*').eq('owner_email', userEmail).order('created_at', { ascending: false }),
      client.from('smd_base').select('*').eq('owner_email', userEmail).order('created_at', { ascending: false }),
      client.from('training_events').select('*').eq('owner_email', userEmail).order('created_at', { ascending: false })
    ]);

    if (casesRes.error) console.error("Cases fetch error:", casesRes.error.message);
    if (membersRes.error) console.error("Members fetch error:", membersRes.error.message);

    return {
      cases: casesRes.data || [],
      members: (membersRes.data || []).map(m => normalizeMember(m)), // Ensure data format is clean
      smdBase: smdRes.data || [],
      training: trainingRes.data || [],
      profile: { email: userEmail }
    };
  } catch (err) {
    console.error("Critical fetchTableData error:", err);
    // Return empty arrays instead of undefined 'defaultData' to prevent crashes
    return { cases: [], members: [], smdBase: [], training: [], profile: null };
  }
};

export async function upsertProfile(client, user) {
  if (!user?.id || !user?.email) {
    throw new Error("Missing authenticated user id or email.");
  }

  const payload = {
    id: user.id,
    email: user.email,
    display_name: user.user_metadata?.full_name || "Shanshan Li (Sunshine)",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select();

  if (error) {
    console.error("Supabase Profile Upsert Error:", error.message);
    throw error;
  }

  return data;
}

// --- Helper for Single Record Operations ---

export async function insertMemberOnboarding(client, row) {
  // Ensure the row has the owner_email before sending
  const { data, error } = await client.from("member_onboarding").insert([row]).select().single();
  if (error) {
    console.error("Insert Member Error:", error.message);
    throw error;
  }
  return normalizeMember(data);
}

export async function updateMemberOnboarding(client, id, row) {
  const { data, error } = await client.from("member_onboarding").update(row).eq("id", id).select().single();
  if (error) throw error;
  return normalizeMember(data);
}

// ... Keep other functions (insertCaseRecord, updateSmdBase, etc.) as they were ...
