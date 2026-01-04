// src/modules/vps/vps.scheduler.ts
import cron from "node-cron";
import { prisma } from "../../../core/db/client";

cron.schedule("0 0 * * *", async () => {
  const now = new Date();

  const expired = await prisma.vPS.findMany({
    where: {
      order: {
        nextBillingDate: { lt: now },
      },
    },
    include: { order: true },
  });

  for (const v of expired) {
    const days = (now.getTime() - v.order.nextBillingDate.getTime()) / 86400000;

    if (days >= 3 && v.status === "RUNNING") {
      await prisma.vPS.update({
        where: { id: v.id },
        data: { status: "SUSPENDED" },
      });
    }

    if (days >= 15) {
      await prisma.vPS.update({
        where: { id: v.id },
        data: { status: "TERMINATED", deletedAt: now },
      });
    }
  }
});


