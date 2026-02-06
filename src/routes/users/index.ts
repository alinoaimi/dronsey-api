import { Router, Response } from "express";
import { AuthRequest, authCheck } from "../../middleware/auth";
import { getUser } from "./get";
import { updateUser } from "./update";
import { createUser, createUserValidation } from "./create";

const router = Router();

// GET /users/:id or /users/me
router.get("/:id", authCheck(), getUser);

// PUT /users/:id
router.put("/:id", authCheck(["admin"]), updateUser);

// POST /users
router.post("/", authCheck(["admin"]), createUserValidation, createUser);

export default router;
