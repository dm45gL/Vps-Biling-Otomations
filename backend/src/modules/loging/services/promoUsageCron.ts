import cron from "node-cron";
import { PromoUsageService } from "./promoUsage.service"; // sesuaikan path

const promoUsageService = new PromoUsageService();

/**
 * Cron job: Auto delete promo usages older than 1 month
 * Schedule: First day of every month at 00:00
 */
cron.schedule("0 0 1 * *", async () => {
  try {
    console.log("[CRON] Starting auto-delete promo usages...");
    await promoUsageService.autoDeleteOldUsages();
    console.log("[CRON] Auto-delete promo usages completed.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[CRON] Error during auto-delete promo usages:", message);
  }
});
