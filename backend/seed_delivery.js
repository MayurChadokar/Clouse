import mongoose from 'mongoose';
import DeliveryBoy from './src/models/DeliveryBoy.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existing = await DeliveryBoy.findOne({ email: 'delivery@delivery.com' });
        if (existing) {
            console.log('Demo delivery boy already exists.');
            return;
        }

        const demo = await DeliveryBoy.create({
            name: 'Demo Delivery Boy',
            email: 'delivery@delivery.com',
            password: 'delivery123',
            phone: '9876543210',
            address: '123 Delivery St, City',
            vehicleType: 'Bike',
            vehicleNumber: 'DL-1234',
            applicationStatus: 'approved',
            isActive: true,
            isAvailable: true,
            status: 'offline',
            documents: {
                drivingLicense: 'mock-url',
                drivingLicenseBack: 'mock-url',
                aadharCard: 'mock-url',
                aadharCardBack: 'mock-url'
            }
        });

        console.log('Demo delivery boy seeded successfully.');
        console.log('Account Status: approved (Required for login)');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
