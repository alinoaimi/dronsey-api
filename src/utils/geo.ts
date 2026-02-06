import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

const DEFAULT_DRONE_SPEED_KMH = 40;

TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en')


export const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const R = 6371; // earth's radius in kilometers

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const toRadians = (degrees: number): number => degrees * (Math.PI / 180);


export const calculateETA = (
    distanceKm: number,
    speedKmh: number = DEFAULT_DRONE_SPEED_KMH // in the future, we can periodically calculate drones speeds based on their location_history and time differences vs distance moved
): { minutes: number; formatted: string } => {
    const hours = distanceKm / speedKmh;
    const minutes = Math.round(hours * 60);

    return {
        minutes,
        formatted: timeAgo.format(Date.now() + (minutes * 60 * 1000))
    };
};
