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

const main = async () => {
  try {
    await connectDB();

    const therapistId = '68ce20c17931a40b74af366a';

    // Sample client IDs (using some of the existing clients)
    const clientIds = [
      '68cfb8758a45b2d36a31e73b', // María García López
      '68cfb8758a45b2d36a31e73e', // Carlos Rodríguez Pérez
      '68cfb8758a45b2d36a31e741', // Ana Martínez Sánchez
      '68cfb8758a45b2d36a31e744', // Pedro González Ruiz
      '68cfb8758a45b2d36a31e747', // Laura Fernández Jiménez
    ];

    console.log('\n=== CREATING SIMPLE REVIEWS ===');

    // Simple review data
    const reviews = [
      {
        clientId: new mongoose.Types.ObjectId(clientIds[0]),
        therapistId: new mongoose.Types.ObjectId(therapistId),
        rating: 5,
        title: "Excelente profesional, muy recomendado",
        comment: "Mi experiencia con este terapeuta ha sido extraordinaria. Desde la primera sesión me sentí cómodo y escuchado. Su enfoque profesional y empático me ha ayudado tremendamente a superar mis dificultades.",
        tags: ["profesional", "empático", "efectivo"],
        sentiment: "positive",
        isPublic: true,
        isVerified: true,
        moderationStatus: "approved",
        helpfulCount: 12,
        response: "Muchas gracias por sus palabras. Es un placer acompañarlo en este proceso de crecimiento personal.",
        responseDate: new Date(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        clientId: new mongoose.Types.ObjectId(clientIds[1]),
        therapistId: new mongoose.Types.ObjectId(therapistId),
        rating: 4,
        title: "Muy buena atención y seguimiento",
        comment: "He tenido varias sesiones y puedo decir que la calidad de atención es muy buena. El terapeuta es puntual, preparado y muestra genuino interés en ayudar.",
        tags: ["puntual", "preparado", "atento"],
        sentiment: "positive",
        isPublic: true,
        isVerified: true,
        moderationStatus: "approved",
        helpfulCount: 8,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        clientId: new mongoose.Types.ObjectId(clientIds[2]),
        therapistId: new mongoose.Types.ObjectId(therapistId),
        rating: 5,
        title: "Transformó mi manera de ver las cosas",
        comment: "Después de meses de terapia puedo decir con certeza que mi vida ha cambiado para mejor. Este profesional no solo me escuchó sin juzgar, sino que me dio herramientas prácticas.",
        tags: ["transformador", "herramientas", "cambio"],
        sentiment: "positive",
        isPublic: true,
        isVerified: true,
        moderationStatus: "approved",
        helpfulCount: 15,
        response: "Le agradezco mucho su confianza y sus comentarios. Su compromiso con el proceso terapéutico ha sido ejemplar.",
        responseDate: new Date(),
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        clientId: new mongoose.Types.ObjectId(clientIds[3]),
        therapistId: new mongoose.Types.ObjectId(therapistId),
        rating: 4,
        title: "Profesional competente y cercano",
        comment: "La experiencia ha sido positiva en general. El terapeuta demuestra conocimiento sólido en su área y tiene una forma muy humana de abordar los temas.",
        tags: ["competente", "cercano", "humano"],
        sentiment: "positive",
        isPublic: true,
        isVerified: true,
        moderationStatus: "approved",
        helpfulCount: 6,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        clientId: new mongoose.Types.ObjectId(clientIds[4]),
        therapistId: new mongoose.Types.ObjectId(therapistId),
        rating: 5,
        title: "Excelente manejo de la terapia cognitiva",
        comment: "Como alguien que había probado terapia antes sin mucho éxito, puedo decir que aquí encontré lo que buscaba. El enfoque en terapia cognitivo-conductual es exactamente lo que necesitaba.",
        tags: ["cognitivo-conductual", "éxito", "efectivo"],
        sentiment: "positive",
        isPublic: true,
        isVerified: true,
        moderationStatus: "approved",
        helpfulCount: 10,
        response: "Muchas gracias por tomarse el tiempo de escribir esta reseña. Su disposición para el trabajo terapéutico ha sido inspiradora.",
        responseDate: new Date(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    // Insert reviews directly into the collection
    const reviewsCollection = mongoose.connection.db.collection('reviews');

    for (let i = 0; i < reviews.length; i++) {
      try {
        const result = await reviewsCollection.insertOne(reviews[i]);
        console.log(`✓ Created review ${i + 1}: ${reviews[i].rating}★ - "${reviews[i].title}"`);
        console.log(`  Document ID: ${result.insertedId}`);
      } catch (error) {
        console.error(`✗ Failed to create review ${i + 1}:`, error.message);
      }
    }

    // Verify creation
    const count = await reviewsCollection.countDocuments({ therapistId: new mongoose.Types.ObjectId(therapistId) });
    console.log(`\n🎉 Total reviews for therapist: ${count}`);

    // Show some stats
    const pipeline = [
      { $match: { therapistId: new mongoose.Types.ObjectId(therapistId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          totalHelpful: { $sum: '$helpfulCount' }
        }
      }
    ];

    const stats = await reviewsCollection.aggregate(pipeline).toArray();
    if (stats.length > 0) {
      console.log(`Average rating: ${stats[0].avgRating.toFixed(1)}★`);
      console.log(`Total helpful votes: ${stats[0].totalHelpful}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

main();