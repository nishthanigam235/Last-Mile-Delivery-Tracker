const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Zone = require('../models/Zone');
const RateCard = require('../models/RateCard');
const Order = require('../models/Order');

// Load env variables
dotenv.config();

const seedData = async () => {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/last_mile_delivery');
    console.log('Seed: Connected to Database...');

    // Clear existing collections
    await User.deleteMany();
    await Zone.deleteMany();
    await RateCard.deleteMany();
    await Order.deleteMany();
    console.log('Seed: Cleared all old database entries.');

    // 1. Create Zones
    const zones = await Zone.create([
      {
        zoneName: 'North Zone',
        city: 'Delhi',
        pincodes: ['110001', '110020', '110092'],
      },
      {
        zoneName: 'West Zone',
        city: 'Mumbai',
        pincodes: ['400001', '400011', '400072'],
      },
      {
        zoneName: 'South Zone',
        city: 'Bangalore',
        pincodes: ['560001', '560034', '560103'],
      },
    ]);
    console.log(`Seed: Created ${zones.length} Zones.`);

    const northZoneId = zones[0]._id;
    const westZoneId = zones[1]._id;
    const southZoneId = zones[2]._id;

    // 2. Create Rate Cards
    const rateCards = await RateCard.create([
      {
        zoneType: 'intra',
        orderType: 'B2B',
        pricePerKg: 12.0,
        codCharge: 20.0,
      },
      {
        zoneType: 'intra',
        orderType: 'B2C',
        pricePerKg: 18.0,
        codCharge: 25.0,
      },
      {
        zoneType: 'inter',
        orderType: 'B2B',
        pricePerKg: 28.0,
        codCharge: 40.0,
      },
      {
        zoneType: 'inter',
        orderType: 'B2C',
        pricePerKg: 38.0,
        codCharge: 50.0,
      },
    ]);
    console.log(`Seed: Created ${rateCards.length} Rate Card configs.`);

    // 3. Create Users
    const users = [
      // Admin
      {
        name: 'System Admin',
        email: 'admin@lastmile.com',
        password: 'Password123',
        phone: '9999999999',
        role: 'admin',
      },
      // Customer
      {
        name: 'John Doe Enterprise',
        email: 'customer@lastmile.com',
        password: 'Password123',
        phone: '8888888888',
        role: 'customer',
      },
      // North Agent
      {
        name: 'Delhi Delivery Rider',
        email: 'agent1@lastmile.com',
        password: 'Password123',
        phone: '7777777771',
        role: 'delivery_agent',
        zone: northZoneId,
        currentLocation: { lat: 28.5355, lng: 77.2639 }, // near 110020
        isAvailable: true,
      },
      // West Agent
      {
        name: 'Mumbai Delivery Rider',
        email: 'agent2@lastmile.com',
        password: 'Password123',
        phone: '7777777772',
        role: 'delivery_agent',
        zone: westZoneId,
        currentLocation: { lat: 18.9750, lng: 72.8258 }, // near 400011
        isAvailable: true,
      },
      // South Agent
      {
        name: 'Bangalore Delivery Rider',
        email: 'agent3@lastmile.com',
        password: 'Password123',
        phone: '7777777773',
        role: 'delivery_agent',
        zone: southZoneId,
        currentLocation: { lat: 12.9208, lng: 77.6244 }, // near 560034
        isAvailable: true,
      },
    ];

    for (const u of users) {
      await User.create(u);
    }
    console.log('Seed: Created Admin, Customer, and 3 Zone-assigned delivery agents.');

    console.log('Seed: Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
