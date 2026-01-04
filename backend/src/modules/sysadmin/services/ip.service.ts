import { prisma } from "../../../core/db/client";
import { IPStatus, IPType } from "@prisma/client";
import ipLib from "ip";

export class IPService {
  async getAll(regionId?: string) {
    return prisma.iPAddress.findMany({
      where: regionId ? { regionId } : {},
      orderBy: { ip: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.iPAddress.findUnique({ where: { id } });
  }

  async create(data: {
    ip: string;
    type: IPType;
    regionId: string;
    status?: IPStatus;
    note?: string;
    gateway?: string;
    netmask?: number;
    dns?: string;
  }) {
    return prisma.iPAddress.create({
      data: {
        ip: data.ip,
        type: data.type,
        regionId: data.regionId,
        status: data.status ?? IPStatus.AVAILABLE,
        note: data.note,
        gateway: data.gateway,
        netmask: data.netmask,
        dns: data.dns ?? "8.8.8.8 1.1.1.1",
      },
    });
  }

  async update(id: string, updateData: Partial<{
    type: IPType;
    status: IPStatus;
    note: string;
    gateway: string;
    netmask: number;
    dns: string;
    regionId: string;
  }>) {
    return prisma.iPAddress.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return prisma.iPAddress.delete({
      where: { id },
    });
  }

  // 🔥 Generate IPs dari CIDR (batch insert)
  async createFromCidr(
    cidr: string,
    type: IPType,
    regionId: string,
    status: IPStatus = IPStatus.AVAILABLE,
    note?: string,
    dns?: string
  ) {
    const subnet = ipLib.cidrSubnet(cidr);
    if (!subnet) throw new Error("Invalid CIDR");

    const gateway = subnet.firstAddress;
    const netmask = subnet.subnetMaskLength;

    const ipsToInsert = [];
    let current = ipLib.toLong(subnet.firstAddress) + 1; // skip gateway
    const last = ipLib.toLong(subnet.lastAddress) - 1;   // skip broadcast

    while (current <= last) {
      const ip = ipLib.fromLong(current);
      ipsToInsert.push({ ip, type, regionId, status, note, gateway, netmask, dns: dns ?? "8.8.8.8 1.1.1.1" });
      current++;
    }

    const results: Array<{ ip: string; status: "inserted" | "duplicate" | "error"; message?: string }> = [];

    for (const ipData of ipsToInsert) {
      try {
        await prisma.iPAddress.create({ data: ipData });
        results.push({ ip: ipData.ip, status: "inserted" });
      } catch (err: any) {
        if (err.code === "P2002") results.push({ ip: ipData.ip, status: "duplicate", message: "IP already exists" });
        else results.push({ ip: ipData.ip, status: "error", message: err.message });
      }
    }

    return {
      success: true,
      insertedCount: results.filter(r => r.status === "inserted").length,
      results,
    };
  }
}
