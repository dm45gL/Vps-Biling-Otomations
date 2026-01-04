import apiClient from "@/utils/apiClient";

/**
 * ================================
 * TYPES
 * ================================
 */

export type VPSActionResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
};

export type ReinstallPayload = {
  templateId: string;
};

export type RestorePayload = {
  backupId: string;
};

/**
 * ================================
 * VPS POWER
 * ================================
 */

// Start VPS
export const startVps = (vpsId: string) =>
  apiClient.post<VPSActionResponse>(
    `/api/vps/${vpsId}/start`
  );

// Stop VPS
export const stopVps = (vpsId: string) =>
  apiClient.post<VPSActionResponse>(
    `/api/vps/${vpsId}/stop`
  );

/**
 * ================================
 * VPS REINSTALL
 * ================================
 */

export const reinstallVps = (
  vpsId: string,
  payload: ReinstallPayload
) =>
  apiClient.post<VPSActionResponse>(
    `/api/vps/${vpsId}/reinstall`,
    payload
  );

/**
 * ================================
 * VPS RESTORE
 * ================================
 */

export const restoreVps = (
  vpsId: string,
  payload: RestorePayload
) =>
  apiClient.post<VPSActionResponse>(
    `/api/vps/${vpsId}/restore`,
    payload
  );
