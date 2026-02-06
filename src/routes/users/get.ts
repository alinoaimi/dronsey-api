import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { formatUser } from "../../utils/formatters";

export const getUser = async (req: AuthRequest, res: Response) => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        let targetUserId = req.params.id;

        if (targetUserId === "me") {
            targetUserId = currentUser.id.toString();
        } else {
            if (currentUser.role !== "admin") {
                res.status(403).json({ error: "Access denied. Admin privileges required." });
                return;
            }
        }

        const knex = req.app.get("knex");

        const user = await knex("users")
            .where({ id: targetUserId, is_active: true })
            .select("id", "username", "name", "role", "create_time", "update_time")
            .first();

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json(formatUser(user));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
};
