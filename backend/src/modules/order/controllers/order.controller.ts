import { Request, Response } from "express";
import { OrderService } from "../services/order.service";

const orderService = new OrderService();

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const data = await orderService.getPaymentStatus(orderId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    let message = "Internal server error";
    let status = 500;

    if (error instanceof Error) {
      message = error.message;
      if (message === "ORDER_NOT_FOUND") {
        status = 404;
        message = "Order not found";
      }
    }

    console.error("GET PAYMENT STATUS ERROR:", error);
    return res.status(status).json({
      success: false,
      message,
    });
  }
};
