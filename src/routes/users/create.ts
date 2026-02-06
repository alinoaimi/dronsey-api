import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { body, validationResult } from "express-validator";
import knex from "../../db";
import { hashPassword } from "../../utils/password";
import { formatUser } from "../../utils/formatters";

export const createUserValidation = [
    body("username").isString().notEmpty().withMessage("Username is required"),
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("password").isString().isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    body("role").optional().isIn(["admin", "user", "drone"]).withMessage("Invalid role"),
];

export const createUser = async (req: AuthRequest, res: Response): Promise<any> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, name, password, role = "user" } = req.body;

        // Check if username already exists
        const existingUser = await knex("users").where({ username }).first();
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const hashedPassword = await hashPassword(password);
        const now = Date.now();

        let droneId = null;

        // If role is drone, create a drone record
        if (role === "drone") {
            const [newDroneId] = await knex("drones").insert({
                status: "IDLE",
                current_location: knex.raw("POINT(0, 0)") // Default location, can be updated later
            });
            droneId = newDroneId;
        }

        const [userId] = await knex("users").insert({
            username,
            name,
            password: hashedPassword,
            role,
            create_time: now,
            update_time: now,
            drone_id: droneId
        });


        const createdUser = await knex("users")
            .select("id", "username", "name", "role", "is_active", "create_time", "update_time", "drone_id")
            .where({ id: userId })
            .first();

        res.status(201).json({
            message: "User created successfully",
            user: formatUser(createdUser)
        });

    } catch (error) {
        console.error("Create User Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
