import Xendit from "xendit-node";

if (!process.env.XENDIT_SECRET_KEY) {
  throw new Error("XENDIT_SECRET_KEY tidak ditemukan di environment");
}

// Inisialisasi client
export const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
});

export const invoiceClient = xendit.Invoice;
