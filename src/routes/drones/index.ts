import { Router } from "express";
import { authCheck } from "../../middleware/auth";
import { getAvailableOrders } from "./available_orders";

const router = Router();

// GET /drones/available_orders
// Allowing drones and admins to view available orders
router.get("/available_orders", authCheck(["drone", "admin"]), getAvailableOrders);

export default router;
