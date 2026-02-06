import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { param } from "express-validator";
import knex from "../../db";
import { getOrder as fetchOrder, getDrone as fetchDrone } from "../../utils/formatters";

export const getOrderValidation = [
    param("id").exists().withMessage("Order ID is required"),
];

export const getOrder = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const orderIdOrUuid = req.params.id;
        const user = req.user!;

        // fetch the order
        const order = await knex("orders")
            .where({ id: orderIdOrUuid })
            .orWhere({ order_uuid: orderIdOrUuid })
            .first();

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // authorization based on role
        if (user.role === "admin") {
            // admin can see all orders
        } else if (user.role === "user") {
            // user can only see orders they created
            if (order.user_id !== user.id) {
                return res.status(403).json({ message: "Access denied" });
            }
        } else if (user.role === "drone") {
            // drone can see orders assigned to them or available orders
            if (order.status === "available") {
                // available orders are visible to all drones
            } else {
                // check if order is assigned to this drone
                const assignment = await knex("orders_drones")
                    .where({ order_id: order.id, drone_id: user.drone_id, is_active: 1 })
                    .first();

                if (!assignment) {
                    return res.status(403).json({ message: "Access denied" });
                }
            }
        }

        res.status(200).json({
            order: await fetchOrder(order.id, true)
        });

    } catch (error) {
        console.error("Get Order Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
