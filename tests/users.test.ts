import request from "supertest";
import app from "../src/index";
import { createTestUser, getToken } from "./helpers/auth";
import knex from "../src/db";

describe("Users", () => {
    let adminToken: string;
    let userToken: string;

    beforeEach(async () => {
        // Create admin and regular user for testing RBAC
        await createTestUser("test_admin_user_list", "admin");
        await createTestUser("test_regular_user_list", "user");

        adminToken = await getToken("test_admin_user_list");
        userToken = await getToken("test_regular_user_list");
    });

    describe("GET /users", () => {
        it("should list users for admin", async () => {
            const res = await request(app)
                .get("/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(2);

            // verify fields
            const user = res.body[0];
            expect(user).toHaveProperty("username");
            expect(user).toHaveProperty("role");
            expect(user).not.toHaveProperty("password"); // critical security check
        });

        it("should reject non-admin", async () => {
            const res = await request(app)
                .get("/users")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });

        it("should reject unauthenticated request", async () => {
            const res = await request(app)
                .get("/users");

            expect(res.status).toBe(401);
        });
    });
});
