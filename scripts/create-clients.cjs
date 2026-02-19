const mongoose = require('mongoose');

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

// Client schema (matching the application's client model)
const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{9,15}$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    required: [true, 'Gender is required']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, default: 'España', trim: true }
  },
  emergencyContact: {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  medicalHistory: {
    conditions: [{ type: String, trim: true }],
    medications: [{ type: String, trim: true }],
    allergies: [{ type: String, trim: true }],
    previousTherapy: { type: Boolean, default: false },
    notes: { type: String, trim: true }
  },
  preferences: {
    preferredLanguage: { type: String, default: 'es', trim: true },
    communicationMethod: {
      type: String,
      enum: ['email', 'phone', 'sms', 'whatsapp'],
      default: 'email'
    },
    sessionFormat: {
      type: String,
      enum: ['presencial', 'online', 'ambos'],
      default: 'presencial'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastSessionDate: {
    type: Date,
    default: null
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Sample clients data with Spanish names and data
const sampleClients = [
  {
    name: 'María García López',
    email: 'maria.garcia@email.com',
    phone: '+34 666 123 456',
    dateOfBirth: new Date('1985-03-15'),
    gender: 'female',
    address: {
      street: 'Calle Mayor 123',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28001',
      country: 'España'
    },
    emergencyContact: {
      name: 'Carlos García',
      relationship: 'Esposo',
      phone: '+34 666 123 457'
    },
    medicalHistory: {
      conditions: ['Ansiedad'],
      medications: [],
      allergies: [],
      previousTherapy: true,
      notes: 'Primera experiencia en terapia psicológica hace 2 años'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'email',
      sessionFormat: 'presencial'
    },
    status: 'active',
    totalSessions: 5,
    notes: 'Cliente muy comprometida con el proceso terapéutico'
  },
  {
    name: 'Carlos Rodríguez Pérez',
    email: 'carlos.rodriguez@email.com',
    phone: '+34 666 789 012',
    dateOfBirth: new Date('1978-11-22'),
    gender: 'male',
    address: {
      street: 'Avenida de la Paz 45',
      city: 'Barcelona',
      state: 'Cataluña',
      zipCode: '08001',
      country: 'España'
    },
    emergencyContact: {
      name: 'Ana Pérez',
      relationship: 'Esposa',
      phone: '+34 666 789 013'
    },
    medicalHistory: {
      conditions: ['Depresión leve'],
      medications: ['Sertralina'],
      allergies: [],
      previousTherapy: false,
      notes: 'Primer contacto con terapia psicológica'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'phone',
      sessionFormat: 'online'
    },
    status: 'active',
    totalSessions: 3,
    notes: 'Trabaja mejor con sesiones online por horarios laborales'
  },
  {
    name: 'Ana Martínez Sánchez',
    email: 'ana.martinez@email.com',
    phone: '+34 666 345 678',
    dateOfBirth: new Date('1990-07-08'),
    gender: 'female',
    address: {
      street: 'Plaza España 12',
      city: 'Valencia',
      state: 'Valencia',
      zipCode: '46001',
      country: 'España'
    },
    emergencyContact: {
      name: 'Pedro Martínez',
      relationship: 'Padre',
      phone: '+34 666 345 679'
    },
    medicalHistory: {
      conditions: ['Trastorno de pánico'],
      medications: [],
      allergies: ['Polen'],
      previousTherapy: true,
      notes: 'Terapia cognitivo-conductual previa con buenos resultados'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'whatsapp',
      sessionFormat: 'ambos'
    },
    status: 'active',
    totalSessions: 8,
    notes: 'Excelente evolución en manejo de crisis de pánico'
  },
  {
    name: 'Pedro González Ruiz',
    email: 'pedro.gonzalez@email.com',
    phone: '+34 666 901 234',
    dateOfBirth: new Date('1982-12-03'),
    gender: 'male',
    address: {
      street: 'Calle Libertad 78',
      city: 'Sevilla',
      state: 'Andalucía',
      zipCode: '41001',
      country: 'España'
    },
    emergencyContact: {
      name: 'María González',
      relationship: 'Hermana',
      phone: '+34 666 901 235'
    },
    medicalHistory: {
      conditions: ['Estrés laboral'],
      medications: [],
      allergies: [],
      previousTherapy: false,
      notes: 'Derivado por médico de cabecera por burnout laboral'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'email',
      sessionFormat: 'presencial'
    },
    status: 'active',
    totalSessions: 2,
    notes: 'Inicio reciente de terapia, muy motivado'
  },
  {
    name: 'Laura Fernández Jiménez',
    email: 'laura.fernandez@email.com',
    phone: '+34 666 567 890',
    dateOfBirth: new Date('1995-09-18'),
    gender: 'female',
    address: {
      street: 'Paseo de Gracia 234',
      city: 'Bilbao',
      state: 'País Vasco',
      zipCode: '48001',
      country: 'España'
    },
    emergencyContact: {
      name: 'José Fernández',
      relationship: 'Padre',
      phone: '+34 666 567 891'
    },
    medicalHistory: {
      conditions: ['Trastorno alimentario en remisión'],
      medications: [],
      allergies: ['Lactosa'],
      previousTherapy: true,
      notes: 'Tratamiento previo por TCA, actualmente en mantenimiento'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'sms',
      sessionFormat: 'presencial'
    },
    status: 'active',
    totalSessions: 12,
    notes: 'Cliente con gran progreso, sesiones de mantenimiento'
  },
  {
    name: 'Roberto Silva Moreno',
    email: 'roberto.silva@email.com',
    phone: '+34 666 432 109',
    dateOfBirth: new Date('1970-04-25'),
    gender: 'male',
    address: {
      street: 'Calle Sol 56',
      city: 'Málaga',
      state: 'Andalucía',
      zipCode: '29001',
      country: 'España'
    },
    emergencyContact: {
      name: 'Carmen Silva',
      relationship: 'Esposa',
      phone: '+34 666 432 110'
    },
    medicalHistory: {
      conditions: ['Duelo'],
      medications: [],
      allergies: [],
      previousTherapy: false,
      notes: 'Proceso de duelo por pérdida familiar'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'phone',
      sessionFormat: 'presencial'
    },
    status: 'active',
    totalSessions: 6,
    notes: 'Evolución positiva en proceso de duelo'
  },
  {
    name: 'Elena Torres Vega',
    email: 'elena.torres@email.com',
    phone: '+34 666 876 543',
    dateOfBirth: new Date('1988-01-12'),
    gender: 'female',
    address: {
      street: 'Avenida Constitución 89',
      city: 'Zaragoza',
      state: 'Aragón',
      zipCode: '50001',
      country: 'España'
    },
    emergencyContact: {
      name: 'Miguel Torres',
      relationship: 'Hermano',
      phone: '+34 666 876 544'
    },
    medicalHistory: {
      conditions: ['Fobia social'],
      medications: ['Escitalopram'],
      allergies: [],
      previousTherapy: true,
      notes: 'Terapia de exposición previa con resultados parciales'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'email',
      sessionFormat: 'online'
    },
    status: 'active',
    totalSessions: 4,
    notes: 'Prefiere sesiones online por comodidad social'
  },
  {
    name: 'Daniel Herrera Castro',
    email: 'daniel.herrera@email.com',
    phone: '+34 666 210 987',
    dateOfBirth: new Date('1992-05-30'),
    gender: 'male',
    address: {
      street: 'Calle Nueva 15',
      city: 'Murcia',
      state: 'Murcia',
      zipCode: '30001',
      country: 'España'
    },
    emergencyContact: {
      name: 'Isabel Castro',
      relationship: 'Madre',
      phone: '+34 666 210 988'
    },
    medicalHistory: {
      conditions: ['TDAH'],
      medications: ['Metilfenidato'],
      allergies: [],
      previousTherapy: true,
      notes: 'Diagnóstico de TDAH en la infancia, terapia conductual'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'whatsapp',
      sessionFormat: 'ambos'
    },
    status: 'active',
    totalSessions: 7,
    notes: 'Trabajando en estrategias de organización y concentración'
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
        console.log(`✓ Client ${clientData.name} already exists (ID: ${existingClient._id})`);
        createdClients.push(existingClient);
      } else {
        const client = new Client(clientData);
        const savedClient = await client.save();
        console.log(`✓ Created client: ${savedClient.name} (ID: ${savedClient._id})`);
        createdClients.push(savedClient);
      }
    } catch (error) {
      console.error(`✗ Error creating client ${clientData.name}:`, error.message);
    }
  }

  return createdClients;
};

// Main function
const main = async () => {
  try {
    await connectDB();

    console.log('\n=== CREATING CLIENTS ===');
    const clients = await createClients();

    console.log('\n=== CLIENTS SUMMARY ===');
    console.log(`Total clients processed: ${sampleClients.length}`);
    console.log(`Successfully created/found: ${clients.length}`);

    console.log('\n=== CLIENT LIST ===');
    clients.forEach(client => {
      console.log(`${client._id} | ${client.name} | ${client.email} | ${client.phone} | ${client.status}`);
    });

    console.log('\n=== STATISTICS ===');
    const stats = {
      active: clients.filter(c => c.status === 'active').length,
      totalSessions: clients.reduce((sum, c) => sum + c.totalSessions, 0),
      avgSessionsPerClient: (clients.reduce((sum, c) => sum + c.totalSessions, 0) / clients.length).toFixed(1),
      byGender: clients.reduce((acc, c) => {
        acc[c.gender] = (acc[c.gender] || 0) + 1;
        return acc;
      }, {}),
      byCommunicationMethod: clients.reduce((acc, c) => {
        acc[c.preferences.communicationMethod] = (acc[c.preferences.communicationMethod] || 0) + 1;
        return acc;
      }, {}),
      bySessionFormat: clients.reduce((acc, c) => {
        acc[c.preferences.sessionFormat] = (acc[c.preferences.sessionFormat] || 0) + 1;
        return acc;
      }, {})
    };

    console.log(`Active clients: ${stats.active}`);
    console.log(`Total sessions across all clients: ${stats.totalSessions}`);
    console.log(`Average sessions per client: ${stats.avgSessionsPerClient}`);
    console.log('Gender distribution:', stats.byGender);
    console.log('Communication preferences:', stats.byCommunicationMethod);
    console.log('Session format preferences:', stats.bySessionFormat);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

main();