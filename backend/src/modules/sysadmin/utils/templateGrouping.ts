// src/modules/sysadmin/utils/templateGrouping.ts

import { TemplateGroupType } from "../types/templateGroupType";

export function detectTemplateGroup(name: string): TemplateGroupType {
  const lower = name.toLowerCase();

  if (lower.includes("panel") || lower.includes("plesk") || lower.includes("cpanel")) {
    return TemplateGroupType.OS_PANEL;
  }

  if (
    lower.includes("ubuntu") ||
    lower.includes("debian") ||
    lower.includes("centos") ||
    lower.includes("almalinux") ||
    lower.includes("rocky")
  ) {
    return TemplateGroupType.OS_EMPTY;
  }

  return TemplateGroupType.SINGLE_VM;
}
