import { Router } from "express";
import { authCheck } from "../../middleware/auth";
import { createOrder, createOrderValidation } from "./create";
import { withdrawOrder, withdrawOrderValidation } from "./withdraw";

const router = Router();

// POST /orders
router.post("/", authCheck(["user"]), createOrderValidation, createOrder);

// POST /orders/:id/withdraw
router.post("/:id/withdraw", authCheck(["admin", "user"]), withdrawOrderValidation, withdrawOrder);

export default router;
