
import { IHypervisorService } from "./hypervisor.interface";
import { ProxmoxService } from "./proxmox.service";

export function getHypervisorService(
  type: string,
  config: { id: string; host: string; token: string }
): IHypervisorService {
  switch (type.toUpperCase()) {  // case-insensitive
    case "PROXMOX":
      return new ProxmoxService(config.id, config.host, config.token);
    default:
      throw new Error("Unsupported hypervisor type");
  }
}