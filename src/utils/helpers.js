import { defaultData } from "../constants";

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function slugUser(email) {
  return (email || "guest").trim().toLowerCase();
}

export function getStorageKey(userEmail) {
  return `case_operations_center_data_${slugUser(userEmail)}`;
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

export function normalizeMember(row) {
  return {
    ...row,
    completed_steps: Array.isArray(row?.completed_steps)
      ? row.completed_steps
      : typeof row?.completed_steps === "string" && row.completed_steps
        ? [row.completed_steps]
        : [],
  };
}

export function getFollowUpStatus(date) {
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

export function loadLocalData(userEmail) {
  if (typeof window === "undefined" || !userEmail) return defaultData;

  try {
    const raw = window.localStorage.getItem(getStorageKey(userEmail));
    if (!raw) return defaultData;

    const parsed = JSON.parse(raw);
    return {
      ...defaultData,
      ...parsed,
      members: (parsed.members || defaultData.members).map(normalizeMember),
    };
  } catch {
    return defaultData;
  }
}

export function saveLocalData(userEmail, data) {
  if (typeof window === "undefined" || !userEmail) return;

  try {
    window.localStorage.setItem(getStorageKey(userEmail), JSON.stringify(data));
  } catch {
    // ignore localStorage failures
  }
}
