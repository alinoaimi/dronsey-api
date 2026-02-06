import { Request, Response, NextFunction } from "express";
import knex from "../../db";
import { formatDrone } from "../../utils/formatters";

export const listDrones = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const drones = await knex("drones")
            .select(
                "id",
                "status",
                knex.raw("ST_X(current_location) as lng"),
                knex.raw("ST_Y(current_location) as lat")
            );

        const formattedDrones = await Promise.all(drones.map(formatDrone));

        res.json({ drones: formattedDrones });
    } catch (error) {
        next(error);
    }
};
