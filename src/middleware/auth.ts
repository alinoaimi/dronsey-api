import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
        drone_id?: number;
    };
}

export const authCheck = (roles?: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Access denied. No token provided." });
            return;
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;

            // verify user exists in database with matching role
            const knex = req.app.get("knex");
            const user = await knex("users")
                .where({ id: decoded.id, is_active: true })
                .select("id", "username", "role", "drone_id")
                .first();

            if (!user) {
                res.status(401).json({ error: "User not found or inactive" });
                return;
            }

            // verify the role in JWT matches the record in the database
            if (user.role !== decoded.role) {
                res.status(401).json({ error: "Token role mismatch. Please login again." });
                return;
            }

            req.user = {
                id: user.id,
                username: user.username,
                role: user.role,
                drone_id: user.drone_id
            };

            if (roles) {
                const requiredRoles = Array.isArray(roles) ? roles : [roles];
                if (!requiredRoles.includes(user.role)) {
                    res.status(403).json({ error: "Access denied. Insufficient permissions." });
                    return;
                }
            }

            next();
        } catch (error) {
            res.status(401).json({ error: "Invalid or expired token" });
        }
    };
};
