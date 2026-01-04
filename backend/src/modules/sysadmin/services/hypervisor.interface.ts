// src/modules/sysadmin/services/hypervisor.interface.ts
export interface ProxmoxTemplate {
  node: string;
  vmid: number;
  name: string;
  type: "qemu" | "lxc";
}

export interface IHypervisorService {
  testConnection(): Promise<{ success: boolean; data?: any; error?: any }>;
  getTemplates?(): Promise<ProxmoxTemplate[]>;
  getNodesStatus?(): Promise<any[]>;
  getAllVMs?(): Promise<any[]>;
}
