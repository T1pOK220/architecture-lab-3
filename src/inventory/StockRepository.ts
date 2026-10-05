import { database } from "../database.ts";
import type { CartLine } from "../shared/calculateTotal.ts";

export class StockRepository {
  find(productId: string) {
    return database.stock.get(productId);
  }

  reserve(lines: CartLine[]): void {
    for (const line of lines) {
      const row = database.stock.get(line.productId);

      if (!row || row.available < line.quantity) {
        throw new Error(`Insufficient stock for ${line.productId}`);
      }
    }
    for (const line of lines) {
      const row = database.stock.get(line.productId)!;

      database.stock.set(line.productId, {
        ...row,
        available: row.available - line.quantity,
      });
    }
  }
}