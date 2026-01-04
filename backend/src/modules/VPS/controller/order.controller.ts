import { Request, Response } from 'express'
import { OrderService } from '../services/order.service'

export class OrderController {
  static async getClientOrders(req: Request, res: Response) {
    try {
      const { clientId } = req.params

      if (!clientId) {
        return res.status(400).json({
          message: 'clientId is required',
        })
      }

      const orders = await OrderService.getOrdersByClient(clientId)

      return res.json({
        success: true,
        data: orders.map(order => ({
          id: order.id,
          status: order.status,
          rawPrice: order.rawPrice,
          discount: order.discount,
          finalPrice: order.finalPrice,
          months: order.months,
          nextBillingDate: order.nextBillingDate,
          createdAt: order.createdAt,

          product: {
            name: order.pricing.rawProduct.name,
            cpu: order.pricing.rawProduct.cpu,
            ram: order.pricing.rawProduct.ram,
            disk: order.pricing.rawProduct.disk,
            bandwidth: order.pricing.rawProduct.bandwidth,
            duration: order.pricing.pricingDuration.label,
          },

          vps: order.vps.map(vps => ({
            id: vps.id,
            hostname: vps.hostname,
            status: vps.status,
            ip: vps.ipAddress.ip,
            region: vps.region.name,
            createdAt: vps.createdAt,
          })),
        })),
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch client orders',
      })
    }
  }
}
