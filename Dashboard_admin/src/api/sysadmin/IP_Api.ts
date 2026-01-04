// src/api/ip.ts
import apiClient from '@/utils/apiClient';

// ──────────────────────────────
// Frontend type definitions
// ──────────────────────────────

export type IPStatus =
  | 'AVAILABLE'
  | 'USED'
  | 'RESERVED'
  | 'DISABLED';

export type IPType =
  | 'PUBLIC'
  | 'PRIVATE'
  | 'VPN'
  | 'OTHER';

export interface IPAddress {
  id: string;
  ip: string;
  type: IPType;
  status: IPStatus;
  regionId: string;
  gateway?: string;
  netmask?: number;
  dns?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CIDRResult {
  ip: string;
  status: 'inserted' | 'duplicate' | 'error';
  message?: string;
}

// ──────────────────────────────
// API Calls
// ──────────────────────────────

// GET all IPs (optional region filter)
export const getIPs = (regionId?: string) =>
  apiClient.get<{ success: boolean; data: IPAddress[] }>('/api/ip', {
    params: regionId ? { regionId } : undefined,
  });

// GET single IP by ID
export const getIPById = (id: string) =>
  apiClient.get<{ success: boolean; data: IPAddress }>(`/api/ip/${id}`);

// CREATE single IP
export const createIP = (data: {
  ip: string;
  type: IPType;
  regionId: string;
  status?: IPStatus;
  note?: string;
  gateway?: string;
  netmask?: number;
  dns?: string;
}) =>
  apiClient.post<{ success: boolean; data: IPAddress }>(
    '/api/ip',
    data
  );

// UPDATE IP
export const updateIP = (
  id: string,
  data: Partial<{
    type: IPType;
    status: IPStatus;
    note: string;
    gateway: string;
    netmask: number;
    dns: string;
    regionId: string;
  }>
) =>
  apiClient.put<{ success: boolean; data: IPAddress }>(
    `/api/ip/${id}`,
    data
  );

// DELETE IP
export const deleteIP = (id: string) =>
  apiClient.delete<{ success: boolean; message: string }>(
    `/api/ip/${id}`
  );

// CREATE IPs from CIDR (batch)
export const createIPsFromCidr = (data: {
  cidr: string;
  type: IPType;
  regionId: string;
  status?: IPStatus;
  note?: string;
  dns?: string;
}) =>
  apiClient.post<{
    success: boolean;
    insertedCount: number;
    results: CIDRResult[];
  }>(
    '/api/ip/cidr',
    data
  );
