// modules/sysadmin/dto/hypervisor.dto.ts
import { z } from "zod";

export const createHypervisorSchema = z.object({
  name: z.string().min(3),
  type: z.enum(["PROXMOX", "VMWARE"]),
  host: z.string().min(3),
  username: z.string().min(3),
  token: z.string().min(3),
});

export const updateHypervisorSchema = z.object({
  name: z.string().optional(),
  host: z.string().optional(),
  username: z.string().optional(),
  token: z.string().optional(),
  status: z.enum(["ONLINE", "OFFLINE"]).optional(),
});
