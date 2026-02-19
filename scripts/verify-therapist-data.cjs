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
const clientSchema = new mongoose.Schema({}, { strict: false });
const bookingSchema = new mongoose.Schema({}, { strict: false });

const main = async () => {
  try {
    await connectDB();

    const therapistId = '68ce20c17931a40b74af366a';
    const Client = mongoose.model('Client', clientSchema);
    const Booking = mongoose.model('Booking', bookingSchema);

    console.log(`\n=== THERAPIST DATA VERIFICATION ===`);
    console.log(`Therapist ID: ${therapistId}`);

    // Get clients assigned to this therapist
    const clients = await Client.find({
      assignedTherapist: new mongoose.Types.ObjectId(therapistId)
    });

    console.log(`\nClients assigned to therapist: ${clients.length}`);

    // Get bookings for this therapist
    const bookings = await Booking.find({
      therapistId: new mongoose.Types.ObjectId(therapistId)
    });

    console.log(`Bookings for therapist: ${bookings.length}`);

    console.log('\n=== CLIENT DETAILS ===');
    clients.forEach((client, index) => {
      console.log(`\n${index + 1}. 👤 ${client.name}`);
      console.log(`   📧 ${client.email}`);
      console.log(`   📞 ${client.phone}`);
      console.log(`   🎂 Age: ${new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear()} años`);
      console.log(`   ⚕️  Conditions: ${client.medicalHistory?.conditions?.join(', ') || 'None'}`);
      console.log(`   💊 Medications: ${client.medicalHistory?.medications?.join(', ') || 'None'}`);
      console.log(`   📱 Communication: ${client.preferences?.communicationMethod || 'Email'}`);
      console.log(`   🏥 Format: ${client.preferences?.sessionFormat || 'Presencial'}`);
      console.log(`   📊 Total Sessions: ${client.totalSessions || 0}`);
      console.log(`   📝 Status: ${client.status}`);
      if (client.notes) {
        console.log(`   📋 Notes: ${client.notes}`);
      }
    });

    console.log('\n=== BOOKING DETAILS ===');
    bookings.forEach((booking, index) => {
      const date = booking.date.toISOString().split('T')[0];
      console.log(`\n${index + 1}. 📅 ${date} ${booking.startTime}`);
      console.log(`   👤 Client: ${booking.clientName || 'Not specified'}`);
      console.log(`   🏥 Therapy: ${booking.therapyType}`);
      console.log(`   ⏱️  Duration: ${booking.therapyDuration} min`);
      console.log(`   📊 Status: ${booking.status}`);
      console.log(`   💰 Amount: ${booking.amount}€`);
      console.log(`   💳 Payment: ${booking.paymentStatus}`);
      if (booking.location) {
        console.log(`   📍 Location: ${booking.location}`);
      }
      if (booking.notes) {
        console.log(`   📝 Notes: ${booking.notes}`);
      }
    });

    console.log('\n=== THERAPIST SUMMARY STATISTICS ===');

    // Client statistics
    const clientStats = {
      total: clients.length,
      byGender: clients.reduce((acc, c) => {
        acc[c.gender] = (acc[c.gender] || 0) + 1;
        return acc;
      }, {}),
      byStatus: clients.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {}),
      totalClientSessions: clients.reduce((sum, c) => sum + (c.totalSessions || 0), 0),
      avgSessionsPerClient: clients.length > 0 ?
        (clients.reduce((sum, c) => sum + (c.totalSessions || 0), 0) / clients.length).toFixed(1) : 0
    };

    // Booking statistics
    const bookingStats = {
      total: bookings.length,
      byStatus: bookings.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {}),
      byPaymentStatus: bookings.reduce((acc, b) => {
        acc[b.paymentStatus] = (acc[b.paymentStatus] || 0) + 1;
        return acc;
      }, {}),
      totalRevenue: bookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + (b.amount || 0), 0),
      byTherapyType: bookings.reduce((acc, b) => {
        acc[b.therapyType] = (acc[b.therapyType] || 0) + 1;
        return acc;
      }, {})
    };

    console.log('\n📊 CLIENT STATISTICS:');
    console.log(`   Total clients: ${clientStats.total}`);
    console.log(`   Gender distribution:`, clientStats.byGender);
    console.log(`   Status distribution:`, clientStats.byStatus);
    console.log(`   Total sessions (client records): ${clientStats.totalClientSessions}`);
    console.log(`   Average sessions per client: ${clientStats.avgSessionsPerClient}`);

    console.log('\n📈 BOOKING STATISTICS:');
    console.log(`   Total bookings: ${bookingStats.total}`);
    console.log(`   Status distribution:`, bookingStats.byStatus);
    console.log(`   Payment status:`, bookingStats.byPaymentStatus);
    console.log(`   Total revenue: ${bookingStats.totalRevenue}€`);
    console.log(`   Therapy types:`, bookingStats.byTherapyType);

    // Recent activity
    const recentBookings = bookings
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    console.log('\n📅 RECENT BOOKINGS:');
    recentBookings.forEach(booking => {
      const date = booking.date.toISOString().split('T')[0];
      console.log(`   ${date} ${booking.startTime} | ${booking.therapyType} | ${booking.status} | ${booking.amount}€`);
    });

    // Upcoming appointments
    const today = new Date();
    const upcomingBookings = bookings
      .filter(b => new Date(b.date) >= today && b.status === 'upcoming')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    console.log('\n📅 UPCOMING APPOINTMENTS:');
    if (upcomingBookings.length > 0) {
      upcomingBookings.forEach(booking => {
        const date = booking.date.toISOString().split('T')[0];
        console.log(`   ${date} ${booking.startTime} | ${booking.therapyType} | ${booking.clientName || 'Client'}`);
      });
    } else {
      console.log('   No upcoming appointments found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

main();