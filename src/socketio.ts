import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import knex from "./db";

const JWT_SECRET = process.env.JWT_SECRET!;

let io: Server;

interface AuthenticatedSocket extends Socket {
    data: {
        user: {
            id: number;
            role: string;
            drone_id?: number;
        };
    };
}

export const initSocketIO = (httpServer: HTTPServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // JWT Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }

        try {
            const payload = jwt.verify(token, JWT_SECRET) as any;
            socket.data.user = payload;
            next();
        } catch {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", async (socket: AuthenticatedSocket) => {
        const user = socket.data.user;
        console.log(`Socket connected: ${user.role} (id: ${user.id})`);

        // role-based room assignments
        if (user.role === "drone" && user.drone_id) {
            socket.join(`drone:${user.drone_id}`);
        }

        if (user.role === "admin") {
            socket.join("admin:drones");
        }

        // allow users and admins to subscribe to specific orders
        socket.on("subscribe:order", async (orderId: number) => {
            if (user.role === "admin") {
                // admin can subscribe to any order
                socket.join(`order:${orderId}`);
            } else if (user.role === "user") {
                // user can only subscribe to their own orders
                const order = await knex("orders")
                    .where({ id: orderId, user_id: user.id })
                    .first();
                if (order) {
                    socket.join(`order:${orderId}`);
                }
            }
        });

        socket.on("unsubscribe:order", (orderId: number) => {
            socket.leave(`order:${orderId}`);
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${user.role} (id: ${user.id})`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

// Helper functions to emit events
export const emitOrderUpdated = (droneId: number, orderId: number, status: string) => {
    if (io) {
        io.to(`drone:${droneId}`).emit("order:updated", { orderId, status });
    }
};

export const emitOrderWithdrawn = (droneId: number, orderId: number) => {
    if (io) {
        io.to(`drone:${droneId}`).emit("order:withdrawn", { orderId });
    }
};

export const emitOrderLocation = (orderId: number, location: { lat: number; lng: number }, eta?: number) => {
    if (io) {
        io.to(`order:${orderId}`).emit("order:location", { orderId, ...location, eta });
    }
};

export const emitDroneLocation = (droneId: number, location: { lat: number; lng: number }, status: string) => {
    if (io) {
        io.to("admin:drones").emit("drone:location", { droneId, ...location, status });
    }
};
