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

// Check what collections exist
const main = async () => {
  try {
    await connectDB();

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    // Check bookings collection specifically
    const bookingsCollection = mongoose.connection.db.collection('bookings');
    const bookingCount = await bookingsCollection.countDocuments();
    console.log(`\nTotal documents in bookings collection: ${bookingCount}`);

    // Get a few sample bookings
    if (bookingCount > 0) {
      const sampleBookings = await bookingsCollection.find({}).limit(3).toArray();
      console.log('\nSample bookings:');
      sampleBookings.forEach(booking => {
        console.log(`  ID: ${booking._id}`);
        console.log(`  TherapistID: ${booking.therapistId}`);
        console.log(`  Date: ${booking.date}`);
        console.log(`  Status: ${booking.status}`);
        console.log('  ---');
      });
    }

    // Check specific therapist
    const therapistId = '68ce20c17931a40b74af366a';
    console.log(`\nChecking for therapist: ${therapistId}`);

    // Try different ways to query
    const query1 = await bookingsCollection.find({ therapistId }).toArray();
    console.log(`Query 1 (string): ${query1.length} results`);

    const query2 = await bookingsCollection.find({ therapistId: new mongoose.Types.ObjectId(therapistId) }).toArray();
    console.log(`Query 2 (ObjectId): ${query2.length} results`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

main();