import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ─────────────────────────────────────
  // PROMO (buat jika belum ada)
  // ─────────────────────────────────────
  let promo = await prisma.promo.findFirst({
    where: { code: "PROMO-DEMO" },
  });

  if (!promo) {
    promo = await prisma.promo.create({
      data: {
        code: "PROMO-DEMO",

        // enum harus sesuai schema
        type: "PERCENT",   // PERCENT atau FIXED
        value: 10,         // 10%
        globalLimit: 100,
        usedCount: 0,

        startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log("✅ Promo PROMO-DEMO dibuat");
  }

  // ─────────────────────────────────────
  // CLIENT DUMMY
  // ─────────────────────────────────────
  const client = await prisma.client.upsert({
    where: { email: "dummy.client@example.com" },
    update: {},
    create: {
      email: "dummy.client@example.com",
      username: "dummyclient",
      password: "hashed-password",
    },
  });

  // ─────────────────────────────────────
  // PROMO USAGE PALSU (10 DATA)
  // ─────────────────────────────────────
  const usages = Array.from({ length: 10 }).map((_, i) => ({
    promoId: promo.id,
    clientId: client.id,
    usedAt: new Date(Date.now() - i * 86400000), // mundur per hari
  }));

  await prisma.promoUsage.createMany({
    data: usages,
    skipDuplicates: true,
  });

  // ─────────────────────────────────────
  // UPDATE USED COUNT
  // ─────────────────────────────────────
  await prisma.promo.update({
    where: { id: promo.id },
    data: {
      usedCount: {
        increment: usages.length,
      },
    },
  });

  console.log("✅ Dummy promo usage berhasil dibuat");
}

main()
  .catch((e) => console.error("❌ Seed error:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
