import type {
  PaymentPayload,
  PaymentResponse,
} from "../types.ts";

type LocalPaymentRequest = {
  paymentReference: string;
  value: number;
  currencyCode: string;
};

type LocalPaymentResponse = {
  transactionId: string;
  result: "approved" | "waiting" | "rejected";
};

export class LocalPaymentAdapter {
  async createCharge(
    payload: PaymentPayload,
  ): Promise<PaymentResponse> {
    const request: LocalPaymentRequest = {
      paymentReference: payload.id,
      value: payload.amount,
      currencyCode: payload.currency,
    };

    const response: LocalPaymentResponse = {
      transactionId: `local_${request.paymentReference}`,
      result: request.paymentReference.startsWith("fail_")
        ? "rejected"
        : request.paymentReference.startsWith("processing_")
          ? "waiting"
          : "approved",
    };

    return {
      chargeId: response.transactionId,
      status:
        response.result === "approved"
          ? "paid"
          : response.result === "waiting"
            ? "processing"
            : "failed",
    };
  }
}

