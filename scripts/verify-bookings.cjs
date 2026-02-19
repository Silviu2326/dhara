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

// Define basic schemas for verification
const bookingSchema = new mongoose.Schema({}, { strict: false });
const clientSchema = new mongoose.Schema({}, { strict: false });

const main = async () => {
  try {
    await connectDB();

    const Booking = mongoose.model('Booking', bookingSchema);
    const Client = mongoose.model('Client', clientSchema);

    const therapistId = '68ce20c17931a40b74af366a';

    // Get all bookings for the therapist (using ObjectId)
    const bookings = await Booking.find({ therapistId: new mongoose.Types.ObjectId(therapistId) });

    console.log(`\n=== BOOKINGS VERIFICATION ===`);
    console.log(`Found ${bookings.length} bookings for therapist ${therapistId}`);

    // Group by status
    const statusStats = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\nBookings by status:');
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Payment stats
    const paymentStats = bookings.reduce((acc, booking) => {
      acc[booking.paymentStatus] = (acc[booking.paymentStatus] || 0) + 1;
      return acc;
    }, {});

    console.log('\nBookings by payment status:');
    Object.entries(paymentStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Revenue calculation
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.amount, 0);

    console.log(`\nTotal revenue: ${totalRevenue} EUR`);

    // Recent bookings sample
    console.log('\n=== SAMPLE BOOKINGS ===');
    const recentBookings = bookings
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    recentBookings.forEach(booking => {
      const dateStr = booking.date.toISOString().split('T')[0];
      console.log(`${booking._id} | ${dateStr} ${booking.startTime} | ${booking.therapyType} | ${booking.status} | ${booking.amount}€`);
    });

    // Get unique clients
    const clients = await Client.find({});
    console.log(`\n=== CLIENTS ===`);
    console.log(`Total clients created: ${clients.length}`);

    clients.forEach(client => {
      console.log(`${client._id} | ${client.name} | ${client.email} | ${client.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

main();