export type NuruPromptOptionId =
  | "create-invoice"
  | "check-balance"
  | "preview-payout"
  | "review-document";

export type NuruPromptOption = {
  id: NuruPromptOptionId;
  label: string;
  prompt: string;
};

export const nuruPromptOptions: NuruPromptOption[] = [
  {
    id: "create-invoice",
    label: "Create invoice",
    prompt: "create invoice for Jane Doe for $500",
  },
  {
    id: "check-balance",
    label: "Check balance",
    prompt: "What is our treasury balance?",
  },
  {
    id: "preview-payout",
    label: "Preview payout",
    prompt: "Preview a payout of $500 to Jane Doe",
  },
  {
    id: "review-document",
    label: "Review document",
    prompt: "Summarize the attached invoice or contract",
  },
];
