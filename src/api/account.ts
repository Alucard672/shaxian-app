import { api } from './client';

export interface Receivable {
  id: number;
  customerId: number;
  customerName: string;
  salesOrderNumber: string;
  receivableAmount: number;
  receivedAmount: number;
  unpaidAmount: number;
  accountDate: string;
  status: string;
  overdueDays?: number;
}

export interface Payable {
  id: number;
  supplierId: number;
  supplierName: string;
  purchaseOrderNumber: string;
  payableAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  accountDate: string;
  status: string;
}

export async function listReceivables(sessionId: string, tenantId: number) {
  return api<Receivable[]>('/accounts/receivables', { sessionId, tenantId });
}

export async function listPayables(sessionId: string, tenantId: number) {
  return api<Payable[]>('/accounts/payables', { sessionId, tenantId });
}
