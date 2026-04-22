import { api } from './client';

export interface Customer {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  type?: string;
  creditLimit?: number;
  status: string;
  totalAmount?: number;
  unpaidAmount?: number;
}

export async function listCustomers(
  sessionId: string,
  tenantId: number,
  params: { keyword?: string } = {},
) {
  // Backend: GET /biz/api/contacts/customers
  return api<Customer[]>('/contacts/customers', { sessionId, tenantId, query: params });
}

export type CustomerUpsert = Omit<Customer, 'id' | 'totalAmount' | 'unpaidAmount'> & { id?: number };

export async function createCustomer(sessionId: string, tenantId: number, body: CustomerUpsert) {
  return api<Customer>('/contacts/customers', { method: 'POST', body, sessionId, tenantId });
}

export async function updateCustomer(sessionId: string, tenantId: number, id: number, body: CustomerUpsert) {
  return api<Customer>(`/contacts/customers/${id}`, { method: 'PUT', body, sessionId, tenantId });
}

export async function deleteCustomer(sessionId: string, tenantId: number, id: number) {
  return api(`/contacts/customers/${id}`, { method: 'DELETE', sessionId, tenantId });
}
