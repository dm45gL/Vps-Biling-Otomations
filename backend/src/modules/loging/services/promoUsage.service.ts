import { prisma } from "../../../core/db/client";
import { Parser as Json2CsvParser } from "json2csv";
import nodemailer from "nodemailer";

export class PromoUsageService {
  /**
   * List usage by promo with pagination
   */
  async listByPromo(
    promoId: string,
    options?: { skip?: number; take?: number }
  ) {
    const { skip = 0, take = 20 } = options || {};

    const [items, total] = await prisma.$transaction([
      prisma.promoUsage.findMany({
        where: { promoId },
        orderBy: { usedAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          usedAt: true,
          client: { select: { id: true, email: true } },
        },
      }),
      prisma.promoUsage.count({ where: { promoId } }),
    ]);

    return { items, total, skip, take };
  }

  /**
   * Summary of promo usage
   */
  async summary(promoId: string) {
    const promo = await prisma.promo.findUnique({
      where: { id: promoId },
      select: { globalLimit: true, usedCount: true },
    });

    if (!promo) throw new Error("Promo not found");

    const uniqueUsers = await prisma.promoUsage.groupBy({
      by: ["clientId"],
      where: { promoId },
      _count: { clientId: true },
    });

    return {
      usedCount: promo.usedCount,
      globalLimit: promo.globalLimit,
      remaining:
        promo.globalLimit !== null
          ? Math.max(promo.globalLimit - promo.usedCount, 0)
          : null,
      uniqueUsers: uniqueUsers.length,
    };
  }

  /**
   * Generate CSV log dari array usage
   */
  async generateCsvLog(usages: {
  id: string;
  usedAt: Date;
  client: { id: string; email: string };
}[]): Promise<string> {
  const csvFields = ["id", "usedAt", "clientId", "clientEmail"];
  const csvData = usages.map((u) => ({
    id: u.id,
    usedAt: u.usedAt.toISOString(),
    clientId: u.client.id,
    clientEmail: u.client.email,
  }));

  // Hapus generic <...>
  const parser = new Json2CsvParser({ fields: csvFields });
  return parser.parse(csvData);
}


  /**
   * Auto delete usages older than 1 month
   * CSV log dikirim ke semua admin BUSINESS
   */
  async autoDeleteOldUsages() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Ambil usages lebih tua dari 1 bulan
    const oldUsages = await prisma.promoUsage.findMany({
      where: { usedAt: { lt: oneMonthAgo } },
      select: {
        id: true,
        promoId: true,
        usedAt: true,
        client: { select: { id: true, email: true } },
      },
    });

    if (oldUsages.length === 0) return;

    // Generate CSV
    const csvLog = await this.generateCsvLog(oldUsages);

    // Ambil semua admin BUSINESS
    const admins = await prisma.admin.findMany({
      where: { role: "BUSINESS" },
      select: { email: true },
    });
    const emails = admins.map(({ email }) => email);

    if (emails.length > 0) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Promo System" <${process.env.SMTP_USER}>`,
        to: emails.join(","),
        subject: `Promo Usage Log (Auto-delete)`,
        text: "Attached CSV contains deleted promo usages older than 1 month.",
        attachments: [
          {
            filename: `promo_usages_${new Date().toISOString()}.csv`,
            content: csvLog,
          },
        ],
      });
    }

    // Hapus usages lama
    await prisma.promoUsage.deleteMany({
      where: { usedAt: { lt: oneMonthAgo } },
    });

    console.log(`Auto-deleted ${oldUsages.length} usages and sent CSV to admins`);
  }
}
