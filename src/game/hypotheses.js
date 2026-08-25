export const HYPOTHESES = [
  {
    id: "credential_compromise",
    label: "Stolen credentials were used to move money",
  },
  {
    id: "insider_theft",
    label: "An employee siphoned funds from an account they own",
  },
  {
    id: "billing_error",
    label: "A billing or pricing error caused the drop",
  },
  {
    id: "vendor_failure",
    label: "A vendor or partner process failed",
  },
  {
    id: "ordinary_variance",
    label: "The drop is ordinary variance, not a real incident",
  },
];

export function hypothesisLabel(id) {
  return HYPOTHESES.find((item) => item.id === id)?.label ?? id;
}
