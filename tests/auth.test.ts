import request from "supertest";
import app from "../src/index";
import { createTestUser, getToken } from "./helpers/auth";

describe("Auth", () => {
    describe("POST /auth", () => {
        it("should login with valid credentials", async () => {
            await createTestUser("test_user1");

            const res = await request(app)
                .post("/auth")
                .send({ username: "test_user1", password: "testpass123" });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("token");
        });

        it("should fail with wrong password", async () => {
            await createTestUser("test_user2");

            const res = await request(app)
                .post("/auth")
                .send({ username: "test_user2", password: "wrongpass" });

            expect(res.status).toBe(401);
        });

        it("should fail with nonexistent user", async () => {
            const res = await request(app)
                .post("/auth")
                .send({ username: "nobody", password: "whatever" });

            expect(res.status).toBe(401);
        });
    });

    describe("Protected routes", () => {
        it("should reject request without token", async () => {
            const res = await request(app).get("/users/me");
            expect(res.status).toBe(401);
        });

        it("should accept request with valid token", async () => {
            const { userId } = await createTestUser("test_admin", "admin");
            const token = await getToken("test_admin");

            const res = await request(app)
                .get("/users/me")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBeDefined();
            expect(res.body.username).toBe("test_admin");
        });

        it("should reject user trying to access admin route", async () => {
            await createTestUser("test_user3", "user");
            const token = await getToken("test_user3");

            // /orders admin route
            const res = await request(app)
                .get("/orders")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });
});
