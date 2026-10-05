import { test} from "node:test";
import assert from "node:assert/strict";
import {
  calculateTotal,
  type CartLine,
} from "../src/shared/calculateTotal.ts";
test("calculateTotal повертає правильне значення", () => {
  const lines: CartLine[] = [
    {
      productId: "book",
      unitPrice: 100,
      quantity: 2,
    },
    {
      productId: "pen",
      unitPrice: 50,
      quantity: 1,
    },
  ];

  const total = calculateTotal(lines, 0, 0);

  assert.equal(total, 250);
});


test("calculateTotal застосовує знижку", () => {
  const lines: CartLine[] = [
    {
      productId: "book",
      unitPrice: 100,
      quantity: 2,
    },
  ];

  const total = calculateTotal(lines, 0, 10);

  assert.equal(total, 180);
});


test("calculateTotal застосовує податок", () => {
  const lines: CartLine[] = [
    {
      productId: "book",
      unitPrice: 100,
      quantity: 2,
    },
  ];

  const total = calculateTotal(lines, 0.2, 0);

  assert.equal(total, 240);
});


test("calculateTotal одинаковий результат", () => {
  const lines: CartLine[] = [
    {
      productId: "book",
      unitPrice: 100,
      quantity: 2,
    },
  ];

  const firstResult = calculateTotal(lines, 0.2, 10);
  const secondResult = calculateTotal(lines, 0.2, 10);

  assert.equal(firstResult, secondResult);
  assert.equal(firstResult, 216);
});


test("calculateTotal не змінює вхідні дані", () => {
  const lines: CartLine[] = [
    {
      productId: "book",
      unitPrice: 100,
      quantity: 2,
      lineTotal: 200,
    },
    {
      productId: "pen",
      unitPrice: 50,
      quantity: 3,
      lineTotal: 150,
    },
  ];

  const originalLines = structuredClone(lines);

  calculateTotal(lines, 0.2, 10);

  assert.deepEqual(lines, originalLines);
});


test("calculateTotal не додає або не змінює lineTotal", () => {
  const lines: CartLine[] = [
    {
      productId: "book",
      unitPrice: 100,
      quantity: 2,
    },
  ];

  calculateTotal(lines, 0, 0);

  assert.deepEqual(lines, [
    {
      productId: "book",
      unitPrice: 100,
      quantity: 2,
    },
  ]);
});
