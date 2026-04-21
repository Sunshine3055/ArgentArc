export const STORAGE_KEY_PREFIX = "case_operations_center_data";

export const PROVIDERS = [
  "Nationwide",
  "TFA",
  "Symetra",
  "Athene",
  "Allianz",
  "Pacific Life",
  "Other",
];

export const CASE_TYPES = ["Life Insurance", "Annuity"];

export const STATUS_OPTIONS = [
  "Active",
  "Pending",
  "Submitted",
  "Urgent",
  "Closed",
];

export const TRAINING_TYPES = [
  "Internal",
  "Provider",
  "Continuing Education",
  "Product Special Training",
  "WFG",
];

export const onboardingSteps = [
  "New Registered / Financial Academy",
  "Licensing Exam Preparation",
  "Finger Print Submission",
  "Licensing Exam",
  "License Application",
  "WFG Affiliation",
  "E&O Insurance",
  "New Agent Training",
  "Continue Education",
  "Provider Appointment",
  "Product Special Training",
  "BPM Training",
];

export const weeklyData = [
  { day: "Mon", completed: 5 },
  { day: "Tue", completed: 7 },
  { day: "Wed", completed: 4 },
  { day: "Thu", completed: 8 },
  { day: "Fri", completed: 6 },
  { day: "Sat", completed: 2 },
  { day: "Sun", completed: 1 },
];

export const statusClasses = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Submitted: "bg-blue-100 text-blue-700 border-blue-200",
  Urgent: "bg-rose-100 text-rose-700 border-rose-200",
  Closed: "bg-slate-200 text-slate-700 border-slate-300",
  Scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Done: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const defaultData = {
  profile: null,
  cases: [],
  members: [],
  smdBase: [],
  training: [],
};
