// src/modules/sysadmin/services/saveTemplatesToDB.ts
import { prisma } from "../../../core/db/client";
import { ProxmoxTemplate } from "./hypervisor.interface";

/**
 * Simpan template ke database dengan bulk upsert.
 * Jika opsi sync=true, template yang tidak ada di hypervisor akan dihapus dari DB.
 * Menambahkan log untuk debugging.
 */
export async function saveTemplatesToDB(
  hypervisorId: string,
  templates: ProxmoxTemplate[],
  options?: { sync?: boolean }
) {
  try {
    // Ambil semua template lama dari DB untuk hypervisor ini
    const existingTemplates = await prisma.template.findMany({
      where: { hypervisorId },
    });

    console.log("Existing templates from DB:", existingTemplates);
    console.log("Templates from hypervisor:", templates);

    const existingMap = new Map(
      existingTemplates.map(t => [`${t.node}-${t.vmid}-${t.type}`, t])
    );
    const newMap = new Map(
      templates.map(t => [`${t.node}-${t.vmid}-${t.type}`, t])
    );

    const createData: any[] = [];
    const updateData: any[] = [];
    const deleteIds: string[] = [];

    // Tentukan create/update
    for (const tpl of templates) {
      const key = `${tpl.node}-${tpl.vmid}-${tpl.type}`;
      const existing = existingMap.get(key);

      if (existing) {
        if (existing.name !== tpl.name || existing.type !== tpl.type) {
          updateData.push({ id: existing.id, name: tpl.name, type: tpl.type });
        }
      } else {
        createData.push({
          hypervisorId,
          node: tpl.node,
          vmid: tpl.vmid,
          name: tpl.name,
          type: tpl.type,
        });
      }
    }

    // Tentukan delete jika sync=true
    if (options?.sync) {
      for (const old of existingTemplates) {
        const key = `${old.node}-${old.vmid}-${old.type}`;
        if (!newMap.has(key)) {
          deleteIds.push(old.id);
        }
      }
    }

    console.log("Data to update:", updateData);
    console.log("Data to create:", createData);
    console.log("IDs to delete:", deleteIds);

    // Jalankan bulk query menggunakan transaction
    if (updateData.length || createData.length || deleteIds.length) {
      await prisma.$transaction([
        ...updateData.map(u => {
          console.log("Updating:", u);
          return prisma.template.update({
            where: { id: u.id },
            data: { name: u.name, type: u.type },
          });
        }),
        ...createData.map(c => {
          console.log("Creating:", c);
          return prisma.template.create({ data: c });
        }),
        ...deleteIds.map(id => {
          console.log("Deleting ID:", id);
          return prisma.template.delete({ where: { id } });
        }),
      ]);
      console.log("Transaction executed successfully.");
    } else {
      console.log("Nothing to create, update, or delete.");
    }
  } catch (err) {
    console.error("Error in saveTemplatesToDB:", err);
    throw err; // lempar lagi supaya caller tahu ada error
  }
}
