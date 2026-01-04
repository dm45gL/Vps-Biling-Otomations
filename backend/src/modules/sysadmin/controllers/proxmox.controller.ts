import { Request, Response } from "express";
import { prisma } from "../../../core/db/client";
import { getHypervisorService } from "../services/hypervisor.factory";
import { encryptToken, decryptToken } from "../../../core/utils/encrypt";
import { saveTemplatesToDB } from "../services/saveTemplatesToDB";

// ──────────────────────────────────────────
// CREATE HYPERVISOR
// ──────────────────────────────────────────
export const createHypervisor = async (req: Request, res: Response) => {
  const { name, type, host, username, token, regionId, isMaster } = req.body;

  if (!name || !type || !host || !username || !token || !regionId) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
    });
  }

  try {
    const hypervisor = await prisma.hypervisor.create({
      data: {
        name,
        type,
        host,
        username,
        token: encryptToken(token),
        regionId,
        status: "OFFLINE",
        isMaster: !!isMaster,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Hypervisor created successfully",
      data: hypervisor,
    });
  } catch (err) {
    console.error("Create hypervisor error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to create hypervisor",
    });
  }
};

// ──────────────────────────────────────────
// READ HYPERVISORS
// ──────────────────────────────────────────
export const getAllHypervisors = async (_req: Request, res: Response) => {
  try {
    const hypervisors = await prisma.hypervisor.findMany({
      include: { region: true },
      orderBy: { name: "asc" },
    });

    return res.json({ success: true, data: hypervisors });
  } catch (err) {
    console.error("Get all hypervisors error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch hypervisors",
    });
  }
};

export const getHypervisorById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const hypervisor = await prisma.hypervisor.findUnique({
      where: { id },
      include: { region: true },
    });

    if (!hypervisor) {
      return res.status(404).json({
        success: false,
        error: "Hypervisor not found",
      });
    }

    return res.json({ success: true, data: hypervisor });
  } catch (err) {
    console.error("Get hypervisor error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch hypervisor",
    });
  }
};

// ──────────────────────────────────────────
// UPDATE HYPERVISOR
// ──────────────────────────────────────────
export const updateHypervisor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, type, host, username, token, status, regionId, isMaster } = req.body;

  try {
    const hypervisor = await prisma.hypervisor.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(host && { host }),
        ...(username && { username }),
        ...(token && { token: encryptToken(token) }),
        ...(status && { status }),
        ...(regionId && { regionId }),
        ...(typeof isMaster === "boolean" && { isMaster }),
      },
    });

    return res.json({
      success: true,
      message: "Hypervisor updated successfully",
      data: hypervisor,
    });
  } catch (err) {
    console.error("Update hypervisor error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to update hypervisor",
    });
  }
};

// ──────────────────────────────────────────
// DELETE HYPERVISOR
// ──────────────────────────────────────────
export const deleteHypervisor = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Hapus template terkait agar tidak orphan
    await prisma.template.deleteMany({ where: { hypervisorId: id } });

    await prisma.hypervisor.delete({ where: { id } });

    return res.json({
      success: true,
      message: "Hypervisor deleted successfully",
    });
  } catch (err) {
    console.error("Delete hypervisor error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to delete hypervisor",
    });
  }
};

