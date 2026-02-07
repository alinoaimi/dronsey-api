# Drone Delivery API Assessment

This is a simple Drone Delivery System API.

It is a REST API written in TypeScript, using Express.js for the server and MariaDB for the database.

## Architecture & Tech Stack

- **Framework**: Node.js + Express + TypeScript
- **Database**: MariaDB (v10.2+) with Spatial types (`POINT`).
- **ORM**: KnexJS (Database agnostic query builder).
- **Real-time**: Socket.io for live drone and order tracking.
- **Security**: JWT Authentication (via `authCheck` middleware).
- **Audit**: All actions are logged in the `activity_log` table.

## Key Features

### The "Broken Drone" Handoff
The system includes logic to handle drone failures. This is implemented in the **Release Endpoint**.

When a drone reports a failure during delivery (`POST /orders/:id/release` with `release_type: "broken"`):
1.  The drone's status updates to `broken`.
2.  The Order is immediately unassigned.
3.  The Order's **Pickup Location** is updated to the *drone's current location*.
4.  The Order status is reset to `available`, allowing another drone to reserve it immediately.

## API Documentation

For detailed request examples, check `/documentation` for Bruno and Postman collections.

![Bruno Collection](documentation/images/bruno_collection.png)


## Live Demo
API URL: https://drones-api.the-ghost.com

(email me for test users credentials)

## Endpoints

#### Auth
- `POST /auth`: Login and retrieve JWT token.

#### Users
- `GET /users/me`: Get current user details.
- `GET /users/:id`: Get specific user details.
- `POST /users`: Create a new user.
- `PUT /users/:id`: Update user details.

#### Orders
- `GET /orders`: List orders (supports filtering).
- `POST /orders`: Create a new order.
- `GET /orders/:id`: Get order details.
- `PUT /orders/:id`: Update order details (Admin).
- `POST /orders/:id/withdraw`: Withdraw a pending order.
- `POST /orders/:id/reserve`: Reserve an order (Drone).
- `POST /orders/:id/pickup`: Mark order as picked up covering (Drone).
- `POST /orders/:id/release`: Release order (Delivered or Broken).

#### Drones
- `GET /drones`: List all drones.
- `GET /drones/:id`: Get drone details.
- `PUT /drones/:id`: Update drone status or details.
- `POST /drones/location`: Update drone location.
- `GET /drones/available_orders`: Get orders available for pickup.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MariaDB (v10.2+) - *Required for `POINT` and spatial functions.*

### 1. Installation
```bash
git clone <repo_url>
cd drones
pnpm install # or npm, yarn
```

### 2. Configuration
Create the env file based on .env.example and SET database connection variables and JWT_SECRET
```bash
cp .env.example .env
```

### 3. Database
Import the schema from `documentation/db_schema.sql`.
*Note: This schema includes a default admin user.* 
- **Username**: `admin`
- **Password**: `123456789`

### 4. Running
```bash
# Development
pnpm dev

# Run Tests
pnpm test
```

## Docker Deployment
A Dockerfile is included, make sure you configure the environment variables before running it


## Recommended Test Flow
1.  **Auth**: Log in as `admin`, `user`, and `drone` to get Tokens.
2.  **User**: Create an order (`POST /orders`).
3.  **Drone**: Reserve the order (`POST /orders/:id/reserve`).
4.  **Drone**: Pick it up (`POST /orders/:id/pickup`).
5.  **Simulate Failure**: Call `POST /orders/:id/release` with body `{"release_type": "broken", ...}`.
6.  **Verify**: List orders (`GET /orders`). You will see the order is `available` again at the new coordinates.

## Considerations
To keep the project simple, location history is currently stored in the MariaDB database. However this is not ideal in production environment, as it can lead to performance issues. In a real-world scenario, this data should be moved to a specialized store (e.g., Redis, InfluxDB, or Cassandra) to ensure scalability and query performance.

