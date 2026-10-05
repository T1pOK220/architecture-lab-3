export type PaymentPayload = {
  id: string;
  amount: number;
  currency: string;
  metadata: {
    orderId: string;
  };
};

export type PaymentResponse = {
  chargeId: string;
  status: "paid" | "processing" | "failed";
};
