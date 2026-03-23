import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

const vendorSchema = new mongoose.Schema({
    shopLocation: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    }
}, { strict: false });

const Vendor = mongoose.model('Vendor', vendorSchema);

async function checkAndFixVendors() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB.');

    const vendors = await Vendor.find({});
    console.log(`Found ${vendors.length} vendors.`);

    for (const v of vendors) {
        console.log(`Vendor: ${v.storeName || v.email}, Location: ${JSON.stringify(v.shopLocation?.coordinates)}`);
        
        // If location is default [0,0], give them a sample location in Indore (near the test case)
        if (!v.shopLocation || !v.shopLocation.coordinates || (v.shopLocation.coordinates[0] === 0 && v.shopLocation.coordinates[1] === 0)) {
            console.log(`Updating vendor ${v.storeName} with sample Indore location...`);
            await Vendor.findByIdAndUpdate(v._id, {
                'shopLocation.type': 'Point',
                'shopLocation.coordinates': [75.8577, 22.7196]
            });
        }
    }

    console.log('Done.');
    process.exit(0);
}

checkAndFixVendors().catch(err => {
    console.error(err);
    process.exit(1);
});
