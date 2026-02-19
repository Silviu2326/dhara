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

// Client schema with therapist assignment
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
  // Therapist assignment
  assignedTherapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned therapist is required']
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

// Sample clients for the specific therapist
const therapistId = '68ce20c17931a40b74af366a';

const therapistClients = [
  {
    name: 'Carmen Ruiz Delgado',
    email: 'carmen.ruiz@cliente.com',
    phone: '+34 612 345 001',
    dateOfBirth: new Date('1986-02-14'),
    gender: 'female',
    assignedTherapist: new mongoose.Types.ObjectId(therapistId),
    address: {
      street: 'Calle Rosalía de Castro 45',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28015',
      country: 'España'
    },
    emergencyContact: {
      name: 'Miguel Ruiz',
      relationship: 'Hermano',
      phone: '+34 612 345 002'
    },
    medicalHistory: {
      conditions: ['Ansiedad generalizada', 'Insomnio'],
      medications: ['Lorazepam'],
      allergies: [],
      previousTherapy: false,
      notes: 'Primera vez en terapia, derivada por médico de cabecera'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'email',
      sessionFormat: 'presencial'
    },
    status: 'active',
    totalSessions: 3,
    notes: 'Muy colaborativa, buena adherencia al tratamiento'
  },
  {
    name: 'Francisco Morales Jiménez',
    email: 'francisco.morales@cliente.com',
    phone: '+34 634 567 123',
    dateOfBirth: new Date('1975-08-20'),
    gender: 'male',
    assignedTherapist: new mongoose.Types.ObjectId(therapistId),
    address: {
      street: 'Avenida de América 128',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28028',
      country: 'España'
    },
    emergencyContact: {
      name: 'Elena Jiménez',
      relationship: 'Esposa',
      phone: '+34 634 567 124'
    },
    medicalHistory: {
      conditions: ['Depresión mayor', 'Burnout laboral'],
      medications: ['Venlafaxina'],
      allergies: ['Penicilina'],
      previousTherapy: true,
      notes: 'Terapia previa hace 5 años con buen resultado'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'phone',
      sessionFormat: 'online'
    },
    status: 'active',
    totalSessions: 8,
    notes: 'Progreso lento pero constante, necesita flexibilidad horaria'
  },
  {
    name: 'Isabel Vázquez Romero',
    email: 'isabel.vazquez@cliente.com',
    phone: '+34 698 123 456',
    dateOfBirth: new Date('1991-11-05'),
    gender: 'female',
    assignedTherapist: new mongoose.Types.ObjectId(therapistId),
    address: {
      street: 'Calle Alcalá 200',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28028',
      country: 'España'
    },
    emergencyContact: {
      name: 'Carmen Romero',
      relationship: 'Madre',
      phone: '+34 698 123 457'
    },
    medicalHistory: {
      conditions: ['Trastorno bipolar tipo II'],
      medications: ['Litio', 'Lamotrigina'],
      allergies: [],
      previousTherapy: true,
      notes: 'Estabilizada farmacológicamente, en terapia de mantenimiento'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'whatsapp',
      sessionFormat: 'presencial'
    },
    status: 'active',
    totalSessions: 15,
    notes: 'Cliente de larga duración, excelente evolución'
  },
  {
    name: 'Antonio López Fernández',
    email: 'antonio.lopez@cliente.com',
    phone: '+34 677 890 234',
    dateOfBirth: new Date('1983-04-12'),
    gender: 'male',
    assignedTherapist: new mongoose.Types.ObjectId(therapistId),
    address: {
      street: 'Plaza de Cibeles 8',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28014',
      country: 'España'
    },
    emergencyContact: {
      name: 'María López',
      relationship: 'Hermana',
      phone: '+34 677 890 235'
    },
    medicalHistory: {
      conditions: ['Trastorno obsesivo-compulsivo'],
      medications: ['Fluoxetina'],
      allergies: [],
      previousTherapy: false,
      notes: 'TOC de comprobación, interferencia significativa en vida diaria'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'email',
      sessionFormat: 'presencial'
    },
    status: 'active',
    totalSessions: 12,
    notes: 'Respondiendo bien a TCC, reducción notable de compulsiones'
  },
  {
    name: 'Lucía Martín González',
    email: 'lucia.martin@cliente.com',
    phone: '+34 665 432 109',
    dateOfBirth: new Date('1994-07-28'),
    gender: 'female',
    assignedTherapist: new mongoose.Types.ObjectId(therapistId),
    address: {
      street: 'Calle Goya 75',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28001',
      country: 'España'
    },
    emergencyContact: {
      name: 'Pedro Martín',
      relationship: 'Padre',
      phone: '+34 665 432 110'
    },
    medicalHistory: {
      conditions: ['Trastorno de estrés postraumático'],
      medications: [],
      allergies: ['Ibuprofeno'],
      previousTherapy: true,
      notes: 'Trauma por accidente de tráfico, terapia EMDR previa'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'sms',
      sessionFormat: 'presencial'
    },
    status: 'active',
    totalSessions: 6,
    notes: 'Buena respuesta a terapia cognitivo-conductual trauma-enfocada'
  },
  {
    name: 'Raúl Herrero Blanco',
    email: 'raul.herrero@cliente.com',
    phone: '+34 687 654 321',
    dateOfBirth: new Date('1979-12-15'),
    gender: 'male',
    assignedTherapist: new mongoose.Types.ObjectId(therapistId),
    address: {
      street: 'Paseo de la Castellana 95',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28046',
      country: 'España'
    },
    emergencyContact: {
      name: 'Ana Blanco',
      relationship: 'Esposa',
      phone: '+34 687 654 322'
    },
    medicalHistory: {
      conditions: ['Adicción al alcohol en remisión'],
      medications: ['Naltrexona'],
      allergies: [],
      previousTherapy: true,
      notes: '18 meses de sobriedad, programa de 12 pasos completado'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'phone',
      sessionFormat: 'ambos'
    },
    status: 'active',
    totalSessions: 24,
    notes: 'Mantenimiento y prevención de recaídas, muy comprometido'
  },
  {
    name: 'Natalia Serrano Castro',
    email: 'natalia.serrano@cliente.com',
    phone: '+34 654 321 098',
    dateOfBirth: new Date('1988-09-03'),
    gender: 'female',
    assignedTherapist: new mongoose.Types.ObjectId(therapistId),
    address: {
      street: 'Calle Serrano 120',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28006',
      country: 'España'
    },
    emergencyContact: {
      name: 'Luis Serrano',
      relationship: 'Hermano',
      phone: '+34 654 321 099'
    },
    medicalHistory: {
      conditions: ['Trastorno límite de personalidad'],
      medications: ['Quetiapina'],
      allergies: [],
      previousTherapy: true,
      notes: 'DBT previa, trabajando en regulación emocional'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'whatsapp',
      sessionFormat: 'presencial'
    },
    status: 'active',
    totalSessions: 18,
    notes: 'Progreso significativo en habilidades DBT, menos episodios de crisis'
  },
  {
    name: 'Jorge Prieto Sánchez',
    email: 'jorge.prieto@cliente.com',
    phone: '+34 643 210 987',
    dateOfBirth: new Date('1992-01-22'),
    gender: 'male',
    assignedTherapist: new mongoose.Types.ObjectId(therapistId),
    address: {
      street: 'Calle Velázquez 88',
      city: 'Madrid',
      state: 'Madrid',
      zipCode: '28001',
      country: 'España'
    },
    emergencyContact: {
      name: 'Rosa Sánchez',
      relationship: 'Madre',
      phone: '+34 643 210 988'
    },
    medicalHistory: {
      conditions: ['Trastorno del espectro autista', 'Ansiedad social'],
      medications: ['Sertralina'],
      allergies: [],
      previousTherapy: true,
      notes: 'Diagnóstico tardío TEA, trabajando habilidades sociales'
    },
    preferences: {
      preferredLanguage: 'es',
      communicationMethod: 'email',
      sessionFormat: 'online'
    },
    status: 'active',
    totalSessions: 10,
    notes: 'Prefiere rutinas estructuradas, buen progreso en habilidades comunicativas'
  }
];

