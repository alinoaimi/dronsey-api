import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { param } from "express-validator";
import knex from "../../db";
import { getOrder } from "../../utils/formatters";
import { logActivity } from "../../utils/activity_log";

export const pickupOrderValidation = [
    param("id").exists().withMessage("Order ID is required"),
];

export const pickupOrder = async (req: AuthRequest, res: Response): Promise<any> => {

    try {
        const orderIdOrUuid = req.params.id;
        const user = req.user!;

        if (user.drone_id == null) {
            return res.status(400).json({ message: "User is not drone" });
        }

        const droneId = user.drone_id;

        // fetch the order
        const order = await knex("orders")
            .where({ id: orderIdOrUuid })
            .orWhere({ order_uuid: orderIdOrUuid })
            .first();

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status !== "assigned") {
            return res.status(400).json({ message: "Order must be assigned before pickup" });
        }

        // verify the order is assigned to this drone
        const assignment = await knex("orders_drones")
            .where({ order_id: order.id, drone_id: droneId, is_active: 1 })
            .first();

        if (!assignment) {
            return res.status(403).json({ message: "Order is not assigned to this drone" });
        }

        // update order status and pickup time
        await knex("orders")
            .where({ id: order.id })
            .update({ status: "picked_up" });

        await knex("orders_drones")
            .where({ id: assignment.id })
            .update({ pickup_time: Date.now() });

        await logActivity({
            userId: user.id,
            action: "order.pickup",
            entityType: "order",
            entityId: order.id,
            details: { drone_id: droneId },
            req
        });

        res.status(200).json({
            message: "Order picked up successfully",
            order: await getOrder(order.id)
        });

    } catch (error) {
        console.error("Pickup Order Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
