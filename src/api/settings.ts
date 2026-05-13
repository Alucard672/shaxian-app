import { api } from './client';

export interface SystemParams {
  id?: number;
  enableDyeingProcess?: boolean;
  allowNegativeStock?: boolean;
  enableDualUnit?: boolean;
  enableBatch?: boolean;
  enableLocation?: boolean;
  productType?: string;
  updatedAt?: string;
}

export interface StoreInfo {
  id?: number;
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  fax?: string;
  postalCode?: string;
  remark?: string;
  updatedAt?: string;
}

export async function getSystemParams(sessionId: string, tenantId: number) {
  return api<SystemParams>('/system-params', { sessionId, tenantId });
}

export async function updateSystemParams(sessionId: string, tenantId: number, body: SystemParams) {
  return api<SystemParams>('/system-params', { method: 'PUT', body, sessionId, tenantId });
}

export async function getStoreInfo(sessionId: string, tenantId: number) {
  return api<StoreInfo>('/store', { sessionId, tenantId });
}

export async function updateStoreInfo(sessionId: string, tenantId: number, body: StoreInfo) {
  return api<StoreInfo>('/store', { method: 'PUT', body, sessionId, tenantId });
}
