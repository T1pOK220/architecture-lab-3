import test from "node:test";
import assert from "node:assert/strict";

import { normalizePaymentStatus } from "../src/payments/paymentStatus.ts";

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