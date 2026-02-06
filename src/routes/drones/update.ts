import { Request, Response, NextFunction } from "express";
import { param, body } from "express-validator";
import knex from "../../db";
import { getDrone } from "../../utils/formatters";

export const updateDroneValidation = [
    param("id").isInt().withMessage("Invalid drone ID"),
    body("status").optional().isIn(["available", "broken", "busy"]).withMessage("Status must be one of: available, broken, busy")
];

export const updateDroneHandler = async (req: Request, res: Response, next: NextFunction) => {
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

        res.json({ drone });
    } catch (error) {
        next(error);
    }
};
