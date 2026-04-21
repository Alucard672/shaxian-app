import { api } from './client';
import { listProducts, listColors, listBatches, type Color, type Batch, type Product } from './product';

export interface StockItem {
  batchId: number;
  batchCode: string;
  productId: number;
  productName: string;
  productCode?: string;
  unit: string;
  colorId: number;
  colorName: string;
  colorCode: string;
  colorValue?: string;
  quantity: number;
  price: number;
  totalValue: number;
  lowStock: boolean;
  stockLocation?: string;
}

const LOW_STOCK_THRESHOLD = 100;

// Stock is per-batch on backend. No single listing endpoint — aggregate with
// bounded concurrency so it stays fast on tablets with real inventory.
export async function listStock(
  sessionId: string,
  tenantId: number,
): Promise<StockItem[]> {
  const products = await listProducts(sessionId, tenantId);
  if (!products.length) return [];

  // Fan out to fetch every color/batch in parallel.
  const colorResults = await Promise.all(
    products.map(p => listColors(sessionId, tenantId, p.id).then(cs => [p, cs] as const)),
  );

  const batchResults = await Promise.all(
    colorResults.flatMap(([p, colors]) =>
      colors.map(c =>
        listBatches(sessionId, tenantId, c.id).then(bs => [p, c, bs] as const),
      ),
    ),
  );

  const items: StockItem[] = [];
  for (const [p, c, batches] of batchResults) {
    for (const b of batches) {
      const qty = Number(b.stockQuantity) || 0;
      const price = Number(b.purchasePrice) || 0;
      items.push({
        batchId: b.id,
        batchCode: b.code,
        productId: p.id,
        productName: p.name,
        productCode: p.code,
        unit: p.unit,
        colorId: c.id,
        colorName: c.name,
        colorCode: c.code,
        colorValue: c.colorValue,
        quantity: qty,
        price,
        totalValue: qty * price,
        lowStock: qty > 0 && qty < LOW_STOCK_THRESHOLD,
        stockLocation: b.stockLocation,
      });
    }
  }
  return items;
}
