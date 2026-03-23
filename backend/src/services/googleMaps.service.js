import axios from 'axios';
import ApiError from '../utils/ApiError.js';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Get Distance and Duration between two points using Google Distance Matrix API
 * @param {Array} origin - [lng, lat]
 * @param {Array} destination - [lng, lat]
 * @returns {Object} { distance: number (km), duration: string }
 */
export const getDistanceMatrix = async (origin, destination) => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key') {
        // Fallback to simple Haversine if no API key
        return null;
    }

    try {
        const originStr = `${origin[1]},${origin[0]}`; // lat,lng
        const destStr = `${destination[1]},${destination[0]}`; // lat,lng

        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: originStr,
                destinations: destStr,
                key: GOOGLE_MAPS_API_KEY,
                mode: 'driving',
                units: 'metric'
            }
        });

        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(`Google Maps API Error: ${data.status}`);
        }

        const element = data.rows[0]?.elements[0];
        if (element.status !== 'OK') {
             console.warn('Google Maps Element Status:', element.status);
             return null;
        }

        return {
            distance: parseFloat((element.distance.value / 1000).toFixed(2)), // in KM
            duration: element.duration.text, // e.g., "12 mins"
            durationValue: element.duration.value // in seconds
        };
    } catch (error) {
        console.error('Distance Matrix Error:', error.message);
        return null;
    }
};
