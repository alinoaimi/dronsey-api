import request from "supertest";
import app from "../src/index";
import knex from "../src/db";
import { createTestUser, getToken, createOrderForUser } from "./helpers/auth";

describe("Drones", () => {
    describe("POST /drones/location", () => {
        it("should update drone location", async () => {
            await createTestUser("test_drone", "drone");
            const token = await getToken("test_drone");

            const res = await request(app)
                .post("/drones/location")
                .set("Authorization", `Bearer ${token}`)
                .send({ location: { lat: 12.34, lng: 56.78 } });

            expect(res.status).toBe(200);
            expect(res.body.drone).toBeDefined();
        });

        it("should reject non-drone user", async () => {
            await createTestUser("test_user", "user");
            const token = await getToken("test_user");

            const res = await request(app)
                .post("/drones/location")
                .set("Authorization", `Bearer ${token}`)
                .send({ location: { lat: 12.34, lng: 56.78 } });

            expect(res.status).toBe(403);
        });
    });

    describe("GET /drones/available_orders", () => {
        it("should return available orders for drone", async () => {
            const { userId } = await createTestUser("test_user2", "user");
            await createTestUser("test_drone2", "drone");
            await createOrderForUser(userId);

            const token = await getToken("test_drone2");

            const res = await request(app)
                .get("/drones/available_orders")
                .set("Authorization", `Bearer ${token}`);

            if (res.status !== 200) {
                console.error("Available orders error:", res.body);
            }
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe("Broken drone handoff", () => {
        it("should make order available again when drone breaks", async () => {
            const { userId } = await createTestUser("test_user3", "user");
            const { droneId } = await createTestUser("test_drone3", "drone");
            const userToken = await getToken("test_user3");
            const droneToken = await getToken("test_drone3");

            // create and process order up to pickup
            const createRes = await request(app)
                .post("/orders")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    pickup_location: { lat: 0, lng: 0 },
                    dropoff_location: { lat: 1, lng: 1 },
                    pickup_address: "A",
                    dropoff_address: "B"
                });
            if (createRes.status !== 201) {
                console.error("Create order failed:", createRes.body);
            }
            expect(createRes.status).toBe(201);
            const orderId = createRes.body.order.id;

            await request(app)
                .post(`/orders/${orderId}/reserve`)
                .set("Authorization", `Bearer ${droneToken}`);

            await request(app)
                .post(`/orders/${orderId}/pickup`)
                .set("Authorization", `Bearer ${droneToken}`);

            // drone breaks down
            const releaseRes = await request(app)
                .post(`/orders/${orderId}/release`)
                .set("Authorization", `Bearer ${droneToken}`)
                .send({ release_type: "broken", location: { lat: 0.5, lng: 0.5 } });

            expect(releaseRes.status).toBe(200);
            expect(releaseRes.body.order.status).toBe("available");

            // check drone is marked broken
            const drone = await knex("drones").where({ id: droneId }).first();
            expect(drone.status).toBe("broken");
        });
    });
});
