import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { param } from "express-validator";
import knex from "../../db";
import { getOrder } from "../../utils/formatters";
import { logActivity } from "../../utils/activity_log";

export const reserveOrderValidation = [
    param("id").exists().withMessage("Order ID is required"),
];

export const reserveOrder = async (req: AuthRequest, res: Response): Promise<any> => {

    try {
        const orderIdOrUuid = req.params.id;
        const user = req.user!;

        if (user.drone_id == null) {
            return res.status(400).json({ message: "Drone mapping not found for user" });
        }

        const droneId = user.drone_id;

        // Fetch the order
        const order = await knex("orders")
            .where({ id: orderIdOrUuid })
            .orWhere({ order_uuid: orderIdOrUuid })
            .first();

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status !== "available") {
            return res.status(400).json({ message: "Order is not available for reservation" });
        }

        const activeAssignment = await knex("orders_drones")
            .where({ order_id: order.id, is_active: 1 })
            .first();

        if (activeAssignment) {
            return res.status(400).json({ message: "Order is already assigned" });
        }


        // use transaction for atomicity
        await knex.transaction(async (trx: typeof knex) => {
            await trx("orders_drones").insert({
                order_id: order.id,
                drone_id: droneId,
                assign_time: Date.now(),
                is_active: 1
            });

            await trx("orders")
                .where({ id: order.id })
                .update({ status: "assigned" });

            await trx("drones")
                .where({ id: droneId })
                .update({ status: "busy" });
        });

        await logActivity({
            userId: user.id,
            action: "order.reserve",
            entityType: "order",
            entityId: order.id,
            details: { drone_id: droneId },
            req
        });

        res.status(200).json({
            message: "Order reserved successfully",
            order: await getOrder(order.id)
        });

    } catch (error) {
        console.error("Reserve Order Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
