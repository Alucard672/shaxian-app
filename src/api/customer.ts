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
