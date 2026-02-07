import express, { Request, Response } from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io
import { initSocketIO } from "./socketio";
initSocketIO(httpServer);


// Middleware
app.use(cors()); // temporarily for testing, to be properly setup in production
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

// global error handler to never expose stack traces to users
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});

// start server only when run directly (not when imported for tests)
if (require.main === module) {
    httpServer.listen(PORT, () => {
        console.log(`API running on http://localhost:${PORT}`);
    });
}

export default app;
