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
    };
}

export const authCheck = (roles?: string | string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Access denied. No token provided." });
            return;
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            req.user = decoded;

            if (roles) {
                const requiredRoles = Array.isArray(roles) ? roles : [roles];
                if (!requiredRoles.includes(decoded.role)) {
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
