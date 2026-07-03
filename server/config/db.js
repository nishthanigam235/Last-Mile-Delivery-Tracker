const mongoose = require('mongoose');

let mongoServer;

/**
 * Automatically seed default logistics structure and accounts if DB is empty
 */
const autoSeedDatabase = async () => {
  try {
    const User = require('../models/User');
    const count = await User.countDocuments();
    if (count > 0) {
      console.log('Database already contains records. Skipping auto-seeding.');
      return;
    }

    console.log('Database is empty! Triggering automatic seed configurations...');
    const Zone = require('../models/Zone');
    const RateCard = require('../models/RateCard');

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
    console.log(`Auto-Seed: Created ${zones.length} Zones.`);

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
    console.log(`Auto-Seed: Created ${rateCards.length} Rate Card configs.`);

    // 3. Create Default Users
    const users = [
      {
        name: 'System Admin',
        email: 'admin@lastmile.com',
        password: 'Password123',
        phone: '9999999999',
        role: 'admin',
      },
      {
        name: 'John Doe Enterprise',
        email: 'customer@lastmile.com',
        password: 'Password123',
        phone: '8888888888',
        role: 'customer',
      },
      {
        name: 'Delhi Delivery Rider',
        email: 'agent1@lastmile.com',
        password: 'Password123',
        phone: '7777777771',
        role: 'delivery_agent',
        zone: northZoneId,
        currentLocation: { lat: 28.5355, lng: 77.2639 },
        isAvailable: true,
      },
      {
        name: 'Mumbai Delivery Rider',
        email: 'agent2@lastmile.com',
        password: 'Password123',
        phone: '7777777772',
        role: 'delivery_agent',
        zone: westZoneId,
        currentLocation: { lat: 18.9750, lng: 72.8258 },
        isAvailable: true,
      },
      {
        name: 'Bangalore Delivery Rider',
        email: 'agent3@lastmile.com',
        password: 'Password123',
        phone: '7777777773',
        role: 'delivery_agent',
        zone: southZoneId,
        currentLocation: { lat: 12.9208, lng: 77.6244 },
        isAvailable: true,
      },
    ];

    for (const u of users) {
      await User.create(u);
    }
    console.log('Auto-Seed: Created Default admin, customer, and zone delivery agents.');
    console.log('Auto-Seed: Seeding process finished successfully.');
  } catch (error) {
    console.error('Auto-Seed error:', error);
  }
};

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // Check if we should fallback to in-memory database
    const isLocal = !mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');
    
    if (isLocal) {
      try {
        console.log(`Connecting to local MongoDB: ${mongoUri || 'mongodb://127.0.0.1:27017/last_mile_delivery'}`);
        const conn = await mongoose.connect(mongoUri || 'mongodb://127.0.0.1:27017/last_mile_delivery', {
          serverSelectionTimeoutMS: 1500,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Trigger check & auto-seeding
        await autoSeedDatabase();
        return;
      } catch (err) {
        console.log('Local MongoDB not running. Spinning up In-Memory MongoDB Server...');
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          mongoServer = await MongoMemoryServer.create();
          mongoUri = mongoServer.getUri();
          console.log(`In-Memory MongoDB Server is running at: ${mongoUri}`);
          process.env.MONGO_URI = mongoUri;
        } catch (memErr) {
          console.error('Failed to start MongoMemoryServer:', memErr.message);
          throw err;
        }
      }
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Trigger check & auto-seeding
    await autoSeedDatabase();
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;


