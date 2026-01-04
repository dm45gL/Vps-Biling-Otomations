import { prisma } from "../../../core/db/client";
import { ProxmoxService } from "./proxmox.service";
import axios from "axios";
import https from "https";
import fs from "fs";
import { decryptToken } from "../../../core/utils/encrypt";
import type { ProxmoxHost } from "./proxmox.service";

export class ReinstallService {
  private proxmox = new ProxmoxService();

  // =====================================================
  // 🔧 WAIT UNTIL VM IS REALLY STOPPED
  // =====================================================
  private async waitUntilStopped(
    hypervisor: ProxmoxHost,
    node: string,
    vmid: number,
    timeoutMs = 60_000
  ) {
    const start = Date.now();

    while (true) {
      const status = await this.proxmox.status(
        hypervisor,
        node,
        vmid
      );

      if (status === "stopped") {
        console.log("✅ VPS is fully stopped");
        return;
      }

      if (Date.now() - start > timeoutMs) {
        throw new Error("Timeout waiting VPS to stop");
      }

      console.log("⏳ Waiting VPS to stop...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // =====================================================
  // 🔧 DELETE VM HELPER
  // =====================================================
  private async deleteVm(
    hypervisor: ProxmoxHost,
    node: string,
    vmid: number
  ) {
    const token = decryptToken(hypervisor.token);
    if (!token) throw new Error("Empty Proxmox API token");

    const auth = token.includes("!")
      ? token
      : `${hypervisor.username}!${token}`;

    const caPath = process.env.PROXMOX_ROOT_CA;
    const httpsAgent = caPath
      ? new https.Agent({
          ca: fs.readFileSync(caPath),
          rejectUnauthorized: true,
        })
      : new https.Agent({ rejectUnauthorized: false });

    const api = axios.create({
      baseURL: `https://${hypervisor.host}:8006/api2/json`,
      headers: {
        Authorization: `PVEAPIToken=${auth}`,
      },
      httpsAgent,
    });

    try {
      const res = await api.delete(`/nodes/${node}/qemu/${vmid}`);
      return res.data?.data; // UPID
    } catch (err: any) {
      console.error("❌ DELETE VM FAILED");
      console.error("STATUS:", err?.response?.status);
      console.error("DATA:", err?.response?.data);
      throw new Error("Failed to delete VM on Proxmox");
    }
  }

  // =====================================================
  // 🔥 MAIN REINSTALL FUNCTION
  // =====================================================
  async reinstall(vpsId: string, newTemplateId: string) {
    // 1️⃣ LOAD VPS
    const vps = await prisma.vPS.findUnique({
      where: { id: vpsId },
      include: {
        hypervisor: true,
        ipAddress: true,
        template: true,
      },
    });

    if (!vps) throw new Error("VPS not found");
    if (!vps.ipAddress)
      throw new Error("VPS has no IP address assigned");
    if (!vps.template)
      throw new Error("VPS has no template assigned");

    // 2️⃣ VALIDATE IP
    const { ip, netmask, gateway } = vps.ipAddress;
    if (!ip || !netmask || !gateway) {
      throw new Error("VPS IP configuration incomplete");
    }

    // 3️⃣ LOAD NEW TEMPLATE
    const template = await prisma.template.findUnique({
      where: { id: newTemplateId, isActive: true },
    });
    if (!template) throw new Error("Template invalid");

    // 🔑 NODE TEMPAT VPS SAAT INI
    const node = vps.template.node;

    console.log("🔧 REINSTALL DEBUG");
    console.log("VPS ID:", vps.id);
    console.log("VMID:", vps.vmid);
    console.log("VPS NODE:", node);
    console.log("OLD TEMPLATE:", vps.template.id);
    console.log("NEW TEMPLATE:", template.id);
    console.log("NEW TEMPLATE NODE:", template.node);

    // 4️⃣ STOP VPS
    try {
      await this.proxmox.stop(vps.hypervisor, node, vps.vmid);
    } catch {
      console.warn("⚠️ VPS stop failed (maybe already stopped)");
    }

    // 5️⃣ WAIT UNTIL REALLY STOPPED
    await this.waitUntilStopped(
      vps.hypervisor,
      node,
      vps.vmid
    );

    // 6️⃣ DELETE OLD VM
    await this.deleteVm(
      vps.hypervisor,
      node,
      vps.vmid
    );

    // 7️⃣ CLONE NEW TEMPLATE
    await this.proxmox.clone({
      hypervisor: vps.hypervisor,
      template: {
        node: template.node,
        vmid: template.vmid,
      },
      vmid: vps.vmid,
      raw: {
        cpu: vps.cpu,
        ram: vps.ram,
        disk: vps.disk,
        bandwidth: vps.bandwidth,
      },
      ip: {
        ip,
        netmask: String(netmask),
        gateway,
      },
    });

    // 8️⃣ UPDATE DATABASE
    return prisma.vPS.update({
      where: { id: vps.id },
      data: {
        templateId: template.id,
        status: "RUNNING",
      },
    });
  }
}
