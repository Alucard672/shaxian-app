import { api } from './client';

export interface Employee {
  id: number;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  role?: string;
  status: string;  // 'active' | 'inactive'
  createdAt?: string;
  updatedAt?: string;
}

export type EmployeeUpsert = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> & { id?: number };

export async function listEmployees(sessionId: string, tenantId: number) {
  return api<Employee[]>('/employees', { sessionId, tenantId });
}

export async function createEmployee(sessionId: string, tenantId: number, body: EmployeeUpsert) {
  return api<Employee>('/employees', { method: 'POST', body, sessionId, tenantId });
}

export async function updateEmployee(sessionId: string, tenantId: number, id: number, body: EmployeeUpsert) {
  return api<Employee>(`/employees/${id}`, { method: 'PUT', body, sessionId, tenantId });
}

export async function deleteEmployee(sessionId: string, tenantId: number, id: number) {
  return api(`/employees/${id}`, { method: 'DELETE', sessionId, tenantId });
}

export async function authorizeLogin(sessionId: string, tenantId: number, employeeId: number, password: string) {
  return api(`/employees/${employeeId}/authorize-login`, {
    method: 'POST', body: { password }, sessionId, tenantId,
  });
}
