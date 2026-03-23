import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

const deliveryBoySchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    applicationStatus: String,
    isActive: Boolean
}, { strict: false });

const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

async function listDeliveryBoys() {
    await mongoose.connect(MONGO_URI);
    const boys = await DeliveryBoy.find({}).limit(5);
    console.log(`Found ${boys.length} delivery boys:`);
    boys.forEach(b => {
        console.log(`- ${b.name} (${b.email}) - Status: ${b.applicationStatus}, Active: ${b.isActive}`);
    });
    process.exit(0);
}

listDeliveryBoys().catch(console.error);
