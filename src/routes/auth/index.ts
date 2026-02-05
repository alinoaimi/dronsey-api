import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { comparePassword } from "../../utils/password";
import { validate } from "../../middleware/validate";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

const JWT_EXPIRES_IN = 604800; // 7 days in seconds


// Login
router.post(
    "/",
    [
        body("username").notEmpty().withMessage("Username is required"),
        body("password").notEmpty().withMessage("Password is required"),
        validate
    ],
    async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;
            const knex = req.app.get("knex");

            const user = await knex("users").where({ username, is_active: true }).first();
            if (!user || !(await comparePassword(password, user.password))) {
                res.status(401).json({ error: "Invalid credentials" });
                return;
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            res.json({
                token,
                expires_in: JWT_EXPIRES_IN,
                user: { id: user.id, username: user.username, name: user.name, role: user.role }
            });

        } catch (error) {
            res.status(500).json({ error: "Login failed" });
        }
    }
);


export default router;
