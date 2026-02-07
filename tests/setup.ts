import dotenv from "dotenv";
dotenv.config();

import knex from "../src/db";

beforeAll(async () => {
    // wait for db connection
    await knex.raw("SELECT 1");
});

afterAll(async () => {
    await knex.destroy();
});

// clean up test data after each test
afterEach(async () => {
    // delete in order to respect foreign keys
    await knex("orders_drones").del();
    await knex("drones_location_history").del();
    await knex("activity_log").del();
    await knex("orders").del();
    await knex("drones").del();
    await knex("users").where("username", "like", "test_%").del();
});
