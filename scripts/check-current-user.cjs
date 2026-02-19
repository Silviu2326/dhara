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
const userSchema = new mongoose.Schema({}, { strict: false });
const clientSchema = new mongoose.Schema({}, { strict: false });

const main = async () => {
  try {
    await connectDB();

    const User = mongoose.model('User', userSchema);
    const Client = mongoose.model('Client', clientSchema);

    console.log('\n=== USER ACCOUNTS ANALYSIS ===');

    // Get all users
    const allUsers = await User.find({});
    console.log(`Total users in database: ${allUsers.length}`);

    if (allUsers.length > 0) {
      console.log('\nAll users:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user._id}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Verified: ${user.isVerified}`);
      });
    }

    // Get therapists specifically
    const therapists = await User.find({ role: 'therapist' });
    console.log(`\nTherapists found: ${therapists.length}`);

    therapists.forEach((therapist, index) => {
      console.log(`\n${index + 1}. 👨‍⚕️ ${therapist.firstName} ${therapist.lastName}`);
      console.log(`   ID: ${therapist._id}`);
      console.log(`   Email: ${therapist.email}`);
      console.log(`   Active: ${therapist.isActive}`);
      console.log(`   Verified: ${therapist.isVerified}`);
    });

    // Check clients for each therapist
    console.log('\n=== CLIENT DISTRIBUTION BY THERAPIST ===');

    for (const therapist of therapists) {
      const clientCount = await Client.countDocuments({
        assignedTherapist: therapist._id
      });

      console.log(`\n👨‍⚕️ ${therapist.firstName} ${therapist.lastName} (${therapist._id})`);
      console.log(`   📊 Clients assigned: ${clientCount}`);

      if (clientCount > 0) {
        const clients = await Client.find({
          assignedTherapist: therapist._id
        }).limit(3);

        console.log('   Sample clients:');
        clients.forEach(client => {
          console.log(`     - ${client.name} (${client.email})`);
        });
      }
    }

    // Special check for the problematic therapist ID
    const targetTherapistId = '68ce20c17931a40b74af366a';
    console.log(`\n=== SPECIAL CHECK FOR THERAPIST ${targetTherapistId} ===`);

    const targetUser = await User.findById(targetTherapistId);
    if (targetUser) {
      console.log(`✓ User exists: ${targetUser.firstName} ${targetUser.lastName}`);
      console.log(`  Email: ${targetUser.email}`);
      console.log(`  Role: ${targetUser.role}`);
      console.log(`  Active: ${targetUser.isActive}`);
      console.log(`  Verified: ${targetUser.isVerified}`);
    } else {
      console.log(`✗ No user found with ID ${targetTherapistId}`);
      console.log('This explains why the API returns empty data!');
    }

    const clientsForTarget = await Client.countDocuments({
      assignedTherapist: new mongoose.Types.ObjectId(targetTherapistId)
    });
    console.log(`Clients assigned to this ID: ${clientsForTarget}`);

    // Recommendation
    console.log('\n=== RECOMMENDATION ===');
    if (!targetUser) {
      if (therapists.length > 0) {
        const firstTherapist = therapists[0];
        console.log(`🎯 Use existing therapist: ${firstTherapist._id}`);
        console.log(`   Name: ${firstTherapist.firstName} ${firstTherapist.lastName}`);
        console.log(`   Email: ${firstTherapist.email}`);
        console.log('\nTo fix the issue:');
        console.log('1. Either create clients for this existing therapist ID, OR');
        console.log('2. Create a user account with the ID 68ce20c17931a40b74af366a, OR');
        console.log('3. Login with the correct therapist account that matches your session');
      } else {
        console.log('❌ No therapists found in database. You need to create a therapist account first.');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

main();