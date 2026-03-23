import { calculateDistance } from './src/utils/geo.js';

const vendorCoords = [75.8577, 22.7196]; // Indore
const customerCoords = [75.9000, 22.7500]; // Nearby in Indore

const dist = calculateDistance(vendorCoords, customerCoords);
console.log(`Distance: ${dist} km`);

const fee = (d) => {
    let f = 25;
    if (d > 3) {
        f += Math.ceil(d - 3) * 9;
    }
    return f;
};

console.log(`Fee: Rs.${fee(dist)}`);
