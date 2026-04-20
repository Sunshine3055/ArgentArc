export const STORAGE_KEY_PREFIX = "case_operations_center_data";

export const ALLOWED_MEMBER_EMAILS = [
  "shanshanli3055@gmail.com",
  "shanshanli3055@yahoo.com",
  "sli.life3055@gmail.com",
  "agent1@company.com",
  "agent2@company.com",
  "admin@company.com",
];

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
export const STATUS_OPTIONS = ["Active", "Pending", "Submitted", "Urgent", "Closed"];
export const TRAINING_TYPES = [
  "Internal",
  "Provider",
  "Continuing Education",
  "Product Special Training",
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
  cases: [
    {
      id: "ANN-24018",
      client_name: "David Lin",
      case_type: "Annuity",
      provider: "Athene",
      provider_other: "",
      status: "Pending",
      follow_up_date: "2026-04-18",
      notes: "Waiting for transfer confirmation and follow-up with case manager.",
      last_log: "Checked funding status this morning.",
    },
    {
      id: "LIF-24019",
      client_name: "Hui Zhen Lin",
      case_type: "Life Insurance",
      provider: "Symetra",
      provider_other: "",
      status: "Submitted",
      follow_up_date: "2026-04-16",
      notes: "Application submitted. Monitor underwriting requirements.",
      last_log: "Cover letter sent to support underwriting review.",
    },
  ],
  members: [
    {
      id: "MBR-1021",
      member_name: "Kehui Xie",
      agent_id: "AG-7812",
      referral_agent_name: "Dening Fang",
      referral_agent_id: "AG-7001",
      current_step: "License Application",
      issue: "State submission mismatch needs review.",
      follow_up_date: "2026-04-19",
      notes: "Licensing record reviewed. Waiting for corrected submission confirmation.",
      completed_steps: [
        "New Registered / Financial Academy",
        "Licensing Exam Preparation",
        "Finger Print Submission",
        "Licensing Exam",
      ],
    },
  ],
  smdBase: [
    {
      id: "SMD-001",
      agent_name: "Alicia Chen",
      agent_id: "AG-6008",
      referral_agent_name: "Xiaoqin Niu",
      referral_agent_id: "AG-5001",
    },
  ],
  training: [
    {
      id: "TRN-01",
      title: "Athene Product Basics",
      event_date: "2026-04-17",
      event_type: "Provider",
      status: "Scheduled",
      notes: "Review annuity product positioning and client profile fit.",
    },
  ],
};
