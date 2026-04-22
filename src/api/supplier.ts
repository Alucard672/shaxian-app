import { api } from './client';

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  type?: string;
  settlementCycle?: string;
  status: string;
  totalAmount?: number;
  unpaidAmount?: number;
}

export async function listSuppliers(sessionId: string, tenantId: number) {
  return api<Supplier[]>('/contacts/suppliers', { sessionId, tenantId });
}

export type SupplierUpsert = Omit<Supplier, 'id' | 'totalAmount' | 'unpaidAmount'> & { id?: number };

export async function createSupplier(sessionId: string, tenantId: number, body: SupplierUpsert) {
  return api<Supplier>('/contacts/suppliers', { method: 'POST', body, sessionId, tenantId });
}

export async function updateSupplier(sessionId: string, tenantId: number, id: number, body: SupplierUpsert) {
  return api<Supplier>(`/contacts/suppliers/${id}`, { method: 'PUT', body, sessionId, tenantId });
}

export async function deleteSupplier(sessionId: string, tenantId: number, id: number) {
  return api(`/contacts/suppliers/${id}`, { method: 'DELETE', sessionId, tenantId });
}
