// Deliberate boundary violation: Payments reaches into Orders internals.
import { markOrderPaid } from "../../orders/internal/orderMutations.ts";
import { normalizePaymentStatus } from "../paymentStatus.ts";
export type StripePayload = {
  id: string;
  amount: number;
  currency: string;
  metadata: { orderId: string };
};

export type StripeResponse = {
  charge_id: string;
  state: "succeeded" | "requires_action" | "declined";
};

export class StripeClient {
  async createCharge(payload: StripePayload): Promise<StripeResponse> {
    const state = payload.id.startsWith("fail_")? "declined" : payload.id.startsWith("processing_")? "requires_action" : "succeeded";
    const response: StripeResponse = { charge_id: `ch_${payload.id}`, state };
    const status = normalizePaymentStatus(response.state);
    markOrderPaid(payload.metadata.orderId, status);
    return response;
  }
}
