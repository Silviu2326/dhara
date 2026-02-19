const mongoose = require('mongoose');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/dharaterapeutas');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define basic schema for verification
const clientSchema = new mongoose.Schema({}, { strict: false });

const main = async () => {
  try {
    await connectDB();

    const Client = mongoose.model('Client', clientSchema);

    console.log('\n=== CLIENT COLLECTIONS DEBUG ===');

    // Check all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // Get all clients without any filters
    console.log('\n=== ALL CLIENTS (NO FILTERS) ===');
    const allClients = await Client.find({});
    console.log(`Total clients found: ${allClients.length}`);

    if (allClients.length > 0) {
      console.log('\nFirst 3 clients:');
      allClients.slice(0, 3).forEach((client, index) => {
        console.log(`\n${index + 1}. Client ID: ${client._id}`);
        console.log(`   Name: ${client.name}`);
        console.log(`   Email: ${client.email}`);
        console.log(`   Status: ${client.status}`);
        console.log(`   AssignedTherapist: ${client.assignedTherapist}`);
        console.log(`   Created: ${client.createdAt}`);
        console.log(`   Full object keys:`, Object.keys(client.toObject()));
      });
    }

    // Check clients collection specifically
    const clientsCollectionExists = collections.some(col => col.name === 'clients');
    console.log(`\n'clients' collection exists: ${clientsCollectionExists}`);

    if (clientsCollectionExists) {
      const clientsCollection = mongoose.connection.db.collection('clients');
      const clientsCount = await clientsCollection.countDocuments();
      console.log(`Direct clients collection count: ${clientsCount}`);

      if (clientsCount > 0) {
        const sampleClients = await clientsCollection.find({}).limit(3).toArray();
        console.log('Sample from clients collection:');
        sampleClients.forEach((client, index) => {
          console.log(`${index + 1}. ${client._id} | ${client.name} | ${client.email}`);
        });
      }
    }

    // Check if there's a different naming convention
    const possibleCollections = ['clients', 'client', 'Client', 'Clients'];
    for (const collName of possibleCollections) {
      try {
        const collection = mongoose.connection.db.collection(collName);
        const count = await collection.countDocuments();
        if (count > 0) {
          console.log(`\nFound ${count} documents in '${collName}' collection`);
          const sample = await collection.findOne({});
          console.log('Sample document structure:', Object.keys(sample));
        }
      } catch (error) {
        // Collection doesn't exist, continue
      }
    }

    // Check for specific therapist filter
    const therapistId = '68ce20c17931a40b74af366a';
    console.log(`\n=== CLIENTS FOR THERAPIST ${therapistId} ===`);

    const therapistClients = await Client.find({
      assignedTherapist: new mongoose.Types.ObjectId(therapistId)
    });
    console.log(`Clients assigned to therapist: ${therapistClients.length}`);

    // Try different field names for therapist
    const therapistVariations = [
      { therapistId: therapistId },
      { therapistId: new mongoose.Types.ObjectId(therapistId) },
      { therapist: therapistId },
      { therapist: new mongoose.Types.ObjectId(therapistId) },
      { assignedTherapist: therapistId },
      { assigned_therapist: therapistId }
    ];

    for (const filter of therapistVariations) {
      try {
        const count = await Client.countDocuments(filter);
        if (count > 0) {
          console.log(`Found ${count} clients with filter:`, filter);
        }
      } catch (error) {
        // Continue to next filter
      }
    }

    // Check the exact query that API might be using
    console.log('\n=== SIMULATING API QUERY ===');
    const apiLikeQuery = await Client.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .skip(0);

    console.log(`API-like query returned: ${apiLikeQuery.length} clients`);

    // Check database name
    console.log(`\nConnected to database: ${mongoose.connection.name}`);
    console.log(`Connection string: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

main();