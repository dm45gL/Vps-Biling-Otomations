import { Xendit } from "xendit-node";
import {
  CreateInvoiceRequest,
  Invoice,
} from "xendit-node/invoice/models";

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
});

const invoiceClient = xenditClient.Invoice;

export class InvoiceService {
  async createInvoice(input: {
    externalId: string;
    amount: number;
    customerEmail: string;
    description?: string;
    invoiceDuration?: number; // seconds
    reminderTime?: number; // seconds before expiry
  }): Promise<Invoice> {
    const data: CreateInvoiceRequest = {
      externalId: input.externalId,
      amount: input.amount,
      payerEmail: input.customerEmail,
      description: input.description || `Invoice for ${input.externalId}`,
      currency: "IDR",
      invoiceDuration: input.invoiceDuration ?? 172800, 
    };

    return await invoiceClient.createInvoice({ data });
  }
}
