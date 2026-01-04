// import axios from "axios";
// import https from "https";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export class TestProductService {
//   constructor(private host: string, private token: string) {}

//   private get axiosConfig() {
//     return {
//       headers: { Authorization: `PVEAPIToken=${this.token}` },
//       httpsAgent: new https.Agent({ rejectUnauthorized: false }),
//     };
//   }

//   // ================= Helper =================
//   private async waitTask(node: string, upid: string) {
//     while (true) {
//       const res = await axios.get<{ data: any }>(
//         `https://${this.host}:8006/api2/json/nodes/${node}/tasks/${upid}/status`,
//         this.axiosConfig
//       );
//       const { status } = res.data.data; 
//       if (status === "running") {
//         await new Promise(r => setTimeout(r, 1500));
//         continue;
//       }
//       if (status === "ok" || status === "stopped") return true;
//       throw new Error("Proxmox task failed: " + upid);
//     }
//   }

//   private async generateVmid() {
//     const res = await axios.get<{ data: number }>(
//       `https://${this.host}:8006/api2/json/cluster/nextid`,
//       this.axiosConfig
//     );
//     return Number(res.data.data);
//   }

//   private async cloneVM(node: string, templateVmid: number, vmid: number, name: string) {
//     const res = await axios.post<{ data: string }>(
//       `https://${this.host}:8006/api2/json/nodes/${node}/qemu/${templateVmid}/clone`,
//       { newid: vmid, name, target: node, storage: "local-lvm", full: 1 },
//       this.axiosConfig
//     );
//     await this.waitTask(node, res.data.data);
//   }

//   private async configureVM(node: string, vmid: number, ip: any, sshUsername: string, sshPassword: string) {
//     await axios.post(
//       `https://${this.host}:8006/api2/json/nodes/${node}/qemu/${vmid}/config`,
//       {
//         ciuser: sshUsername,
//         cipassword: sshPassword,
//         sshkeys: "",
//         ide2: "local-lvm:cloudinit",
//         net0: "virtio,bridge=vmbr0",
//         ipconfig0: `ip=${ip.ip}/24,gw=${ip.gateway || "192.168.1.1"}`, // tambahkan gateway default jika perlu
//       },
//       this.axiosConfig
//     );
//   }

//   private async resizeDisk(node: string, vmid: number, newDiskGB: number) {
//     const res = await axios.post<{ data: string }>(
//       `https://${this.host}:8006/api2/json/nodes/${node}/qemu/${vmid}/resize`,
//       { disk: "scsi0", size: `+${newDiskGB}G` },
//       this.axiosConfig
//     );
//     await this.waitTask(node, res.data.data);
//   }

//   private async vmAction(node: string, vmid: number, action: string) {
//     await axios.post(
//       `https://${this.host}:8006/api2/json/nodes/${node}/qemu/${vmid}/status/${action}`,
//       {},
//       this.axiosConfig
//     );
//   }

//   private async getNode(tp: any) {
//     const node = tp.templateGroups?.[0]?.templateGroup?.templates?.[0]?.node;
//     if (!node) throw new Error("Node not found for this TestProduct");
//     return node;
//   }

//   // ================= Create TestProduct =================
//   async createFromRawProduct(rawProductId: string, sshUsername: string, sshPassword: string) {
//     const raw = await prisma.rawProduct.findUnique({
//       where: { id: rawProductId },
//       include: {
//         templateGroups: { include: { templateGroup: { include: { templates: true } } } },
//       },
//     });
//     if (!raw) throw new Error("RawProduct not found");
//     if (!raw.templateGroups.length) throw new Error("RawProduct has no template groups");

//     const firstTG = raw.templateGroups[0].templateGroup;
//     const template = firstTG.templates[0];
//     if (!template) throw new Error("TemplateGroup has no templates");

//     const ip = await prisma.iPAddress.findFirst({ where: { status: "AVAILABLE" } });
//     if (!ip) throw new Error("No available IP address");
//     await prisma.iPAddress.update({ where: { id: ip.id }, data: { status: "USED" } });

//     const vmid = await this.generateVmid();

//     await this.cloneVM(template.node, template.vmid, vmid, `${raw.name}-${vmid}`);
//     await this.resizeDisk(template.node, vmid, raw.disk);
//     await this.configureVM(template.node, vmid, ip, sshUsername, sshPassword);

//     const tp = await prisma.testProduct.create({
//       data: {
//         rawProductId: raw.id,
//         name: raw.name,
//         cpu: raw.cpu,
//         ram: raw.ram,
//         disk: raw.disk,
//         bandwidth: raw.bandwidth,
//         backupPolicyId: raw.backupPolicyId,
//         sshUsername,
//         sshPassword,
//         ipId: ip.id,
//         vmid,
//         status: "STOPPED",
//       },
//     });

