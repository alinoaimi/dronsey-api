import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { body } from "express-validator";
import { v4 as uuidv4 } from "uuid";
import knex from "../../db";
import { getOrder } from "../../utils/formatters";
import { logActivity } from "../../utils/activity_log";

export const createOrderValidation = [
    body("pickup_location").isObject().withMessage("Pickup location must be an object {lat, lng}"),
    body("pickup_location.lat").isNumeric().withMessage("Pickup latitude must be a number"),
    body("pickup_location.lng").isNumeric().withMessage("Pickup longitude must be a number"),
    body("dropoff_location").isObject().withMessage("Dropoff location must be an object {lat, lng}"),
    body("dropoff_location.lat").isNumeric().withMessage("Dropoff latitude must be a number"),
    body("dropoff_location.lng").isNumeric().withMessage("Dropoff longitude must be a number"),
    body("pickup_address").exists().withMessage("Pickup address is required"),
    body("dropoff_address").exists().withMessage("Dropoff address is required"),
];

export const createOrder = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { pickup_location, dropoff_location, pickup_address, dropoff_address } = req.body;
        const user_id = req.user?.id;
        const order_uuid = uuidv4();

        // POINT takes (lng, lat) not (lat, lng) 
        const pickupPoint = knex.raw("POINT(?, ?)", [pickup_location.lng, pickup_location.lat]);
        const dropoffPoint = knex.raw("POINT(?, ?)", [dropoff_location.lng, dropoff_location.lat]);

        // Ensure addresses are strings (if passed as objects)
        const pickupJson = typeof pickup_address === 'object' ? JSON.stringify(pickup_address) : pickup_address;
        const dropoffJson = typeof dropoff_address === 'object' ? JSON.stringify(dropoff_address) : dropoff_address;

        const [id] = await knex("orders").insert({
            user_id,
            order_uuid,
            pickup_location: pickupPoint,
            dropoff_location: dropoffPoint,
            pickup_address: pickupJson,
            dropoff_address: dropoffJson,
            status: "available"
        });

        await logActivity({
            userId: user_id,
            action: "order.create",
            entityType: "order",
            entityId: id,
            details: { pickup_address, dropoff_address },
            req
        });

        res.status(201).json({
            message: "Order created successfully",
            order: await getOrder(id)
        });

    } catch (error) {
        console.error("Create Create Order Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
