
export const formatOrder = (order: any) => ({
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
