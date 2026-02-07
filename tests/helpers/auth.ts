import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import app from "../../src/index";
import knex from "../../src/db";
import { hashPassword } from "../../src/utils/password";
import { v4 as uuidv4 } from "uuid";

export async function createTestUser(username: string, role: string = "user") {
    const password = await hashPassword("testpass123");
    let droneId = null;

    if (role === "drone") {
        const [id] = await knex("drones").insert({
            status: "available",
            current_location: knex.raw("POINT(0, 0)")
        });
        droneId = id;
    }

    const [userId] = await knex("users").insert({
        username,
        name: username,
        password,
        role,
        drone_id: droneId,
        create_time: Date.now(),
        update_time: Date.now()
    });

    return { userId, droneId };
}

export async function getToken(username: string, password: string = "testpass123") {
    const res = await request(app)
        .post("/auth")
        .send({ username, password });
    return res.body.token;
}

export async function createOrderForUser(userId: number) {
    const [orderId] = await knex("orders").insert({
        user_id: userId,
        order_uuid: uuidv4(),
        pickup_location: knex.raw("POINT(0, 0)"),
        dropoff_location: knex.raw("POINT(1, 1)"),
        pickup_address: "Test Pickup",
        dropoff_address: "Test Dropoff",
        status: "available"
    });
    return orderId;
}
