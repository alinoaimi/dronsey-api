import { Router } from "express";
import { authCheck } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createOrder, createOrderValidation } from "./create";
import { listOrders, listOrdersValidation } from "./list";
import { getOrder, getOrderValidation } from "./get";
import { updateOrder, updateOrderValidation } from "./update";
import { reserveOrder, reserveOrderValidation } from "./reserve";
import { withdrawOrder, withdrawOrderValidation } from "./withdraw";
import { pickupOrder, pickupOrderValidation } from "./pickup";
import { releaseOrder, releaseOrderValidation } from "./release";

const router = Router();

// GET /orders (admin and user)
router.get("/", authCheck(["admin", "user"]), listOrdersValidation, validate, listOrders);

// POST /orders
router.post("/", authCheck(["user"]), createOrderValidation, validate, createOrder);

// GET /orders/:id
router.get("/:id", authCheck(), getOrderValidation, validate, getOrder);

// PUT /orders/:id (admin only)
router.put("/:id", authCheck(["admin"]), updateOrderValidation, validate, updateOrder);

// POST /orders/:id/withdraw
router.post("/:id/withdraw", authCheck(["admin", "user"]), withdrawOrderValidation, validate, withdrawOrder);

// POST /orders/:id/reserve
router.post("/:id/reserve", authCheck(["drone"]), reserveOrderValidation, validate, reserveOrder);

// POST /orders/:id/pickup
router.post("/:id/pickup", authCheck(["drone"]), pickupOrderValidation, validate, pickupOrder);

// POST /orders/:id/release
router.post("/:id/release", authCheck(["drone"]), releaseOrderValidation, validate, releaseOrder);

export default router;