// ──────────────────────────────────────────
// TEST CONNECTION
// ──────────────────────────────────────────
export const testProxmoxConnection = async (req: Request, res: Response) => {
  const { hypervisorId } = req.params;

  try {
    const hypervisor = await prisma.hypervisor.findUnique({
      where: { id: hypervisorId },
    });

    if (!hypervisor) {
      return res.status(404).json({
        success: false,
        error: "Hypervisor not found",
      });
    }

    const service = getHypervisorService(hypervisor.type, {
      id: hypervisor.id,
      host: hypervisor.host,
      token: decryptToken(hypervisor.token),
    });

    const result = await service.testConnection();

    await prisma.hypervisor.update({
      where: { id: hypervisorId },
      data: { status: result.success ? "ONLINE" : "OFFLINE" },
    });

    return res.json(result);
  } catch (err) {
    console.error("Test connection FAILED:", err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
};

// ──────────────────────────────────────────
// TEMPLATE CONTROLLERS
// ──────────────────────────────────────────
export const syncHypervisorTemplatesController = async (req: Request, res: Response) => {
  const hypervisorId = req.params.hypervisorId.trim();

  try {
    const hypervisor = await prisma.hypervisor.findUnique({ where: { id: hypervisorId } });
    if (!hypervisor) return res.status(404).json({ success: false, error: "Hypervisor not found" });

    const service = getHypervisorService(hypervisor.type, {
      id: hypervisor.id,
      host: hypervisor.host,
      token: decryptToken(hypervisor.token),
    });

    if (typeof service.getTemplates !== "function") {
      return res.status(500).json({ success: false, error: "Service does not support templates" });
    }

    // Ambil template dari hypervisor
    const templates = await service.getTemplates();

    // Simpan template ke DB, hapus yang tidak ada di hypervisor
    await saveTemplatesToDB(hypervisor.id, templates, { sync: true });

    res.json({ success: true, data: templates });
  } catch (err: any) {
    console.error("Sync templates error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
};

export const getHypervisorTemplatesController = async (req: Request, res: Response) => {
  const hypervisorId = req.params.hypervisorId;
  try {
    const templates = await prisma.template.findMany({
      where: { hypervisorId },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: templates });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
};


// ──────────────────────────────────────────
// SET MASTER HYPERVISOR & SYNC MASTER TEMPLATES
// ──────────────────────────────────────────
export const setMasterHypervisor = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const hypervisor = await prisma.hypervisor.findUnique({ where: { id } });
    if (!hypervisor) return res.status(404).json({ success: false, error: "Hypervisor not found" });

    // Pastikan hanya ada 1 master global
    const existingMaster = await prisma.hypervisor.findFirst({ where: { isMaster: true } });
    if (existingMaster && existingMaster.id !== id) {
      return res.status(400).json({
        success: false,
        error: `Hypervisor ${existingMaster.name} is already the global master. Unset it first.`,
      });
    }

    // Set hypervisor ini sebagai master
    const updatedMaster = await prisma.hypervisor.update({
      where: { id },
      data: { isMaster: true },
    });

    // Ambil service master
    const masterService = getHypervisorService(hypervisor.type, {
      id: hypervisor.id,
      host: hypervisor.host,
      token: decryptToken(hypervisor.token),
    });

    if (typeof masterService.getTemplates !== "function") {
      return res.status(500).json({ success: false, error: "Master hypervisor service does not support templates" });
    }

    // Ambil template dari master
    const masterTemplates = await masterService.getTemplates();

    // Ambil semua hypervisor non-master
    const otherHypervisors = await prisma.hypervisor.findMany({
      where: { isMaster: false },
    });

    // Sinkron template ke semua hypervisor non-master
    for (const hv of otherHypervisors) {
      await saveTemplatesToDB(hv.id, masterTemplates, { sync: true });
    }

    return res.json({
      success: true,
      message: `${updatedMaster.name} is now the global master and templates have been synced`,
      data: { master: updatedMaster, syncedHypervisors: otherHypervisors.length },
    });
  } catch (err: any) {
    console.error("Set master hypervisor error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
};

// ──────────────────────────────────────────
// UNSET MASTER GLOBAL
// ──────────────────────────────────────────
export const unsetMasterHypervisor = async (_req: Request, res: Response) => {
  try {
    const updated = await prisma.hypervisor.updateMany({
      where: { isMaster: true },
      data: { isMaster: false },
    });

    return res.json({
      success: true,
      message: `All master hypervisors have been unset`,
      data: updated,
    });
  } catch (err: any) {
    console.error("Unset master hypervisor error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
};































// Monitoring
export const getHypervisorStats = async (req: Request, res: Response) => {
  const { hypervisorId } = req.params;

  try {
    const hypervisor = await prisma.hypervisor.findUnique({
      where: { id: hypervisorId }
    });

    if (!hypervisor) {
      return res.status(404).json({
        success: false,
        error: "Hypervisor not found"
      });
    }

    const service = getHypervisorService(hypervisor.type, {
      id: hypervisor.id,
      host: hypervisor.host,
      token: decryptToken(hypervisor.token),
    });

    if (!service.getNodesStatus) {
      return res.status(500).json({
        success: false,
        error: "Service does not support monitoring"
      });
    }

    // Ambil data NODE saja (hypervisor)
    const nodes = await service.getNodesStatus();

    const stats = nodes.map((node: any) => ({
      node: node.node,
      cpuPercent: node.cpuPercent ?? 0,

      ramUsedMB: node.ramUsedMB ?? 0,
      ramTotalMB: node.ramTotalMB ?? 0,
      ramPercent: node.ramPercent ?? 0,

      diskUsedGB: node.diskUsedGB ?? 0,
      diskTotalGB: node.diskTotalGB ?? 0,
      diskPercent: node.diskPercent ?? 0,

      totalVM: node.totalVM ?? 0, // opsional
    }));

    return res.json({ success: true, data: stats });

  } catch (err) {
    console.error("Get hypervisor stats error:", err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
};


