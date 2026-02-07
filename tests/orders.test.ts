import request from "supertest";
import app from "../src/index";
import { createTestUser, getToken, createOrderForUser } from "./helpers/auth";

describe("Orders", () => {
    describe("POST /orders", () => {
        it("should create order as user", async () => {
            await createTestUser("test_user", "user");
            const token = await getToken("test_user");

            const res = await request(app)
                .post("/orders")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    pickup_location: { lat: 0, lng: 0 },
                    dropoff_location: { lat: 1, lng: 1 },
                    pickup_address: "123 Test St",
                    dropoff_address: "456 Dest Ave"
                });

            expect(res.status).toBe(201);
            expect(res.body.order).toHaveProperty("id");
            expect(res.body.order.status).toBe("available");
        });

        it("should reject order creation from drone", async () => {
            await createTestUser("test_drone", "drone");
            const token = await getToken("test_drone");

            const res = await request(app)
                .post("/orders")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    pickup_location: { lat: 0, lng: 0 },
                    dropoff_location: { lat: 1, lng: 1 },
                    pickup_address: "123 Test St",
                    dropoff_address: "456 Dest Ave"
                });

            expect(res.status).toBe(403);
        });
    });

    describe("Order lifecycle", () => {
        it("should complete full delivery flow", async () => {
            // setup users
            const { userId } = await createTestUser("test_user2", "user");
            const { droneId } = await createTestUser("test_drone2", "drone");
            const userToken = await getToken("test_user2");
            const droneToken = await getToken("test_drone2");

            // user creates order
            const createRes = await request(app)
                .post("/orders")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    pickup_location: { lat: 0, lng: 0 },
                    dropoff_location: { lat: 1, lng: 1 },
                    pickup_address: "Start",
                    dropoff_address: "End"
                });
            expect(createRes.status).toBe(201);
            const orderId = createRes.body.order.id;

            // drone reserves
            const reserveRes = await request(app)
                .post(`/orders/${orderId}/reserve`)
                .set("Authorization", `Bearer ${droneToken}`);
            expect(reserveRes.status).toBe(200);
            expect(reserveRes.body.order.status).toBe("assigned");

            // drone picks up
            const pickupRes = await request(app)
                .post(`/orders/${orderId}/pickup`)
                .set("Authorization", `Bearer ${droneToken}`);
            expect(pickupRes.status).toBe(200);
            expect(pickupRes.body.order.status).toBe("picked_up");

            // drone delivers
            const deliverRes = await request(app)
                .post(`/orders/${orderId}/release`)
                .set("Authorization", `Bearer ${droneToken}`)
                .send({ release_type: "delivered", location: { lat: 1, lng: 1 } });
            expect(deliverRes.status).toBe(200);
            expect(deliverRes.body.order.status).toBe("delivered");
        });
    });

    describe("GET /orders", () => {
        it("should list orders for admin", async () => {
            await createTestUser("test_admin2", "admin");
            const token = await getToken("test_admin2");

            const res = await request(app)
                .get("/orders")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.orders)).toBe(true);
        });

        it("should list own orders for user", async () => {
            await createTestUser("test_user3", "user");
            const token = await getToken("test_user3");

            const res = await request(app)
                .get("/orders")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.orders)).toBe(true);
        });
    });
});
