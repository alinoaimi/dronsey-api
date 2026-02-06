import { Request, Response, NextFunction } from "express";
import { param } from "express-validator";
import { getDrone } from "../../utils/formatters";

export const getDroneValidation = [
    param("id").isInt().withMessage("Invalid drone ID")
];

export const getDroneHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const droneId = parseInt(req.params.id as string);
        const drone = await getDrone(droneId);

        if (!drone) {
            return res.status(404).json({ error: "Drone not found" });
        }

        res.json({ drone });
    } catch (error) {
        next(error);
    }
};
