import { Router } from "express";
import { authCheck } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createOrder, createOrderValidation } from "./create";
import { getOrder, getOrderValidation } from "./get";
import { reserveOrder, reserveOrderValidation } from "./reserve";
import { withdrawOrder, withdrawOrderValidation } from "./withdraw";
import { pickupOrder, pickupOrderValidation } from "./pickup";
import { releaseOrder, releaseOrderValidation } from "./release";

const router = Router();

// POST /orders
router.post("/", authCheck(["user"]), createOrderValidation, validate, createOrder);

// GET /orders/:id
router.get("/:id", authCheck(), getOrderValidation, validate, getOrder);

// POST /orders/:id/withdraw
router.post("/:id/withdraw", authCheck(["admin", "user"]), withdrawOrderValidation, validate, withdrawOrder);

// POST /orders/:id/reserve
router.post("/:id/reserve", authCheck(["drone"]), reserveOrderValidation, validate, reserveOrder);

// POST /orders/:id/pickup
router.post("/:id/pickup", authCheck(["drone"]), pickupOrderValidation, validate, pickupOrder);

// POST /orders/:id/release
router.post("/:id/release", authCheck(["drone"]), releaseOrderValidation, validate, releaseOrder);

export default router;
