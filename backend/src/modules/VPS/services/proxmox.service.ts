import axios, { AxiosInstance } from "axios";
import https from "https";
import fs from "fs";
import { decryptToken } from "../../../core/utils/encrypt";

export interface ProxmoxHost {
  host: string;
  username: string;
  token: string;
}

export class ProxmoxService {
  private httpsAgent: https.Agent;

  constructor() {
    const caPath = process.env.PROXMOX_ROOT_CA;

    if (caPath) {
      const ca = fs.readFileSync(caPath);
      this.httpsAgent = new https.Agent({
        ca,
        rejectUnauthorized: true,
      });
    } else {
      this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
      console.warn("⚠️ PROXMOX_ROOT_CA not set — TLS verification disabled");
    }
  }

  // ============================================================
  // AXIOS CLIENT
  // ============================================================
  private api(h: ProxmoxHost): AxiosInstance {
    const token = decryptToken(h.token);
    if (!token) throw new Error("Empty Proxmox API token");

    const auth =
      token.includes("!") ? token : `${h.username}!${token}`;

    return axios.create({
      baseURL: `https://${h.host}:8006/api2/json`,
      headers: {
        Authorization: `PVEAPIToken=${auth}`,
      },
      httpsAgent: this.httpsAgent,
      timeout: 0,
    });
  }

  // ============================================================
  // WAIT FOR ASYNC TASK (ONLY IF UPID EXISTS)
  // ============================================================
  private async waitForTask(
    api: AxiosInstance,
    node: string,
    upid?: string,
    timeoutMs = 120000
  ) {
    if (!upid) return;

    const start = Date.now();

    while (true) {
      const res = await api.get(
        `/nodes/${node}/tasks/${encodeURIComponent(upid)}/status`
      );

      const task = res.data.data;

      if (task.status === "stopped") {
        if (task.exitstatus !== "OK") {
          throw new Error(`Proxmox task failed: ${task.exitstatus}`);
        }
        return;
      }

      if (Date.now() - start > timeoutMs) {
        throw new Error("Timeout waiting for Proxmox task");
      }

      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // ============================================================
  // 🔍 GET VM STATUS (⬅️ FIX UNTUK REINSTALL)
  // ============================================================
  async status(
    h: ProxmoxHost,
    node: string,
    vmid: number
  ): Promise<"running" | "stopped"> {
    const res = await this.api(h).get(
      `/nodes/${node}/qemu/${vmid}/status/current`
    );

    return res.data.data.status; // "running" | "stopped"
  }

  // ============================================================
  // GET NEXT VMID
  // ============================================================
  async getNextVmid(h: ProxmoxHost): Promise<number> {
    const res = await this.api(h).get("/cluster/nextid");
    return Number(res.data.data);
  }

  // ============================================================
  // CLONE VPS (LVM SAFE & ASYNC SAFE)
  // ============================================================
  async clone(params: {
    hypervisor: ProxmoxHost;
    template: { node: string; vmid: number };
    vmid: number;
    raw: { cpu: number; ram: number; disk: number; bandwidth: number };
    ip: { ip: string; netmask: string; gateway: string };
  }) {
    const { hypervisor, template, vmid, raw, ip } = params;
    const api = this.api(hypervisor);
    const node = template.node;

    // 1️⃣ CLONE
    const clone = await api.post(
      `/nodes/${node}/qemu/${template.vmid}/clone`,
      { newid: vmid, full: 1 }
    );
    await this.waitForTask(api, node, clone.data.data);

    // 2️⃣ RESIZE DISK
    const resize = await api.put(
      `/nodes/${node}/qemu/${vmid}/resize`,
      { disk: "scsi0", size: `${raw.disk}G` }
    );
    await this.waitForTask(api, node, resize.data.data);

    // 3️⃣ CONFIG
    await api.put(`/nodes/${node}/qemu/${vmid}/config`, {
      cores: raw.cpu,
      memory: raw.ram,
      net0: `virtio,bridge=vmbr0,rate=${raw.bandwidth}`,
      ipconfig0: `ip=${ip.ip}/${ip.netmask},gw=${ip.gateway}`,
    });

    // 4️⃣ START
    await api.post(`/nodes/${node}/qemu/${vmid}/status/start`);
  }

  // ============================================================
  // POWER MANAGEMENT
  // ============================================================
  async start(h: ProxmoxHost, node: string, vmid: number) {
    await this.api(h).post(`/nodes/${node}/qemu/${vmid}/status/start`);
  }

  async stop(h: ProxmoxHost, node: string, vmid: number) {
    await this.api(h).post(`/nodes/${node}/qemu/${vmid}/status/stop`);
  }

  async reboot(h: ProxmoxHost, node: string, vmid: number) {
    await this.api(h).post(`/nodes/${node}/qemu/${vmid}/status/reboot`);
  }
}
