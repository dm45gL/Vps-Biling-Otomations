import { prisma } from "../../../core/db/client";

export class BillingAddressService {

  async create(clientId: string, data: {
    fullName: string;
    email: string; 
    companyName?: string;
    country: string;
    state: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
    phone: string;
  }) {
    return prisma.billingAddress.create({
      data: {
        clientId,
        ...data,
      }
    });
  }

  async list(clientId: string) {
    return prisma.billingAddress.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" }
    });
  }

  async get(clientId: string, id: string) {
    return prisma.billingAddress.findFirst({
      where: { clientId, id }
    });
  }

  async delete(clientId: string, id: string) {
    return prisma.billingAddress.delete({
      where: { id }
    });
  }
}
