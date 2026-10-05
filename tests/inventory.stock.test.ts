import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { database, resetDatabase } from "../src/database.ts";
import { StockRepository } from "../src/inventory/StockRepository.ts";
import type { CartLine } from "../src/shared/calculateTotal.ts";

beforeEach(() => {
  resetDatabase();

  database.stock.set("book", {
    productId: "book",
    available: 5,
  });

  database.stock.set("pen", {
    productId: "pen",
    available: 10,
  });
});

test("out-of-stock", () => {
  const stockRepository = new StockRepository();

  const lines: CartLine[] = [
    {
      productId: "book",
      unitPrice: 100,
      quantity: 2,
    },
    {
      productId: "pen",
      unitPrice: 100,
      quantity: 11,
    },
  ];

  assert.throws(
    () => stockRepository.reserve(lines),
    /Insufficient stock for pen/,
  );

  assert.equal(database.stock.get("book")!.available, 5);
  assert.equal(database.stock.get("pen")!.available, 10);
});


test("out-of-stock не змінює попередньо дійсні лінії", () => {
  const stockRepository = new StockRepository();

  const lines: CartLine[] = [
    {
      productId: "book",
      unitPrice: 100,
      quantity: 1,
    },
    {
      productId: "pen",
      unitPrice: 100,
      quantity: 11,
    },
  ];

  assert.throws(() => stockRepository.reserve(lines));

  assert.equal(database.stock.get("book")!.available, 5);
  assert.equal(database.stock.get("pen")!.available, 10);
});


test("inventory never becomes negative", () => {
  const stockRepository = new StockRepository();

  assert.throws(() =>
    stockRepository.reserve([
      {
        productId: "book",
        unitPrice: 100,
        quantity: 6,
      },
    ]),
  );

  assert.equal(database.stock.get("book")!.available, 5);
  assert.ok(database.stock.get("book")!.available >= 0);
});


test("successful резервування", () => {
  const stockRepository = new StockRepository();

  stockRepository.reserve([
    {
      productId: "book",
      unitPrice: 100,
      quantity: 2,
    },
  ]);

  assert.equal(database.stock.get("book")!.available, 3);
});


test("successful резервування змінює рядок один раз", () => {
  const stockRepository = new StockRepository();

  stockRepository.reserve([
    {
      productId: "book",
      unitPrice: 100,
      quantity: 2,
    },
    {
      productId: "pen",
      unitPrice: 50,
      quantity: 3,
    },
  ]);

  assert.equal(database.stock.get("book")!.available, 3);
  assert.equal(database.stock.get("pen")!.available, 7);
});
