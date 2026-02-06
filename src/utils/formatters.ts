import knex from "../db";
import { calculateDistance, calculateETA } from "./geo";

export const getOrder = async (idOrUuid: number | string, fullDetails: boolean = false) => {
    const query = knex("orders")
        .select(
            "id",
            "user_id",
            "order_uuid",
            "pickup_address",
            "dropoff_address",
            "status",
            knex.raw("ST_X(pickup_location) as pickup_lng"),
            knex.raw("ST_Y(pickup_location) as pickup_lat"),
            knex.raw("ST_X(dropoff_location) as dropoff_lng"),
            knex.raw("ST_Y(dropoff_location) as dropoff_lat")
        );

    if (typeof idOrUuid === "number") {
        query.where({ id: idOrUuid });
    } else {
        query.where({ order_uuid: idOrUuid });
    }

    const order = await query.first();
    if (!order) return null;

    const formatted = formatOrder(order);

    if (fullDetails) {
        const orderDrones = await knex("orders_drones")
            .select(
                "orders_drones.*",
                knex.raw("ST_X(release_location) as release_lng"),
                knex.raw("ST_Y(release_location) as release_lat"),
                knex.raw("ST_X(last_location) as last_lng"),
                knex.raw("ST_Y(last_location) as last_lat")
            )
            .where({ order_id: order.id });

        formatted.order_drones = orderDrones.map((od: any) => ({
            id: od.id,
            drone_id: od.drone_id,
            assign_time: od.assign_time,
            deassign_time: od.deassign_time,
            pickup_time: od.pickup_time,
            release_time: od.release_time,
            release_location: od.release_lng ? { lat: od.release_lat, lng: od.release_lng } : null,
            release_type: od.release_type,
            last_location: od.last_lng ? { lat: od.last_lat, lng: od.last_lng } : null,
            is_active: od.is_active
        }));

        // calculate ETA if there's an active drone with a last_location
        const activeDrone = orderDrones.find((od: any) => od.is_active === 1 && od.last_lng && od.last_lat);
        if (activeDrone && order.dropoff_lat && order.dropoff_lng) {
            const distanceKm = calculateDistance(
                activeDrone.last_lat,
                activeDrone.last_lng,
                order.dropoff_lat,
                order.dropoff_lng
            );
            const eta = calculateETA(distanceKm);
            formatted.eta = {
                ...eta,
                distance_km: Math.round(distanceKm * 100) / 100,
                calculated_at: Date.now()
            };
        } else {
            formatted.eta = null;
        }
    }

    return formatted;
};

export const formatOrder = (order: any): any => ({
    id: order.id,
    order_uuid: order.order_uuid,
    status: order.status,
    pickup_address: order.pickup_address,
    dropoff_address: order.dropoff_address,
    pickup_location: {
        lat: order.pickup_lat,
        lng: order.pickup_lng
    },
    dropoff_location: {
        lat: order.dropoff_lat,
        lng: order.dropoff_lng
    }
});

export const formatUser = (user: any) => {
    const formatted: any = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        create_time: user.create_time,
        update_time: user.update_time
    };

    // Include drone_id only if present
    if (user.drone_id != null) {
        formatted.drone_id = user.drone_id;
    }

    return formatted;
};

export const getUserPublic = async (id: number) => {
    const user = await knex("users")
        .select("id", "username", "name")
        .where({ id })
        .first();

    return user ? { id: user.id, username: user.username, name: user.name } : null;
};

export const getDrone = async (id: number) => {
    const drone = await knex("drones")
        .select(
            "id",
            "status",
            knex.raw("ST_X(current_location) as lng"),
            knex.raw("ST_Y(current_location) as lat")
        )
        .where({ id })
        .first();

    if (!drone) return null;

    return formatDrone(drone);
};

export const formatDrone = async (drone: any) => {
    // Find the user associated with this drone
    const droneUser = await knex("users")
        .select("id")
        .where({ drone_id: drone.id })
        .first();

    const user = droneUser ? await getUserPublic(droneUser.id) : null;

    return {
        id: drone.id,
        status: drone.status,
        current_location: {
            lat: drone.lat,
            lng: drone.lng
        },
        user
    };
};
