import test from "node:test";
import assert from "node:assert/strict";
import { CheckoutController } from "../src/checkout/CheckoutController.ts";
import { database, resetDatabase } from "../src/database.ts";
import { auditLog, runtimeConfig } from "../src/config.ts";
import { OrderService } from "../src/orders/OrderService.ts";
import type { CheckoutRequest } from "../src/checkout/CheckoutController.ts";
test.beforeEach(() => {
  resetDatabase();
  auditLog.length = 0;
  runtimeConfig.taxRate = 0.2;
  runtimeConfig.discountPercent = 0;
  database.stock.set("book", { productId: "book", available: 5 });
});

test("successful checkout preserves the public response", async () => {
  const response = await new CheckoutController().checkout({
    orderId: "order-1",
    paymentToken: "tok_valid",
    currency: "UAH",
    lines: [{ productId: "book", unitPrice: 100, quantity: 2 }],
  });

  assert.deepEqual(response, {
    orderId: "order-1",
    status: "confirmed",
    total: 240,
    paymentStatus: "paid",
  });
  assert.equal(database.stock.get("book")?.available, 3);
});

test("failed payment keeps the existing API behaviour", async () => {
  const response = await new CheckoutController().checkout({
    orderId: "order-2",
    paymentToken: "fail_card",
    currency: "UAH",
    lines: [{ productId: "book", unitPrice: 50, quantity: 1 }],
  });

  assert.equal(response.paymentStatus, "failed");
  assert.equal(response.status, "payment_pending");
});

test("checkout помилка недостатньої кількості", async () => {
  await assert.rejects(
    () => new CheckoutController().checkout({
      orderId: "order-3",
      paymentToken: "tok_valid",
      currency: "UAH",
      lines: [{ productId: "book", unitPrice: 100, quantity: 6 }],
    }),
    /Insufficient stock/,
  );
});
test("Checkout поветає стабільну публічну форму відповіді", async () => {
  const orderService = new OrderService();
  const checkout = new CheckoutController(orderService);

  const request: CheckoutRequest = {
    orderId: "order-checkout-1",
    paymentToken: "tok_valid",
    currency: "UAH",
    lines: [
      {
        productId: "book",
        unitPrice: 100,
        quantity: 2,
      },
    ],
  };

  const response = await checkout.checkout(request);

  assert.deepEqual(Object.keys(response).sort(), [
    "orderId",
    "paymentStatus",
    "status",
    "total",
  ]);

  assert.equal(response.orderId, "order-checkout-1");
  assert.equal(response.total, 240);
  assert.equal(response.status, "confirmed");
  assert.equal(response.paymentStatus, "paid");
});


test("Checkout не відкриває внутрішні дані замовлення", async () => {
  const orderService = new OrderService();
  const checkout = new CheckoutController(orderService);

  const response = await checkout.checkout({
    orderId: "order-checkout-2",
    paymentToken: "tok_valid",
    currency: "UAH",
    lines: [
      {
        productId: "book",
        unitPrice: 100,
        quantity: 1,
      },
    ],
  });

  assert.deepEqual(
    Object.keys(response).sort(),
    [
      "orderId",
      "paymentStatus",
      "status",
      "total",
    ],
  );

  assert.equal("chargeId" in response, false);
  assert.equal("available" in response, false);
});


test("Checkout does not mutate input lines", async () => {
  const orderService = new OrderService();
  const checkout = new CheckoutController(orderService);

  const request: CheckoutRequest = {
    orderId: "order-checkout-3",
    paymentToken: "tok_valid",
    currency: "UAH",
    lines: [
      {
        productId: "book",
        unitPrice: 100,
        quantity: 2,
      },
    ],
  };

  const originalLines = structuredClone(request.lines);

  await checkout.checkout(request);

  assert.deepEqual(request.lines, originalLines);
});