// Function to create clients for the therapist
const createTherapistClients = async () => {
  console.log(`Creating clients for therapist ${therapistId}...`);

  const Client = mongoose.model('Client', clientSchema);
  const createdClients = [];

  for (const clientData of therapistClients) {
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

    console.log('\n=== CREATING CLIENTS FOR THERAPIST ===');
    console.log(`Therapist ID: ${therapistId}`);

    const clients = await createTherapistClients();

    console.log('\n=== CLIENTS SUMMARY ===');
    console.log(`Total clients processed: ${therapistClients.length}`);
    console.log(`Successfully created/found: ${clients.length}`);

    console.log('\n=== CLIENT LIST ===');
    clients.forEach(client => {
      console.log(`${client._id} | ${client.name} | ${client.email} | ${client.totalSessions} sessions`);
    });

    console.log('\n=== DETAILED STATISTICS ===');
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
      }, {}),
      byConditions: clients.reduce((acc, c) => {
        c.medicalHistory.conditions.forEach(condition => {
          acc[condition] = (acc[condition] || 0) + 1;
        });
        return acc;
      }, {})
    };

    console.log(`Active clients: ${stats.active}`);
    console.log(`Total sessions across all clients: ${stats.totalSessions}`);
    console.log(`Average sessions per client: ${stats.avgSessionsPerClient}`);
    console.log('Gender distribution:', stats.byGender);
    console.log('Communication preferences:', stats.byCommunicationMethod);
    console.log('Session format preferences:', stats.bySessionFormat);
    console.log('Conditions treated:', stats.byConditions);

    // Verify therapist assignment
    console.log('\n=== THERAPIST ASSIGNMENT VERIFICATION ===');
    const assignedToTherapist = await mongoose.model('Client', clientSchema)
      .find({ assignedTherapist: new mongoose.Types.ObjectId(therapistId) });

    console.log(`Clients assigned to therapist ${therapistId}: ${assignedToTherapist.length}`);
    assignedToTherapist.forEach(client => {
      console.log(`  ✓ ${client.name} (${client._id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

main();