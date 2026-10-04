
export type PaymentStatus = "paid" | "processing" | "failed";

export function normalizePaymentStatus(
    state: "succeeded" | "requires_action" | "declined" | string
): PaymentStatus {
  if (state === "succeeded") return "paid";
  if (state === "requires_action") return "processing";
  return "failed";
}