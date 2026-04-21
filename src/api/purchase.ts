import { api } from './client';

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  purchaseDate: string;
  expectedDate?: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: string;
  operator: string;
  remark?: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  colorId?: number;
  colorName?: string;
  batchCode?: string;
  quantity: number;
  unit?: string;
  price: number;
  amount: number;
  remark?: string;
}

export async function listPurchaseOrders(
  sessionId: string, tenantId: number, params: { status?: string } = {},
) {
  return api<PurchaseOrder[]>('/purchases', {
    sessionId, tenantId, query: { pageNo: 1, pageSize: 20, ...params },
  });
}

export interface CreatePurchaseOrderRequest {
  supplierId: number;
  purchaseDate: string;
  expectedDate?: string;
  paidAmount?: number;
  remark?: string;
  items: {
    productId: number;
    colorId?: number;
    batchCode: string;
    quantity: number;
    price: number;
    remark?: string;
  }[];
}

export async function createPurchaseOrder(
  sessionId: string, tenantId: number, body: CreatePurchaseOrderRequest,
) {
  return api<PurchaseOrder>('/purchases', { method: 'POST', body, sessionId, tenantId });
}
