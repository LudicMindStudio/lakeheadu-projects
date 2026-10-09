export const FILTER_GROUPS = [
  {
    id: "cost",
    legend: "Cost",
    options: [
      { value: "free", label: "Free" },
      { value: "not-free", label: "Has a fee" },
    ],
  },
  {
    id: "nature",
    legend: "Ways to get help",
    options: [
      { value: "in-person", label: "In person" },
      { value: "group-programming", label: "Group program" },
      { value: "individual-programming", label: "One-on-one" },
      { value: "remote", label: "Remote" },
      { value: "phone", label: "By phone" },
      { value: "video-call-individual", label: "Video call (one-on-one)" },
      { value: "video-call-group", label: "Video call (group)" },
      { value: "mhealth-app", label: "App" },
      { value: "text-based", label: "Text-based" },
    ],
  },
  {
    id: "referral",
    legend: "Do I need a referral?",
    options: [
      { value: "self", label: "No, I can reach out directly" },
      { value: "required", label: "Yes, a referral is needed" },
    ],
  },
  {
    id: "considerations",
    legend: "Designed with consideration for",
    options: [
      { value: "indigenous", label: "Indigenous people" },
      { value: "women", label: "Women" },
      { value: "lgbtq-plus", label: "LGBTQ+" },
    ],
  },
  {
    id: "ages",
    legend: "Age range",
    options: [
      { value: "under-18", label: "Under 18" },
      { value: "18-65", label: "18 to 65" },
      { value: "65-plus", label: "65 and over" },
    ],
  },
  {
    id: "concerns",
    legend: "I want help with",
    options: [
      { value: "depression", label: "Depression" },
      { value: "anxiety", label: "Anxiety" },
      { value: "stress", label: "Stress" },
      { value: "trauma", label: "Trauma" },
      { value: "sleep", label: "Sleep" },
      { value: "relationships", label: "Relationships" },
      { value: "substance-use", label: "Substance use" },
    ],
  },
];

const labelIndex = new Map(
  FILTER_GROUPS.flatMap((group) =>
    group.options.map((option) => [`${group.id}:${option.value}`, option.label]),
  ),
);

export function optionLabel(groupId, value) {
  return labelIndex.get(`${groupId}:${value}`) ?? value;
}

export function emptyFilters() {
  return Object.fromEntries(FILTER_GROUPS.map((group) => [group.id, []]));
}

export const COST_LABELS = { free: "Free", "not-free": "Has a fee" };

export const REFERRAL_LABELS = { self: "No referral needed", required: "Referral needed" };

export const REFERRAL_NOTES = {
  self: "No referral needed. You can reach out directly.",
  required: "A referral is needed to get started.",
};

// The availability states, in the words readers see.
export const STATUS_LABELS = {
  accepting: "Accepting new clients",
  "call-first": "Call to check",
  waitlist: "Waitlist",
};

export const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "closest", label: "Closest first" },
  { value: "cost", label: "Cost (free first)" },
];
