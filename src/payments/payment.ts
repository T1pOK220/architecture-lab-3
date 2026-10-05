import {normalizePaymentStatus} from "./paymentStatus.ts";
export type PaymentPayload = {
  id: string;
  amount: number;
  currency: string;
  metadata: { orderId: string };
};

export type PaymentResponse = {
  chargeId: string;
  status: "paid" | "processing" | "failed";
};

export class PaymentProvider {
  async createCharge(payload: PaymentPayload): Promise<PaymentResponse> {
    const state =
      payload.id.startsWith("fail_")
        ? "declined"
        : payload.id.startsWith("processing_")
          ? "requires_action"
          : "succeeded";

    return {
      chargeId: `ch_${payload.id}`,
      status: normalizePaymentStatus(state),
    };
  }
}