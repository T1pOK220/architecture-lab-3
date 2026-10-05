import { calculateTotal, type CartLine } from "../shared/calculateTotal.ts";
import { OrderService } from "../orders/OrderService.ts";
import type { PaymentPayload } from "../payments/payment.ts";
import {runtimeConfig} from "../config.ts";

export type CheckoutRequest = {
  orderId: string;
  paymentToken: string;
  currency: string;
  lines: CartLine[];
};

export class CheckoutController {
  private readonly orders: OrderService;

  constructor(orders = new OrderService()) {
    this.orders = orders;
  }

  async checkout(request: CheckoutRequest) {
    const total = calculateTotal(request.lines, runtimeConfig.taxRate, runtimeConfig.discountPercent);
    const paymentPayload: PaymentPayload = {
      id: request.paymentToken,
      amount: Math.round(total * 100),
      currency: request.currency,
      metadata: { orderId: request.orderId },
    };

    const order = await this.orders.placeOrder(
      request.orderId,
      request.lines,
      total,
      paymentPayload,
    );

    return {
      orderId: order.id,
      status: order.status,
      total: order.total,
      paymentStatus: order.paymentStatus,
    };
  }
}
