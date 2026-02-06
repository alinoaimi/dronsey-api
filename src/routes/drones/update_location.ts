import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { body } from "express-validator";
import knex from "../../db";
import { getDrone } from "../../utils/formatters";

export const updateLocationValidation = [
    body("location").isObject().withMessage("Location must be an object {lat, lng}"),
    body("location.lat").isNumeric().withMessage("Latitude must be a number"),
    body("location.lng").isNumeric().withMessage("Longitude must be a number"),
];

export const updateLocation = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const user = req.user!;
        const { location } = req.body;

        if (user.drone_id == null) {
            return res.status(400).json({ message: "User is not a drone" });
        }

        const droneId = user.drone_id;
        const locationPoint = knex.raw("POINT(?, ?)", [location.lng, location.lat]);

        // Get active order assignment if any
        const activeAssignment = await knex("orders_drones")
            .where({ drone_id: droneId, is_active: 1 })
            .first();

        const orderId = activeAssignment?.order_id || null;

        // Update drone current location
        await knex("drones")
            .where({ id: droneId })
            .update({ current_location: locationPoint });

        // Update orders_drones last_location if active assignment
        if (activeAssignment) {
            await knex("orders_drones")
                .where({ id: activeAssignment.id })
                .update({ last_location: locationPoint });
        }

        // Log to location history
        await knex("drones_location_history").insert({
            drone_id: droneId,
            order_id: orderId,
            location: locationPoint,
            create_time: Date.now()
        });

        res.status(200).json({
            message: "Location updated successfully",
            drone: await getDrone(droneId)
        });

    } catch (error) {
        console.error("Update Location Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
