import { Request, Response } from "express";
import { TemplateGroupService } from "../services/templateGroup.service";

// ────────────── GROUP ──────────────
export const createGroup = async (req: Request, res: Response) => {
  const { name, categoryId } = req.body;
  if (!name) return res.status(400).json({ success: false, error: "Group name is required" });

  try {
    const group = await TemplateGroupService.createGroup(name, categoryId);
    return res.json({ success: true, data: group });
  } catch (err) {
    console.error("Create group error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const listGroups = async (_req: Request, res: Response) => {
  try {
    const groups = await TemplateGroupService.listGroupsWithTemplates();
    return res.json({ success: true, data: groups });
  } catch (err) {
    console.error("List groups error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  const { groupId } = req.params;
  try {
    await TemplateGroupService.deleteGroup(groupId);
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete group error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const assignTemplate = async (req: Request, res: Response) => {
  const { templateId, groupId } = req.body;
  if (!templateId || !groupId) return res.status(400).json({ success: false, error: "templateId and groupId required" });

  try {
    const updated = await TemplateGroupService.assignTemplate(templateId, groupId);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Assign template error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const unassignTemplate = async (req: Request, res: Response) => {
  const { templateId } = req.body;
  if (!templateId) return res.status(400).json({ success: false, error: "templateId required" });

  try {
    const updated = await TemplateGroupService.unassignTemplate(templateId);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Unassign template error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ────────────── CATEGORY ──────────────
export const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: "Category name is required" });

  try {
    const category = await TemplateGroupService.createCategory(name);
    return res.json({ success: true, data: category });
  } catch (err) {
    console.error("Create category error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const listCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await TemplateGroupService.listCategoriesWithGroups();
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.error("List categories error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  try {
    await TemplateGroupService.deleteCategory(categoryId);
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete category error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const assignGroupToCategory = async (req: Request, res: Response) => {
  const { groupId, categoryId } = req.body;
  if (!groupId || !categoryId) return res.status(400).json({ success: false, error: "groupId and categoryId required" });

  try {
    const updated = await TemplateGroupService.assignGroupToCategory(groupId, categoryId);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Assign group to category error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const unassignGroupFromCategory = async (req: Request, res: Response) => {
  const { groupId } = req.body;
  if (!groupId) return res.status(400).json({ success: false, error: "groupId required" });

  try {
    const updated = await TemplateGroupService.unassignGroupFromCategory(groupId);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Unassign group from category error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};
