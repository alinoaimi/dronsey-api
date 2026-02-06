import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
import knex from "./db";
app.set("knex", knex);

// Routes
// -- Auth
import authRoutes from "./routes/auth";
app.use("/auth", authRoutes);

// -- Users
import userRoutes from "./routes/users";
app.use("/users", userRoutes);

// -- Orders
import orderRoutes from "./routes/orders";
app.use("/orders", orderRoutes);

// -- Drones
import droneRoutes from "./routes/drones";
app.use("/drones", droneRoutes);

app.get("/", (req: Request, res: Response) => {
    res.send("Welcome أهلاً وسهلاً Bienvenido Welcommenn");
});


// Start server
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});

export default app;
