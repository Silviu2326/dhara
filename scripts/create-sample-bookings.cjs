const mongoose = require('mongoose');

// Define schemas directly in the script to avoid import issues
const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^(\+34|0034|34)?[6-9]\d{8}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Please enter a valid Spanish phone number'
    }
  },
  avatar: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'demo'],
    default: 'active'
  },
  age: {
    type: Number,
    min: [16, 'Minimum age is 16'],
    max: [120, 'Maximum age is 120']
  }
}, {
  timestamps: true
});

const bookingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)']
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Therapist is required']
  },
  therapyType: {
    type: String,
    required: [true, 'Therapy type is required'],
    trim: true,
    maxlength: [100, 'Therapy type cannot exceed 100 characters']
  },
  therapyDuration: {
    type: Number,
    required: [true, 'Therapy duration is required'],
    min: [15, 'Minimum duration is 15 minutes'],
    max: [240, 'Maximum duration is 240 minutes'],
    default: 60
  },
  status: {
    type: String,
    enum: ['upcoming', 'pending', 'completed', 'cancelled', 'no_show', 'client_arrived'],
    default: 'upcoming'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  currency: {
    type: String,
    default: 'EUR',
    enum: ['EUR', 'USD', 'GBP']
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid', 'refunded', 'partial'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'transfer', 'cash', 'online', 'other'],
    default: null
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  meetingLink: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Meeting link must be a valid URL'
    }
  },
  sessionDocument: {
    type: String,
    default: null
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TherapyPlan',
    default: null
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancelledBy: {
    type: String,
    enum: ['client', 'therapist', 'system'],
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  lastStatusChange: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/dharaterapeutas', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample clients data
const sampleClients = [
  {
    name: 'María García López',
    email: 'maria.garcia@email.com',
    phone: '+34612345678',
    age: 32,
    status: 'active'
  },
  {
    name: 'Carlos Rodríguez Pérez',
    email: 'carlos.rodriguez@email.com',
    phone: '+34687654321',
    age: 28,
    status: 'active'
  },
  {
    name: 'Ana Martínez Sánchez',
    email: 'ana.martinez@email.com',
    phone: '+34654987321',
    age: 35,
    status: 'active'
  },
  {
    name: 'Pedro González Ruiz',
    email: 'pedro.gonzalez@email.com',
    phone: '+34698765432',
    age: 42,
    status: 'active'
  },
  {
    name: 'Laura Fernández Jiménez',
    email: 'laura.fernandez@email.com',
    phone: '+34634567890',
    age: 29,
    status: 'active'
  }
];

// Function to create clients
const createClients = async () => {
  console.log('Creating sample clients...');

  const Client = mongoose.model('Client', clientSchema);
  const createdClients = [];

  for (const clientData of sampleClients) {
    try {
      // Check if client already exists
      const existingClient = await Client.findOne({ email: clientData.email });

      if (existingClient) {
        console.log(`Client ${clientData.name} already exists`);
        createdClients.push(existingClient);
      } else {
        const client = new Client(clientData);
        const savedClient = await client.save();
        console.log(`Created client: ${savedClient.name} (ID: ${savedClient._id})`);
        createdClients.push(savedClient);
      }
    } catch (error) {
      console.error(`Error creating client ${clientData.name}:`, error.message);
    }
  }

  return createdClients;
};

// Function to create bookings
const createBookings = async (clients) => {
  const therapistId = '68ce20c17931a40b74af366a';
  console.log(`Creating sample bookings for therapist: ${therapistId}`);

  const Booking = mongoose.model('Booking', bookingSchema);

  // Helper function to get random date in the next 30 days
  const getRandomFutureDate = (daysFromNow = 30) => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + Math.floor(Math.random() * daysFromNow));
    return futureDate;
  };

  // Helper function to get random past date within last 60 days
  const getRandomPastDate = (daysBack = 60) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * daysBack));
    return pastDate;
  };

  const therapyTypes = [
    'Terapia Individual',
    'Terapia de Pareja',
    'Terapia Familiar',
    'Terapia Cognitivo-Conductual',
    'Terapia de Ansiedad',
    'Terapia de Depresión',
    'Terapia de Trauma'
  ];

  const locations = [
    'Consulta Presencial - Sala 1',
    'Consulta Presencial - Sala 2',
    'Videollamada',
    'Domicilio del cliente',
    'Centro de bienestar'
  ];

  const timeSlots = [
    { start: '09:00', end: '10:00' },
    { start: '10:30', end: '11:30' },
    { start: '12:00', end: '13:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:30', end: '18:30' },
    { start: '19:00', end: '20:00' }
  ];

  const sampleBookings = [];

  // Create past bookings (completed sessions)
  for (let i = 0; i < 15; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    const therapyType = therapyTypes[Math.floor(Math.random() * therapyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];

    sampleBookings.push({
      date: getRandomPastDate(),
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      clientId: client._id,
      therapistId: new mongoose.Types.ObjectId(therapistId),
      therapyType,
      therapyDuration: 60,
      status: 'completed',
      amount: Math.floor(Math.random() * 50) + 40, // 40-90 EUR
      currency: 'EUR',
      paymentStatus: Math.random() > 0.2 ? 'paid' : 'unpaid', // 80% paid
      paymentMethod: ['card', 'transfer', 'cash'][Math.floor(Math.random() * 3)],
      location,
      notes: `Sesión completada con ${client.name}. ${Math.random() > 0.5 ? 'Progreso notable en los objetivos terapéuticos.' : 'Continuar trabajando en las técnicas discutidas.'}`
    });
  }

  // Create upcoming bookings
  for (let i = 0; i < 10; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    const therapyType = therapyTypes[Math.floor(Math.random() * therapyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];

    sampleBookings.push({
      date: getRandomFutureDate(),
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      clientId: client._id,
      therapistId: new mongoose.Types.ObjectId(therapistId),
      therapyType,
      therapyDuration: 60,
      status: 'upcoming',
      amount: Math.floor(Math.random() * 50) + 40, // 40-90 EUR
      currency: 'EUR',
      paymentStatus: Math.random() > 0.3 ? 'paid' : 'unpaid', // 70% paid
      paymentMethod: Math.random() > 0.3 ? ['card', 'transfer'][Math.floor(Math.random() * 2)] : null,
      location,
      notes: `Próxima sesión con ${client.name}. ${Math.random() > 0.5 ? 'Continuar con plan terapéutico actual.' : 'Revisar tareas asignadas en sesión anterior.'}`,
      meetingLink: location === 'Videollamada' ? 'https://meet.google.com/abc-defg-hij' : null
    });
  }

  // Create some cancelled bookings
  for (let i = 0; i < 3; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    const therapyType = therapyTypes[Math.floor(Math.random() * therapyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];

    sampleBookings.push({
      date: getRandomPastDate(30),
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      clientId: client._id,
      therapistId: new mongoose.Types.ObjectId(therapistId),
      therapyType,
      therapyDuration: 60,
      status: 'cancelled',
      amount: Math.floor(Math.random() * 50) + 40,
      currency: 'EUR',
      paymentStatus: 'refunded',
      paymentMethod: 'card',
      location,
      notes: `Sesión cancelada con ${client.name}.`,
      cancellationReason: ['Enfermedad del cliente', 'Urgencia familiar', 'Cambio de horario solicitado'][Math.floor(Math.random() * 3)],
      cancelledBy: Math.random() > 0.5 ? 'client' : 'therapist',
      cancelledAt: getRandomPastDate(25)
    });
  }

  console.log(`Creating ${sampleBookings.length} sample bookings...`);

  const createdBookings = [];

  for (const bookingData of sampleBookings) {
    try {
      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();
      createdBookings.push(savedBooking);
      console.log(`Created booking: ${savedBooking._id} - ${savedBooking.status} - ${savedBooking.date.toISOString().split('T')[0]} ${savedBooking.startTime}`);
    } catch (error) {
      console.error('Error creating booking:', error.message);
    }
  }

  return createdBookings;
};

// Main function
const main = async () => {
  try {
    await connectDB();

    // Create clients first
    const clients = await createClients();

    if (clients.length === 0) {
      console.error('No clients available to create bookings');
      return;
    }

    // Create bookings
    const bookings = await createBookings(clients);

    console.log('\n=== SUMMARY ===');
    console.log(`Created ${clients.length} clients`);
    console.log(`Created ${bookings.length} bookings`);

    // Group bookings by status
    const bookingStats = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\nBookings by status:');
    Object.entries(bookingStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Calculate total revenue
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.amount, 0);

    console.log(`\nTotal revenue from paid bookings: ${totalRevenue} EUR`);

  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the script
main();