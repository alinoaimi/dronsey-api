import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { param, body } from "express-validator";
import knex from "../../db";
import { getDrone } from "../../utils/formatters";
import { logActivity } from "../../utils/activity_log";

export const updateDroneValidation = [
    param("id").isInt().withMessage("Invalid drone ID"),
    body("status").optional().isIn(["available", "broken", "busy"]).withMessage("Status must be one of: available, broken, busy")
];

export const updateDroneHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const droneId = parseInt(req.params.id as string);
        const { status } = req.body;

        // Check if drone exists
        const existing = await knex("drones").where({ id: droneId }).first();
        if (!existing) {
            return res.status(404).json({ error: "Drone not found" });
        }

        // Update status if provided
        if (status !== undefined) {
            await knex("drones").where({ id: droneId }).update({ status });
        }

        // Fetch updated drone using getDrone
        const drone = await getDrone(droneId);

        await logActivity({
            userId: req.user?.id,
            action: "drone.update",
            entityType: "drone",
            entityId: droneId,
            details: status !== undefined ? { status } : {},
            req
        });

        res.json({ drone });
    } catch (error) {
        next(error);
    }
};
