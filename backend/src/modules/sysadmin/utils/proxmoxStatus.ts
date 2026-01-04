export type VMStatusType = "ACTIVE" | "SUSPENDED" | "TERMINATED";

export function mapProxmoxStatus(status: string): VMStatusType {
  switch (status?.toLowerCase()) {
    case "running":
      return "ACTIVE";
    case "stopped":
    case "halted":
      return "SUSPENDED";
    default:
      return "TERMINATED";
  }
}
