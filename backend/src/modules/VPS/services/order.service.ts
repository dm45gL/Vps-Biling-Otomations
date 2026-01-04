import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class OrderService {
  static async getOrdersByClient(clientId: string) {
    return prisma.order.findMany({
      where: {
        clientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        pricing: {
          include: {
            rawProduct: true,
            pricingDuration: true,
          },
        },
        billingAddress: true,
        vps: {
          include: {
            region: true,
            ipAddress: true,
            template: true,
          },
        },
      },
    })
  }
}
