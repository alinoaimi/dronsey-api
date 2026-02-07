import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { param, body } from "express-validator";
import knex from "../../db";
import { getOrder } from "../../utils/formatters";
import { logActivity } from "../../utils/activity_log";
import { emitOrderUpdated } from "../../socketio";

const ORDER_STATUSES = ["available", "assigned", "picked_up", "delivered", "withdrawn", "failed"];

export const updateOrderValidation = [
    param("id").exists().withMessage("Order ID is required"),
    body("status").optional().isIn(ORDER_STATUSES).withMessage(`Status must be one of: ${ORDER_STATUSES.join(", ")}`),
    body("pickup_address").optional(),
    body("dropoff_address").optional(),
    body("pickup_location").optional().isObject().withMessage("Pickup location must be an object {lat, lng}"),
    body("pickup_location.lat").optional().isNumeric().withMessage("Pickup latitude must be a number"),
    body("pickup_location.lng").optional().isNumeric().withMessage("Pickup longitude must be a number"),
    body("dropoff_location").optional().isObject().withMessage("Dropoff location must be an object {lat, lng}"),
    body("dropoff_location.lat").optional().isNumeric().withMessage("Dropoff latitude must be a number"),
    body("dropoff_location.lng").optional().isNumeric().withMessage("Dropoff longitude must be a number"),
];

export const updateOrder = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orderIdOrUuid = req.params.id;
        const user = req.user!;
        const { status, pickup_address, dropoff_address, pickup_location, dropoff_location } = req.body;

        // Fetch the order
        const order = await knex("orders")
            .where({ id: orderIdOrUuid })
            .orWhere({ order_uuid: orderIdOrUuid })
            .first();

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const updates: any = {};

        if (status !== undefined) {
            updates.status = status;
        }

        if (pickup_address !== undefined) {
            updates.pickup_address = typeof pickup_address === "object"
                ? JSON.stringify(pickup_address)
                : pickup_address;
        }

        if (dropoff_address !== undefined) {
            updates.dropoff_address = typeof dropoff_address === "object"
                ? JSON.stringify(dropoff_address)
                : dropoff_address;
        }

        if (pickup_location !== undefined) {
            updates.pickup_location = knex.raw("POINT(?, ?)", [pickup_location.lng, pickup_location.lat]);
        }

        if (dropoff_location !== undefined) {
            updates.dropoff_location = knex.raw("POINT(?, ?)", [dropoff_location.lng, dropoff_location.lat]);
        }

        if (Object.keys(updates).length > 0) {
            await knex("orders").where({ id: order.id }).update(updates);
        }

        await logActivity({
            userId: user.id,
            action: "order.update",
            entityType: "order",
            entityId: order.id,
            details: { fieldsUpdated: Object.keys(updates) },
            req
        });

        // notify assigned drone via sockets
        const assignment = await knex("orders_drones")
            .where({ order_id: order.id, is_active: 1 })
            .first();
        if (assignment) {
            const updatedOrder = await getOrder(order.id);
            emitOrderUpdated(assignment.drone_id, order.id, updatedOrder?.status || "unknown");
        }

        res.status(200).json({
            message: "Order updated successfully",
            order: await getOrder(order.id)
        });

    } catch (error) {
        console.error("Update Order Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
