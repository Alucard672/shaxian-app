import { api } from './client';

export interface UserSession {
  sessionId: string;
  userId: number;
  username: string | null;
  phone: string;
  email: string | null;
  role: string | null;
  position: string | null;
  // 注：登录成功后保存到 useAuth 的 session 必然有 tenantId（超管已在 LoginScreen 拦截）
  tenantId: number;
  tenantName: string;
  tenantCode: string;
  /** 平台超级管理员（不应在移动端登录） */
  superAdmin?: boolean;
  /** 租户到期时间（ISO 字符串） */
  tenantExpiresAt?: string | null;
  /** 距离到期剩余天数（可负） */
  remainingDays?: number | null;
}

export async function login(phone: string, password: string) {
  return api<UserSession>('/auth/login', {
    method: 'POST',
    body: { phone, password },
    skipAuthHandling: true, // 登录接口失败不应触发"全局登出"
  });
}

export async function logout(sessionId: string) {
  return api('/auth/logout', { method: 'POST', sessionId });
}

export async function listUserTenants(sessionId: string) {
  return api('/auth/user-tenants', { sessionId });
}
