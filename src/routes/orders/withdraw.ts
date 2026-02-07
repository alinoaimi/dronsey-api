import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { param } from "express-validator";
import knex from "../../db";
import { logActivity } from "../../utils/activity_log";
import { emitOrderWithdrawn } from "../../socketio";

export const withdrawOrderValidation = [
    param("id").exists().withMessage("Order ID is required"),
];

export const withdrawOrder = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orderIdOrUuid = req.params.id;
        const user = req.user!;

        // Fetch the order
        const order = await knex("orders").where({ id: orderIdOrUuid }).orWhere({ order_uuid: orderIdOrUuid }).first();

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status === "withdrawn") {
            return res.status(400).json({ message: "Order is already withdrawn" });
        }

        // Authorization: if user role is 'user', check ownership
        if (user.role === "user" && order.user_id !== user.id) {
            return res.status(403).json({ message: "Access denied. You can only withdraw your own orders." });
        }

        // Get drone IDs before deactivating assignments
        const activeDroneIds = await knex("orders_drones")
            .where({ order_id: order.id, is_active: 1 })
            .pluck("drone_id");

        // Use transaction for atomicity
        await knex.transaction(async (trx: typeof knex) => {
            // Update order status to withdrawn
            await trx("orders")
                .where({ id: order.id })
                .update({ status: "withdrawn" });

            // Deactivate drone assignments
            await trx("orders_drones")
                .where({ order_id: order.id, is_active: 1 })
                .update({ is_active: 0 });

            // Set drones to available
            if (activeDroneIds.length > 0) {
                await trx("drones")
                    .whereIn("id", activeDroneIds)
                    .update({ status: "available" });
            }
        });

        await logActivity({
            userId: user.id,
            action: "order.withdraw",
            entityType: "order",
            entityId: order.id,
            req
        });

        // notify assigned drones via sockets
        for (const droneId of activeDroneIds) {
            emitOrderWithdrawn(droneId, order.id);
        }

        res.status(200).json({ message: "Order withdrawn successfully" });

    } catch (error) {
        console.error("Withdraw Order Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
