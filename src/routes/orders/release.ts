import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { param, body } from "express-validator";
import knex from "../../db";
import { getOrder } from "../../utils/formatters";
import { logActivity } from "../../utils/activity_log";

export const releaseOrderValidation = [
    param("id").exists().withMessage("Order ID is required"),
    body("release_type").isIn(["delivered", "broken"]).withMessage("Release type must be 'delivered' or 'broken'"),
    body("location").isObject().withMessage("Location must be an object {lat, lng}"),
    body("location.lat").isNumeric().withMessage("Latitude must be a number"),
    body("location.lng").isNumeric().withMessage("Longitude must be a number"),
];

export const releaseOrder = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orderIdOrUuid = req.params.id;
        const user = req.user!;
        const { release_type, location } = req.body;

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

        if (order.status !== "picked_up") {
            return res.status(400).json({ message: "Order must be picked up to release" });
        }

        // verify the order is assigned to this drone
        const assignment = await knex("orders_drones")
            .where({ order_id: order.id, drone_id: droneId, is_active: 1 })
            .first();

        if (!assignment) {
            return res.status(403).json({ message: "Order is not assigned to this drone" });
        }

        // determine statuses based on release type
        const releasePoint = knex.raw("POINT(?, ?)", [location.lng, location.lat]);

        if (release_type === "delivered") {
            // normal delivery
            await knex("orders")
                .where({ id: order.id })
                .update({ status: "delivered" });

            await knex("drones")
                .where({ id: droneId })
                .update({ status: "available" });
        } else {
            // broken drone - make order available for pickup by another drone
            await knex("orders")
                .where({ id: order.id })
                .update({
                    status: "available",
                    pickup_location: releasePoint  // new pickup at drone's location
                });

            await knex("drones")
                .where({ id: droneId })
                .update({ status: "broken" });
        }

        await knex("orders_drones")
            .where({ id: assignment.id })
            .update({
                is_active: 0,
                release_time: Date.now(),
                release_location: releasePoint,
                release_type: release_type
            });

        await logActivity({
            userId: user.id,
            action: release_type === "delivered" ? "order.delivered" : "order.drone_broken_handoff",
            entityType: "order",
            entityId: order.id,
            details: release_type === "delivered"
                ? { drone_id: droneId, location }
                : {
                    drone_id: droneId,
                    drone_broken: true,
                    order_made_available: true,
                    new_pickup_location: location
                },
            req
        });

        res.status(200).json({
            message: release_type === "delivered" ? "Order delivered successfully" : "Order released due to drone failure",
            order: await getOrder(order.id)
        });

    } catch (error) {
        console.error("Release Order Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
