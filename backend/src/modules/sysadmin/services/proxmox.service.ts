// src/modules/sysadmin/services/proxmox.service.ts
import axios from "axios";
import https from "https";
import { IHypervisorService, ProxmoxTemplate } from "./hypervisor.interface";

interface ProxmoxNode { node: string; }

interface ProxmoxNodeStatus {
  cpu: number;
  memory: { used: number; total: number };
  rootfs: { used: number; total: number };
}

interface ProxmoxVM { vmid: number; name?: string; template?: number; }

export class ProxmoxService implements IHypervisorService {
  private id: string;
  private host: string;
  private token: string;

  constructor(id: string, host: string, token: string) {
    this.id = id;
    this.host = host;
    this.token = token;
  }

  private get headers() {
    return { Authorization: `PVEAPIToken=${this.token}` };
  }

  private get axiosConfig() {
    return { headers: this.headers, httpsAgent: new https.Agent({ rejectUnauthorized: false }) };
  }

  // ============================================================
  // TEST CONNECTION
  // ============================================================
  async testConnection(): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await axios.get<{ data: ProxmoxNode[] }>(
        `https://${this.host}:8006/api2/json/nodes`,
        this.axiosConfig
      );
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  // ============================================================
  // GET TEMPLATES
  // ============================================================
  async getTemplates(): Promise<ProxmoxTemplate[]> {
    const res = await axios.get<{ data: ProxmoxNode[] }>(
      `https://${this.host}:8006/api2/json/nodes`,
      this.axiosConfig
    );

    const templates: ProxmoxTemplate[] = [];

    for (const node of res.data.data) {
      // QEMU
      const qemuRes = await axios.get<{ data: ProxmoxVM[] }>(
        `https://${this.host}:8006/api2/json/nodes/${node.node}/qemu`,
        this.axiosConfig
      );

      for (const vm of qemuRes.data.data) {
        if (vm.template === 1) {
          templates.push({
            node: node.node,
            vmid: vm.vmid,
            name: vm.name || `VM-${vm.vmid}`,
            type: "qemu",
          });
        }
      }

      // LXC
      const lxcRes = await axios.get<{ data: ProxmoxVM[] }>(
        `https://${this.host}:8006/api2/json/nodes/${node.node}/lxc`,
        this.axiosConfig
      );

      for (const ct of lxcRes.data.data) {
        if (ct.template === 1) {
          templates.push({
            node: node.node,
            vmid: ct.vmid,
            name: ct.name || `CT-${ct.vmid}`,
            type: "lxc",
          });
        }
      }
    }

    return templates;
  }

  // ============================================================
  // NODE STATUS — CPU, RAM, DISK, TOTAL VM
  // ============================================================
  async getNodesStatus() {
    const res = await axios.get<{ data: ProxmoxNode[] }>(
      `https://${this.host}:8006/api2/json/nodes`,
      this.axiosConfig
    );
    const nodes = res.data.data;

    const allVMs = await this.getAllVMs();
    const result = [];

    for (const node of nodes) {
      const statusRes = await axios.get<{ data: ProxmoxNodeStatus }>(
        `https://${this.host}:8006/api2/json/nodes/${node.node}/status`,
        this.axiosConfig
      );
      const s = statusRes.data.data;

      const ramUsedMB = s.memory.used / 1024 / 1024;
      const ramTotalMB = s.memory.total / 1024 / 1024;

      const diskUsedGB = s.rootfs.used / 1024 / 1024 / 1024;
      const diskTotalGB = s.rootfs.total / 1024 / 1024 / 1024;

      result.push({
        node: node.node,
        cpuPercent: Number((s.cpu * 100).toFixed(2)),
        ramUsedMB,
        ramTotalMB,
        ramPercent: Number(((ramUsedMB / ramTotalMB) * 100).toFixed(2)),
        diskUsedGB,
        diskTotalGB,
        diskPercent: Number(((diskUsedGB / diskTotalGB) * 100).toFixed(2)),
        totalVM: allVMs.filter(vm => vm.node === node.node).length,
      });
    }

    return result;
  }

  // ============================================================
  // GET ALL VMs (QEMU & LXC)
  // ============================================================
  async getAllVMs() {
    const res = await axios.get<{ data: ProxmoxNode[] }>(
      `https://${this.host}:8006/api2/json/nodes`,
      this.axiosConfig
    );
    const nodes = res.data.data;
    const allVMs: any[] = [];

    for (const node of nodes) {
      // QEMU
      const qemuList = await axios.get<{ data: ProxmoxVM[] }>(
        `https://${this.host}:8006/api2/json/nodes/${node.node}/qemu`,
        this.axiosConfig
      );

      for (const vm of qemuList.data.data) {
        const detail = await axios.get<{ data: any }>(
          `https://${this.host}:8006/api2/json/nodes/${node.node}/qemu/${vm.vmid}/status/current`,
          this.axiosConfig
        );
        const d = detail.data.data;

        allVMs.push({
          node: node.node,
          vmid: vm.vmid,
          name: vm.name || `VM-${vm.vmid}`,
          status: d.status,
          cpuPercent: Number((d.cpu * 100).toFixed(2)),
          ramUsedMB: d.mem / 1024 / 1024,
          ramTotalMB: d.maxmem / 1024 / 1024,
          ramPercent: Number(((d.mem / d.maxmem) * 100).toFixed(2)),
          diskUsedGB: d.disk / 1024 / 1024 / 1024,
          diskTotalGB: d.maxdisk / 1024 / 1024 / 1024,
          diskPercent: Number(((d.disk / d.maxdisk) * 100).toFixed(2)),
        });
      }

      // LXC
      const lxcList = await axios.get<{ data: ProxmoxVM[] }>(
        `https://${this.host}:8006/api2/json/nodes/${node.node}/lxc`,
        this.axiosConfig
      );

      for (const ct of lxcList.data.data) {
        const detail = await axios.get<{ data: any }>(
          `https://${this.host}:8006/api2/json/nodes/${node.node}/lxc/${ct.vmid}/status/current`,
          this.axiosConfig
        );
        const d = detail.data.data;

        allVMs.push({
          node: node.node,
          vmid: ct.vmid,
          name: ct.name || `CT-${ct.vmid}`,
          status: d.status,
          cpuPercent: Number((d.cpu * 100).toFixed(2)),
          ramUsedMB: d.mem / 1024 / 1024,
          ramTotalMB: d.maxmem / 1024 / 1024,
          ramPercent: Number(((d.mem / d.maxmem) * 100).toFixed(2)),
          diskUsedGB: d.disk / 1024 / 1024 / 1024,
          diskTotalGB: d.maxdisk / 1024 / 1024 / 1024,
          diskPercent: Number(((d.disk / d.maxdisk) * 100).toFixed(2)),
        });
      }
    }

    return allVMs;
  }
}