//     await prisma.testProductTemplateGroup.createMany({
//       data: raw.templateGroups.map(g => ({ testProductId: tp.id, templateGroupId: g.templateGroupId })),
//     });

//     return this.getById(tp.id);
//   }

//   // ================= Reinstall VM =================
//   async reinstall(id: string, newTemplateId: number) {
//     const tp = await this.getById(id);
//     if (!tp) throw new Error("TestProduct not found");

//     const node = await this.getNode(tp);

//     if (!tp.vmid) throw new Error("VMID not set");

//     // Delete old VM
//     await this.vmAction(node, tp.vmid, "stop");
//     await this.vmAction(node, tp.vmid, "shutdown");
//     await axios.delete(`https://${this.host}:8006/api2/json/nodes/${node}/qemu/${tp.vmid}`, this.axiosConfig);

//     // Clone new template
//     const vmid = tp.vmid; // reuse same vmid
//     await this.cloneVM(node, newTemplateId, vmid, tp.name);

//     // Resize disk & configure
//     await this.resizeDisk(node, vmid, tp.disk);
//     await this.configureVM(node, vmid, tp.ip, tp.sshUsername, tp.sshPassword);

//     return prisma.testProduct.update({ where: { id }, data: { status: "STOPPED" } });
//   }

//   // ================= VM Actions =================
//   async start(id: string) {
//     const tp = await this.getById(id);
//     const node = await this.getNode(tp);
//     if (!tp.vmid) throw new Error("VMID not set");
//     await this.vmAction(node, tp.vmid, "start");
//     return prisma.testProduct.update({ where: { id }, data: { status: "RUNNING" } });
//   }

//   async stop(id: string) {
//     const tp = await this.getById(id);
//     const node = await this.getNode(tp);
//     if (!tp.vmid) throw new Error("VMID not set");
//     await this.vmAction(node, tp.vmid, "stop");
//     return prisma.testProduct.update({ where: { id }, data: { status: "STOPPED" } });
//   }

//   async reboot(id: string) {
//     const tp = await this.getById(id);
//     const node = await this.getNode(tp);
//     if (!tp.vmid) throw new Error("VMID not set");
//     await this.vmAction(node, tp.vmid, "reboot");
//     return prisma.testProduct.update({ where: { id }, data: { status: "RUNNING" } });
//   }

//   async forceShutdown(id: string) {
//     const tp = await this.getById(id);
//     const node = await this.getNode(tp);
//     if (!tp.vmid) throw new Error("VMID not set");
//     await this.vmAction(node, tp.vmid, "shutdown");
//     return prisma.testProduct.update({ where: { id }, data: { status: "STOPPED" } });
//   }

//   async backup(id: string) {
//     const tp = await this.getById(id);
//     const node = await this.getNode(tp);
//     if (!tp.vmid) throw new Error("VMID not set");
//     await this.vmAction(node, tp.vmid, "snapshot"); 
//     return prisma.testProduct.update({ where: { id }, data: { status: "BACKUPTING" } });
//   }

//   async restore(id: string, snapshotName: string) {
//     const tp = await this.getById(id);
//     const node = await this.getNode(tp);
//     if (!tp.vmid) throw new Error("VMID not set");
//     await axios.post(
//       `https://${this.host}:8006/api2/json/nodes/${node}/qemu/${tp.vmid}/snapshot/${snapshotName}/rollback`,
//       {},
//       this.axiosConfig
//     );
//     return prisma.testProduct.update({ where: { id }, data: { status: "RESTORING" } });
//   }

//   // ================= Getters =================
//   getAll() {
//     return prisma.testProduct.findMany({ include: { ip: true, rawProduct: true, templateGroups: true } });
//   }

//   getById(id: string) {
//     return prisma.testProduct.findUnique({
//       where: { id },
//       include: {
//         ip: true,
//         rawProduct: true,
//         templateGroups: {
//           include: {
//             templateGroup: {
//               include: { templates: true }
//             }
//           }
//         }
//       }
//     });
//   }

//   async delete(id: string) {
//     const tp = await this.getById(id);
//     if (!tp) throw new Error("TestProduct not found");

//     if (tp.ipId) {
//       await prisma.iPAddress.update({ where: { id: tp.ipId }, data: { status: "AVAILABLE" } });
//     }

//     return prisma.testProduct.delete({ where: { id } });
//   }
// }
