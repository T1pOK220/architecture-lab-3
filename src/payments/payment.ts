import { LocalPaymentAdapter } from "./internal/LocalPaymentAdapter.ts";
import { StripeClient } from "./internal/StripeClient.ts";
import { normalizePaymentStatus } from "./paymentStatus.ts";
import type {
  PaymentPayload,
  PaymentResponse,
} from "./types.ts";

export type PaymentProviderName = "stripe" | "local";

type PaymentAdapter = {
    createCharge(payload: PaymentPayload): Promise<PaymentResponse>;
};
const stripe = new StripeClient();

export class PaymentProvider {
  private readonly adapter: PaymentAdapter;

  constructor(provider: PaymentProviderName = "stripe") {
   this.adapter =
  provider === "local"
    ? new LocalPaymentAdapter()
    : {
        async createCharge(payload: PaymentPayload): Promise<PaymentResponse> {
          const response = await stripe.createCharge(payload);

          return {
            chargeId: response.charge_id,
            status: normalizePaymentStatus(response.state),
          };
        },
      };
  }

  async createCharge(
    payload: PaymentPayload,
  ): Promise<PaymentResponse> {
  return this.adapter.createCharge(payload);
  }
}

