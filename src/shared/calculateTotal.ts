export type CartLine = {
  productId: string;
  unitPrice: number;
  quantity: number;
  lineTotal?: number;
};

export function calculateTotal(
  lines: CartLine[],
  taxRate: number,
  discountPercent: number,
): number {
  let subtotal = 0;

  for (const line of lines) {
    const lineTotal = line.unitPrice * line.quantity;
    subtotal += lineTotal;
  }

  const discounted = subtotal * (1 - discountPercent / 100);
  const total = Number((discounted * (1 + taxRate)).toFixed(2));

  return total;
}