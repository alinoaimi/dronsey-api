import { NextFunction, Request, Response } from "express";
import knex from "../../db";
import { formatUser } from "../../utils/formatters";

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await knex("users")
            .select("id", "username", "name", "role", "drone_id", "is_active", "create_time", "update_time");
        res.json(users.map(formatUser));
    } catch (err) {
        next(err);
    }
};
