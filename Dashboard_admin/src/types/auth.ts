// src/types/auth.ts
export type AdminRole = 'SYSADMIN' | 'FINANCE' | 'BUSINESS'; // sesuaikan dengan backend

export interface AdminProfile {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string; 
  updatedAt: string;
  name?: string; 
}

export interface AdminUserResponse {
  admin: AdminProfile;
}

export type NullableAdminProfile = AdminProfile | null;