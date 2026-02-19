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

    // Get all clients
    const clients = await Client.find({});

    console.log(`\n=== CLIENTS VERIFICATION ===`);
    console.log(`Found ${clients.length} clients in database`);

    // Group by status
    const statusStats = clients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\nClients by status:');
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Group by gender
    const genderStats = clients.reduce((acc, client) => {
      const gender = client.gender || 'not_specified';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    console.log('\nClients by gender:');
    Object.entries(genderStats).forEach(([gender, count]) => {
      console.log(`  ${gender}: ${count}`);
    });

    // Communication preferences
    const commStats = clients.reduce((acc, client) => {
      const method = client.preferences?.communicationMethod || 'not_specified';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    console.log('\nCommunication preferences:');
    Object.entries(commStats).forEach(([method, count]) => {
      console.log(`  ${method}: ${count}`);
    });

    // Session format preferences
    const formatStats = clients.reduce((acc, client) => {
      const format = client.preferences?.sessionFormat || 'not_specified';
      acc[format] = (acc[format] || 0) + 1;
      return acc;
    }, {});

    console.log('\nSession format preferences:');
    Object.entries(formatStats).forEach(([format, count]) => {
      console.log(`  ${format}: ${count}`);
    });

    // Total sessions
    const totalSessions = clients.reduce((sum, client) => sum + (client.totalSessions || 0), 0);
    const avgSessions = (totalSessions / clients.length).toFixed(1);

    console.log(`\nSession statistics:`);
    console.log(`  Total sessions: ${totalSessions}`);
    console.log(`  Average per client: ${avgSessions}`);

    // Sample detailed client information
    console.log('\n=== DETAILED CLIENT INFORMATION ===');
    clients.forEach(client => {
      console.log(`\n📋 ${client.name} (${client._id})`);
      console.log(`   📧 Email: ${client.email}`);
      console.log(`   📞 Phone: ${client.phone}`);
      console.log(`   🎂 Age: ${new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear()} años`);
      console.log(`   🏠 City: ${client.address?.city || 'No specified'}`);
      console.log(`   ⚕️  Conditions: ${client.medicalHistory?.conditions?.join(', ') || 'None'}`);
      console.log(`   💊 Medications: ${client.medicalHistory?.medications?.join(', ') || 'None'}`);
      console.log(`   📱 Prefers: ${client.preferences?.communicationMethod || 'Email'}`);
      console.log(`   🏥 Format: ${client.preferences?.sessionFormat || 'Presencial'}`);
      console.log(`   📊 Sessions: ${client.totalSessions || 0}`);
      console.log(`   📝 Status: ${client.status || 'active'}`);
      if (client.notes) {
        console.log(`   📋 Notes: ${client.notes}`);
      }
    });

    // Cities distribution
    const cities = clients.reduce((acc, client) => {
      const city = client.address?.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    console.log('\n=== GEOGRAPHIC DISTRIBUTION ===');
    Object.entries(cities).forEach(([city, count]) => {
      console.log(`  ${city}: ${count} cliente${count !== 1 ? 's' : ''}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

main();