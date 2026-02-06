import { Router } from "express";
import { authCheck } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { getAvailableOrders } from "./available_orders";
import { updateLocation, updateLocationValidation } from "./update_location";
import { listDrones } from "./list";
import { getDroneHandler, getDroneValidation } from "./get";
import { updateDroneHandler, updateDroneValidation } from "./update";

const router = Router();

// GET /drones - List all drones (admin only)
router.get("/", authCheck(["admin"]), listDrones);

// GET /drones/:id - Get drone info (admin only)
router.get("/:id", authCheck(["admin"]), getDroneValidation, validate, getDroneHandler);

// PUT /drones/:id - Update drone status (admin only)
router.put("/:id", authCheck(["admin"]), updateDroneValidation, validate, updateDroneHandler);

// GET /drones/available_orders
// Allowing drones and admins to view available orders
router.get("/available_orders", authCheck(["drone", "admin"]), getAvailableOrders);

// POST /drones/location
router.post("/location", authCheck(["drone"]), updateLocationValidation, validate, updateLocation);

export default router;
