import { Router, Response } from "express";
import { AuthRequest, authCheck } from "../../middleware/auth";


const router = Router();

// // GET /orders/:id
// router.get("/:id", authCheck(), getUser);

// // PUT /orders/:id
// router.put("/:id", authCheck(["admin"]), updateUser);

// POST /orders
router.post("/", authCheck(["admin"]), createOrder);

export default router;
