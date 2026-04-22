import { api } from './client';

export interface SalesOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  salesDate: string;
  createdAt?: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: string;
  operator: string;
  remark?: string;
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: number;
  productId: number;
  productName: string;
  colorId?: number;
  colorName?: string;
  colorCode?: string;
  batchCode?: string;
  quantity: number;
  unit?: string;
  price: number;
  amount: number;
  remark?: string;
}

export async function listSalesOrders(
  sessionId: string,
  tenantId: number,
  params: { pageNo?: number; pageSize?: number; status?: string } = {},
) {
  // Backend: GET /biz/api/sales  returns SalesOrder[]
  return api<SalesOrder[]>('/sales', {
    sessionId,
    tenantId,
    query: { pageNo: 1, pageSize: 20, ...params },
  });
}

export async function getSalesOrder(sessionId: string, tenantId: number, id: number) {
  return api<SalesOrder>(`/sales/${id}`, { sessionId, tenantId });
}

export interface CreateSalesOrderRequest {
  customerId: number;
  salesDate: string;
  deliveryDate?: string;
  contactPhone?: string;
  deliveryAddress?: string;
  remark?: string;
  paidAmount?: number;
  items: {
    productId: number;
    colorId?: number;
    batchId?: number;
    quantity: number;
    price: number;
    remark?: string;
  }[];
}

export async function createSalesOrder(
  sessionId: string, tenantId: number, body: CreateSalesOrderRequest,
) {
  return api<SalesOrder>('/sales', { method: 'POST', body, sessionId, tenantId });
}
