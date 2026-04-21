import { api } from './client';

export interface Product {
  id: number;
  name: string;
  code: string;
  unit: string;
  type?: string;
  specification?: string;
  composition?: string;
}

export interface Color {
  id: number;
  productId: number;
  code: string;
  name: string;
  colorValue?: string;
  status?: string;
}

export interface Batch {
  id: number;
  colorId: number;
  code: string;
  stockQuantity: number;
  purchasePrice?: number;
  productionDate?: string;
  stockLocation?: string;
}

export async function listProducts(sessionId: string, tenantId: number) {
  return api<Product[]>('/products', { sessionId, tenantId });
}
export async function listColors(sessionId: string, tenantId: number, productId: number) {
  return api<Color[]>(`/products/${productId}/colors`, { sessionId, tenantId });
}
export async function listBatches(sessionId: string, tenantId: number, colorId: number) {
  return api<Batch[]>(`/products/colors/${colorId}/batches`, { sessionId, tenantId });
}
