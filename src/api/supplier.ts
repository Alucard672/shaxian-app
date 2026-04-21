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
