import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { query } from "express-validator";
import knex from "../../db";
import { formatOrder } from "../../utils/formatters";

const ORDER_STATUSES = ["available", "assigned", "picked_up", "delivered", "withdrawn", "failed"];

export const listOrdersValidation = [
    query("status").optional().isIn(ORDER_STATUSES).withMessage(`Status must be one of: ${ORDER_STATUSES.join(", ")}`)
];

export const listOrders = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { status } = req.query;

        const queryBuilder = knex("orders")
            .select(
                "id",
                "user_id",
                "order_uuid",
                "pickup_address",
                "dropoff_address",
                "status",
                knex.raw("ST_X(pickup_location) as pickup_lng"),
                knex.raw("ST_Y(pickup_location) as pickup_lat"),
                knex.raw("ST_X(dropoff_location) as dropoff_lng"),
                knex.raw("ST_Y(dropoff_location) as dropoff_lat")
            )
            .orderBy("id", "desc");

        if (status) {
            queryBuilder.where({ status });
        }

        // if not admin, only show own orders
        if (req.user!.role !== "admin") {
            queryBuilder.where({ user_id: req.user!.id });
        }

        const orders = await queryBuilder;

        res.json({ orders: orders.map(formatOrder) });

    } catch (error) {
        console.error("List Orders Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
