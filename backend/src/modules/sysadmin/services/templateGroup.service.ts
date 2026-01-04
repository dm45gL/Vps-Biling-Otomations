import { prisma } from "../../../core/db/client";

export class TemplateGroupService {
  // ────────────── TEMPLATE GROUP ──────────────
  static async createGroup(name: string, categoryId?: string) {
    return prisma.templateGroup.create({ data: { name, categoryId } });
  }

  static async listGroupsWithTemplates() {
    return prisma.templateGroup.findMany({ include: { templates: true, category: true } });
  }

  static async deleteGroup(groupId: string) {
    // Putuskan relasi template sebelum hapus grup
    await prisma.template.updateMany({ where: { groupId }, data: { groupId: null } });
    return prisma.templateGroup.delete({ where: { id: groupId } });
  }

  static async assignTemplate(templateId: string, groupId: string) {
    return prisma.template.update({ where: { id: templateId }, data: { groupId } });
  }

  static async unassignTemplate(templateId: string) {
    return prisma.template.update({ where: { id: templateId }, data: { groupId: null } });
  }

  // ────────────── TEMPLATE CATEGORY ──────────────
  static async createCategory(name: string) {
    return prisma.templateCategory.create({ data: { name } });
  }

  static async listCategoriesWithGroups() {
    return prisma.templateCategory.findMany({ include: { groups: true } });
  }

  static async deleteCategory(categoryId: string) {
    // Putuskan relasi grup sebelum hapus kategori
    await prisma.templateGroup.updateMany({ where: { categoryId }, data: { categoryId: null } });
    return prisma.templateCategory.delete({ where: { id: categoryId } });
  }

  static async assignGroupToCategory(groupId: string, categoryId: string) {
    return prisma.templateGroup.update({ where: { id: groupId }, data: { categoryId } });
  }

  static async unassignGroupFromCategory(groupId: string) {
    return prisma.templateGroup.update({ where: { id: groupId }, data: { categoryId: null } });
  }
}
