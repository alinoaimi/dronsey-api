import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import knex from "../../db";
import { formatOrder } from "../../utils/formatters";

export const getAvailableOrders = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        // Available orders are those with status 'available' 
        // AND not currently assigned to any drone (is_active = 1 in orders_drones)
        const availableOrders = await knex("orders")
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
            .where("status", "available")
            .whereNotExists(function (this: any) {
                this.select("*")
                    .from("orders_drones")
                    .whereRaw("orders_drones.order_id = orders.id")
                    .andWhere("is_active", 1);
            });

        res.status(200).json(availableOrders.map(formatOrder));

    } catch (error) {
        console.error("Get Available Orders Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
