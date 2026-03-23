import { Server } from 'socket.io';
import DeliveryBoy from '../models/DeliveryBoy.model.js';

let io;
const locationCache = new Map(); // Store { deliveryBoyId: { coordinates: [lng, lat], updatedAt: timestamp } }
const DB_UPDATE_INTERVAL = 30000; // 30 seconds

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.CLIENT_URL,
                'http://localhost:3000',
                'http://localhost:5173'
            ].filter(Boolean),
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`🏠 Client ${socket.id} joined room: ${room}`);
        });

        // --- Delivery Tracking System ---

        // Join specific order room (for customers tracking an order)
        socket.on('join_order_room', (orderId) => {
            const room = `order_${orderId}`;
            socket.join(room);
            console.log(`📦 Client ${socket.id} joined tracking room: ${room}`);
        });

        // Delivery boy updates their location
        socket.on('update_location', (payload) => {
            const { lat, lng, deliveryBoyId, orderId } = payload;
            
            if (!lat || !lng || !deliveryBoyId) return;

            // 1. Update In-Memory Cache for performance
            locationCache.set(deliveryBoyId, {
                coordinates: [lng, lat], // GeoJSON order
                updatedAt: Date.now()
            });

            // 2. Broadcast to specific order room (if orderId provided)
            if (orderId) {
                const room = `order_${orderId}`;
                io.to(room).emit('location_updated', {
                    lat,
                    lng,
                    deliveryBoyId,
                    timestamp: Date.now()
                });
            }

            // 3. Optional: Broadcast to a general delivery partner room for admin tracking
            io.to('admin_tracking').emit('delivery_boy_moved', {
                lat, lng, deliveryBoyId
            });
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    // --- Periodic DB Persistence ---
    setInterval(async () => {
        if (locationCache.size === 0) return;

        const entries = Array.from(locationCache.entries());
        locationCache.clear(); // Clear for next interval

        console.log(`💾 Persisting ${entries.length} delivery boy locations to DB...`);

        const bulkOps = entries.map(([id, data]) => ({
            updateOne: {
                filter: { _id: id },
                update: { 
                    $set: { 
                        'currentLocation.coordinates': data.coordinates,
                        'currentLocation.type': 'Point'
                    } 
                }
            }
        }));

        try {
            await DeliveryBoy.bulkWrite(bulkOps);
        } catch (err) {
            console.error('❌ Failed to persist locations to DB:', err);
        }
    }, DB_UPDATE_INTERVAL);

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

/**
 * Emit events to specific rooms
 * @param {string} room - room name (e.g. user_123, vendor_456, delivery_partners)
 * @param {string} event - event name
 * @param {object} data - payload
 */
export const emitEvent = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
    }
};
