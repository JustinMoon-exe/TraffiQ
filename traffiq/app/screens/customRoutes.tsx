import { Coordinates } from '../types/types';
import { CustomRouteData } from '../types/types'; // Adjust path if needed

const START_LOCATION_PROXIMITY_THRESHOLD_DEGREES = 0.001;

export const START_LOCATION_PROXIMITY_THRESHOLD_SQUARED =
  START_LOCATION_PROXIMITY_THRESHOLD_DEGREES * START_LOCATION_PROXIMITY_THRESHOLD_DEGREES;

export const customWalkingRoutes: CustomRouteData[] = [
{
    id: 'rec-to-classroomS',
    startName: 'Student Recreation Center',
    destinationName: 'Classroom South', // Match this string exactly
    startCoords: { latitude: 33.75245, longitude: -84.38420 }, // Approx coords FOR Rec Center
    polyline: [
    // Add accurate coordinates for the walking path
    { latitude: 33.7525, longitude: -84.3842 },
    { latitude: 33.75269, longitude: -84.38527 },
    { latitude: 33.7530, longitude: -84.3862 },
    { latitude: 33.7533, longitude: -84.3866 },
    { latitude: 33.75261, longitude: -84.38716 }, // Approx coords FOR Classroom South
    ],
    directions: [
    "Start from Student Recreation Center main entrance.",
    "Walk through Student Center to Greenway.",
    "Climb stairs on left to Library Plaza.",
    "Classroom South will in front of you.",
    ],
    estimatedTime: 7, // Estimated minutes
},
{
    id: 'classroomS-to-urbanL',
    startName: 'Classroom South',
    destinationName: 'Urban Life', // Match this string exactly
    startCoords: { latitude: 33.753300, longitude: -84.387000 }, // Approx coords FOR Classroom South
    polyline: [
    // Add accurate coordinates for the walking path
    { latitude: 33.753300, longitude: -84.387000 },
    { latitude: 33.753800, longitude: -84.387500 },
    { latitude: 33.754500, longitude: -84.388000 },
    { latitude: 33.755588, longitude: -84.388420 }, // Approx coords FOR Urban Life Building
    ],
    directions: [
        "Start from Classroom South facing Gilmer St.",
        "Cross Gilmer St SE towards Petit Science Center.",
        "Walk north-west between Petit Science and Kell Hall.",
        "Urban Life building will be ahead.",
    ],
    estimatedTime: 4, // Estimated minutes
},
// Add more custom routes here if needed
];  

export const findMatchingCustomRoute = (
    userCoords: Coordinates | null,
    destinationName: string | null
): CustomRouteData | null => {
    if (!userCoords || !destinationName) {
        return null; // Cannot match without both user location and destination
    }

    for (const route of customWalkingRoutes) {
        // 1. Check if destination name matches (case-insensitive might be safer)
        if (route.destinationName.toLowerCase() === destinationName.toLowerCase()) {
            // 2. Check proximity to predefined start point (using latitude difference squared only for simplicity)
            const latDiff = userCoords.latitude - route.startCoords.latitude;
            // You could add a longitude check here too, but it's less reliable across different latitudes
            // const lonDiff = userCoords.longitude - route.startCoords.longitude;
            const distanceSq = latDiff * latDiff; // + lonDiff * lonDiff; // Using only latitude distance

            console.log(`Checking proximity for custom route "${route.id}": UserLat=${userCoords.latitude.toFixed(6)}, RouteStartLat=${route.startCoords.latitude.toFixed(6)}, DistSq=${distanceSq.toFixed(10)}, ThresholdSq=${START_LOCATION_PROXIMITY_THRESHOLD_SQUARED.toFixed(10)}`);

            if (distanceSq < START_LOCATION_PROXIMITY_THRESHOLD_SQUARED) {
                console.log(` --> User is CLOSE to start of custom route: ${route.id}`);
                return route; // Found a match based on destination AND proximity
            } else {
                 console.log(` --> User is TOO FAR from start of custom route: ${route.id}`);
            }
        }
    }

    return null; // No matching custom route found
};