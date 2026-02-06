const knex = require("knex")({
    client: "mysql2",
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        charset: "utf8mb4",
    },
    pool: {
        min: 0,
        max: 7
    }
});

export default knex;
