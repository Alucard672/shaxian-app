import { listSalesOrders, type SalesOrder } from './sales';
import { listReceivables } from './account';
import { listStock } from './stock';

export interface DashboardSummary {
  todaySales: number;
  todayOrderCount: number;
  monthSales: number;
  monthOrderCount: number;
  receivableTotal: number;
  overdueCount: number;
  stockTotal: number;
  productCount: number;
  lowStockCount: number;
  pendingApprovalCount: number;
  lowStockItems: { productName: string; colorName: string; quantity: number; unit: string }[];
  overdueReceivables: { customerName: string; unpaidAmount: number; overdueDays?: number }[];
  // Today's hourly shipping (kg) — 24 buckets, index 0–23
  hourlyKg: number[];
  todayKg: number;
}

function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function isThisMonth(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// Treat every item as shipping weight — kg is the canonical unit in this ERP,
// "打" and "支" are rare and currently get counted as-is.
function itemQty(o: SalesOrder): number {
  if (!o.items?.length) return 0;
  return o.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
}

function hourBucket(iso?: string): number {
  if (!iso) return 0;
  return new Date(iso).getHours();
}

export async function loadDashboardSummary(
  sessionId: string, tenantId: number,
): Promise<DashboardSummary> {
  const [sales, receivables, stock] = await Promise.all([
    listSalesOrders(sessionId, tenantId).catch(() => [] as SalesOrder[]),
    listReceivables(sessionId, tenantId).catch(() => []),
    listStock(sessionId, tenantId).catch(() => []),
  ]);

  const todayOrders = sales.filter(o => isToday(o.salesDate));
  const monthOrders = sales.filter(o => isThisMonth(o.salesDate));
  const pending = sales.filter(o => o.status === '待审核');
  const overdue = receivables.filter(r => (r.overdueDays ?? 0) > 0 && r.unpaidAmount > 0);
  const lowItems = stock.filter(s => s.lowStock).slice(0, 5);

  // Hourly shipping — prefer createdAt (has time); fall back to salesDate noon
  const hourlyKg = new Array(24).fill(0);
  for (const o of todayOrders) {
    const h = hourBucket(o.createdAt || o.salesDate);
    hourlyKg[h] += itemQty(o);
  }
  const todayKg = hourlyKg.reduce((a, b) => a + b, 0);

  return {
    todaySales: todayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
    todayOrderCount: todayOrders.length,
    monthSales: monthOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
    monthOrderCount: monthOrders.length,
    receivableTotal: receivables.reduce((s, r) => s + (r.unpaidAmount || 0), 0),
    overdueCount: overdue.length,
    stockTotal: stock.reduce((s, i) => s + i.totalValue, 0),
    productCount: new Set(stock.map(i => i.productId)).size,
    lowStockCount: stock.filter(s => s.lowStock).length,
    pendingApprovalCount: pending.length,
    lowStockItems: lowItems.map(s => ({
      productName: s.productName, colorName: s.colorName,
      quantity: s.quantity, unit: s.unit,
    })),
    overdueReceivables: overdue.slice(0, 5).map(r => ({
      customerName: r.customerName,
      unpaidAmount: r.unpaidAmount,
      overdueDays: r.overdueDays,
    })),
    hourlyKg,
    todayKg,
  };
}
