import {test,beforeEach} from "node:test";
import assert from "node:assert/strict";
import { normalizePaymentStatus } from "../src/payments/paymentStatus.ts";
import { OrderService } from "../src/orders/OrderService.ts";
import { database, resetDatabase } from "../src/database.ts";
beforeEach(() => {
  resetDatabase();
  database.stock.set("book", { productId: "book", available: 10, });
});
test("succeeded is normalized to paid", () => {
  assert.equal(normalizePaymentStatus("succeeded"), "paid");
});

test("requires_action is normalized to processing", () => {
  assert.equal(normalizePaymentStatus("requires_action"), "processing");
});

test("declined is normalized to failed", () => {
  assert.equal(normalizePaymentStatus("declined"), "failed");
});

test("unknown provider status is safely normalized to failed", () => {
  assert.equal(normalizePaymentStatus("unknown_status"), "failed");
});
test("successful платіж", async () => {
  const orderService = new OrderService();
  const response = await orderService.placeOrder("order-paid", [{ productId: "book", unitPrice: 100, quantity: 1, },], 100, { id: "tok_valid", amount: 10000, currency: "UAH", metadata: { orderId: "order-paid", }, },);
  assert.equal(response.paymentStatus, "paid"); assert.equal(response.status, "confirmed");
});
test("failed платіж з статусом payment_pending", async () => {
  const orderService = new OrderService();
  const response = await orderService.placeOrder("order-failed", [{ productId: "book", unitPrice: 100, quantity: 1, },], 100, { id: "fail_payment", amount: 10000, currency: "UAH", metadata: { orderId: "order-failed", }, },);
  assert.equal(response.paymentStatus, "failed"); assert.equal(response.status, "payment_pending");
});
test("processing створює платіж з статусом payment_pending", async () => {
  const orderService = new OrderService();
  const response = await orderService.placeOrder("order-processing", [{ productId: "book", unitPrice: 100, quantity: 1, },], 100, { id: "processing_payment", amount: 10000, currency: "UAH", metadata: { orderId: "order-processing", }, },);
  assert.equal(response.paymentStatus, "processing"); assert.equal(response.status, "payment_pending");
});