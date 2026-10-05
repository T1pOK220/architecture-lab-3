import { database } from "../database.ts";
import type { CartLine } from "../shared/calculateTotal.ts";
import { PaymentProvider } from "../payments/payment.ts";
import type { PaymentPayload } from "../payments/payment.ts";
import { StockRepository } from "../inventory/StockRepository.ts";

export class OrderService {
  private readonly paymentProvider: PaymentProvider;
  private readonly stockRepository: StockRepository;

  constructor(paymentProvider = new PaymentProvider(), stockRepository = new StockRepository()) {
    this.paymentProvider = paymentProvider;
    this.stockRepository = stockRepository;
  }

  async placeOrder(orderId: string, lines: CartLine[], total: number, payload: PaymentPayload) {
    for (const line of lines) {
      this.stockRepository.reserve(lines);
    }

    database.orders.set(orderId, { id: orderId, status: "created", total });
    const providerResponse = await this.paymentProvider.createCharge(payload);
    const paymentStatus = providerResponse.status;
    const order = database.orders.get(orderId)!;
    order.paymentStatus = paymentStatus;
    order.status = paymentStatus === "paid" ? "confirmed" : "payment_pending";
    return { ...order };
  }
}
