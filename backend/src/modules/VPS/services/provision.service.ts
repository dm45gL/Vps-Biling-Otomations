import { prisma } from "../../../core/db/client";
import { ProxmoxService } from "./proxmox.service";

export class ProvisioningService {
  private proxmox = new ProxmoxService();

  async provisionFromOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pricing: {
          include: {
            rawProduct: {
              include: {
                backupPolicy: true,
              },
            },
          },
        },
      },
    });

    if (!order || order.status !== "PAID") {
      throw new Error("Order invalid");
    }

    const raw = order.pricing.rawProduct;

    // Cari region dari order.region
    if (!order.region) throw new Error("No region specified in order");

    const region = await prisma.region.findFirst({
      where: { name: order.region },
    });

    if (!region) throw new Error(`Region "${order.region}" not found in database`);

    const regionId = region.id;

    // Cari hypervisor ONLINE di region tersebut
    const hypervisor = await prisma.hypervisor.findFirst({
      where: { regionId, status: "ONLINE" },
    });

    if (!hypervisor) {
      const allHypervisors = await prisma.hypervisor.findMany({ where: { regionId } });
      console.error(
        `No ONLINE hypervisor found in region ${region.name}. Available hypervisors:`,
        allHypervisors
      );
      throw new Error("No hypervisor available in this region");
    }

    // Ambil template
    const template = await prisma.template.findFirst({
      where: { hypervisorId: hypervisor.id },
    });
    if (!template) throw new Error("No template found for hypervisor");

    // Ambil IP
    const ipDb = await prisma.iPAddress.findFirst({
      where: { regionId, status: "AVAILABLE" },
    });
    if (!ipDb) throw new Error("No IP available in this region");

    // Mapping IP ke format ProxmoxService
    const ip = {
      ip: ipDb.ip,
      netmask: ipDb.netmask ? ipDb.netmask.toString() : "24", // fallback default
      gateway: ipDb.gateway ?? "192.168.1.1", // fallback default
    };

    const vmid = await this.proxmox.getNextVmid(hypervisor);

    // Clone VM
    await this.proxmox.clone({
      hypervisor,
      template,
      vmid,
      raw,
      ip,
    });

    // Update status IP menjadi USED
    await prisma.iPAddress.update({
      where: { id: ipDb.id },
      data: { status: "USED" },
    });

    // Ambil default backup storage
    const defaultStorage = await prisma.backupStorage.findFirst({
      where: { isDefault: true, isActive: true },
    });

    // Simpan data VPS
    return prisma.vPS.create({
      data: {
        clientId: order.clientId,
        orderId: order.id,
        rawProductId: raw.id,
        pricingId: order.pricingId,
        regionId,
        hypervisorId: hypervisor.id,
        templateId: template.id,
        ipAddressId: ipDb.id,
        vmid,
        hostname: `vps-${order.id}`,
        cpu: raw.cpu,
        ram: raw.ram,
        disk: raw.disk,
        bandwidth: raw.bandwidth,
        backupEnabled: !!raw.backupPolicyId,
        backupPolicyId: raw.backupPolicyId,
        backupProvider: defaultStorage?.provider,
        status: "RUNNING",
      },
    });
  }
}
