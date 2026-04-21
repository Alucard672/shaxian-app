import { listSalesOrders } from './sales';
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
}

function isToday(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function isThisMonth(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export async function loadDashboardSummary(
  sessionId: string, tenantId: number,
): Promise<DashboardSummary> {
  const [sales, receivables, stock] = await Promise.all([
    listSalesOrders(sessionId, tenantId).catch(() => []),
    listReceivables(sessionId, tenantId).catch(() => []),
    listStock(sessionId, tenantId).catch(() => []),
  ]);

  const todayOrders = sales.filter(o => isToday(o.salesDate));
  const monthOrders = sales.filter(o => isThisMonth(o.salesDate));
  const pending = sales.filter(o => o.status === '待审核');

  const overdue = receivables.filter(r => (r.overdueDays ?? 0) > 0 && r.unpaidAmount > 0);

  const lowItems = stock.filter(s => s.lowStock).slice(0, 5);

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
  };
}
