import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { hashPassword } from "../../utils/password";
import { formatUser } from "../../utils/formatters";
import { logActivity } from "../../utils/activity_log";

export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, password, role, is_active } = req.body;
        const knex = req.app.get("knex");

        // fetch current target user to check role constraints
        const targetUser = await knex("users").where({ id }).first();

        if (!targetUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        // role update rules:
        // * Users with the 'drone' role cannot have their role changed.
        // * Only 'admin' or 'user' roles can be assigned.

        const updates: any = { update_time: Date.now() };

        if (name !== undefined) updates.name = name;
        if (password !== undefined) updates.password = await hashPassword(password);
        if (is_active !== undefined) updates.is_active = is_active;

        if (role !== undefined) {
            if (targetUser.role === "drone") {
                res.status(400).json({ error: "Cannot change role of a drone user" });
                return;
            }
            if (!["admin", "user"].includes(role)) {
                res.status(400).json({ error: "Invalid role. Allowed roles: admin, user" });
                return;
            }
            updates.role = role;
        }

        await knex("users").where({ id }).update(updates);

        // Fetch updated
        const updatedUser = await knex("users")
            .where({ id })
            .select("id", "username", "name", "role", "is_active", "create_time", "update_time", "drone_id")
            .first();

        await logActivity({
            userId: req.user?.id,
            action: "user.update",
            entityType: "user",
            entityId: parseInt(id as string),
            details: { fieldsUpdated: Object.keys(updates).filter(k => k !== 'update_time') },
            req
        });

        res.json(formatUser(updatedUser));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update user" });
    }
};
