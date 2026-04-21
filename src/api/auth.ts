import { api } from './client';

export interface UserSession {
  sessionId: string;
  userId: number;
  username: string | null;
  phone: string;
  email: string | null;
  role: string | null;
  position: string | null;
  tenantId: number;
  tenantName: string;
  tenantCode: string;
}

export async function login(phone: string, password: string) {
  return api<UserSession>('/auth/login', {
    method: 'POST',
    body: { phone, password },
  });
}

export async function logout(sessionId: string) {
  return api('/auth/logout', { method: 'POST', sessionId });
}

export async function listUserTenants(sessionId: string) {
  return api('/auth/user-tenants', { sessionId });
}
