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

// Define schemas
const reviewSchema = new mongoose.Schema({}, { strict: false });
const clientSchema = new mongoose.Schema({}, { strict: false });

const main = async () => {
  try {
    await connectDB();

    const Review = mongoose.model('Review', reviewSchema);
    const Client = mongoose.model('Client', clientSchema);

    const therapistId = '68ce20c17931a40b74af366a';

    // Get existing clients (any clients for creating reviews)
    const clients = await Client.find({}).limit(8);
    console.log(`Found ${clients.length} clients to create reviews`);

    if (clients.length === 0) {
      console.log('No clients found. Creating reviews will fail without client IDs.');
      return;
    }

    // Review templates with realistic content
    const reviewTemplates = [
      {
        rating: 5,
        title: "Excelente profesional, muy recomendado",
        comment: "Mi experiencia con este terapeuta ha sido extraordinaria. Desde la primera sesión me sentí cómodo y escuchado. Su enfoque profesional y empático me ha ayudado tremendamente a superar mis dificultades. Las técnicas que utiliza son efectivas y siempre se toma el tiempo necesario para explicar cada proceso. Definitivamente continuaré con las sesiones.",
        tags: ["profesional", "empático", "efectivo", "recomendado"],
        sentiment: "positive",
        isVerified: true,
        helpfulCount: 12,
        metadata: {
          clientPlatform: "web",
          sessionDuration: 60,
          sessionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      {
        rating: 4,
        title: "Muy buena atención y seguimiento",
        comment: "He tenido varias sesiones y puedo decir que la calidad de atención es muy buena. El terapeuta es puntual, preparado y muestra genuino interés en ayudar. Los ejercicios y técnicas que me ha enseñado han sido útiles para mi día a día. El único punto a mejorar sería el tiempo de las sesiones, a veces siento que necesitaría un poco más de tiempo.",
        tags: ["puntual", "preparado", "útil", "atento"],
        sentiment: "positive",
        isVerified: true,
        helpfulCount: 8,
        metadata: {
          clientPlatform: "mobile",
          sessionDuration: 50,
          sessionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        }
      },
      {
        rating: 5,
        title: "Transformó mi manera de ver las cosas",
        comment: "Después de meses de terapia puedo decir con certeza que mi vida ha cambiado para mejor. Este profesional no solo me escuchó sin juzgar, sino que me dio herramientas prácticas para manejar mi ansiedad y mejorar mis relaciones interpersonales. Su método es claro, estructurado y adaptado a mis necesidades específicas. Estoy muy agradecido.",
        tags: ["transformador", "herramientas", "ansiedad", "relaciones"],
        sentiment: "positive",
        isVerified: true,
        helpfulCount: 15,
        metadata: {
          clientPlatform: "web",
          sessionDuration: 55,
          sessionDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
        }
      },
      {
        rating: 4,
        title: "Profesional competente y cercano",
        comment: "La experiencia ha sido positiva en general. El terapeuta demuestra conocimiento sólido en su área y tiene una forma muy humana de abordar los temas. Me ha ayudado a entender patrones de comportamiento que no había identificado antes. Las sesiones son dinámicas y siempre salgo con algo nuevo que reflexionar. Lo recomiendo.",
        tags: ["competente", "cercano", "dinámico", "reflexivo"],
        sentiment: "positive",
        isVerified: true,
        helpfulCount: 6,
        metadata: {
          clientPlatform: "tablet",
          sessionDuration: 60,
          sessionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        }
      },
      {
        rating: 5,
        title: "Excelente manejo de la terapia cognitiva",
        comment: "Como alguien que había probado terapia antes sin mucho éxito, puedo decir que aquí encontré lo que buscaba. El enfoque en terapia cognitivo-conductual es exactamente lo que necesitaba. Las sesiones están bien estructuradas, siempre hay tareas prácticas para hacer en casa, y veo progreso constante. El terapeuta es paciente y muy profesional.",
        tags: ["cognitivo-conductual", "estructurado", "progreso", "paciente"],
        sentiment: "positive",
        isVerified: true,
        helpfulCount: 10,
        metadata: {
          clientPlatform: "web",
          sessionDuration: 65,
          sessionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      },
      {
        rating: 3,
        title: "Buena experiencia aunque mejorable",
        comment: "En líneas generales mi experiencia ha sido satisfactoria. El terapeuta es conocedor de su campo y mantiene un ambiente profesional durante las sesiones. Sin embargo, siento que a veces las técnicas utilizadas no se adaptan completamente a mi estilo de aprendizaje. Me gustaría más flexibilidad en el enfoque, pero reconozco que ha habido avances en mi proceso.",
        tags: ["satisfactoria", "profesional", "mejorable", "avances"],
        sentiment: "neutral",
        isVerified: true,
        helpfulCount: 4,
        metadata: {
          clientPlatform: "mobile",
          sessionDuration: 45,
          sessionDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
        }
      },
      {
        rating: 5,
        title: "Increíble apoyo durante un momento difícil",
        comment: "Llegué a terapia en uno de los momentos más difíciles de mi vida y encontré no solo profesionalismo sino también una calidez humana excepcional. Las herramientas de mindfulness y manejo emocional que me enseñó han sido fundamentales para mi recuperación. Cada sesión me daba esperanza y claridad. Infinitamente agradecido por su ayuda.",
        tags: ["apoyo", "mindfulness", "recuperación", "esperanza"],
        sentiment: "positive",
        isVerified: true,
        helpfulCount: 20,
        metadata: {
          clientPlatform: "web",
          sessionDuration: 70,
          sessionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      {
        rating: 4,
        title: "Muy profesional y con buenas técnicas",
        comment: "He completado varias sesiones y puedo afirmar que es un profesional serio y comprometido. Las técnicas de relajación y reestructuración cognitiva que me ha enseñado han sido muy efectivas para manejar mi estrés laboral. La comunicación es fluida y siempre me siento escuchado. Definitivamente continuaré con el tratamiento.",
        tags: ["serio", "relajación", "estrés laboral", "comunicación"],
        sentiment: "positive",
        isVerified: true,
        helpfulCount: 7,
        metadata: {
          clientPlatform: "web",
          sessionDuration: 55,
          sessionDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
        }
      }
    ];

    // Add therapist responses to some reviews
    const responses = [
      "Muchas gracias por sus palabras. Es un placer acompañarlo en este proceso de crecimiento personal. Me alegra saber que las técnicas están siendo útiles en su día a día. Seguiremos trabajando juntos hacia sus objetivos.",
      "Le agradezco mucho su confianza y sus comentarios. Cada proceso es único y me complace saber que está encontrando valor en nuestras sesiones. Continuemos construyendo sobre estos avances.",
      "Gracias por compartir su experiencia. Su compromiso con el proceso terapéutico ha sido ejemplar. Las herramientas que hemos trabajado requieren práctica, y usted está haciendo un excelente trabajo aplicándolas.",
      "Aprecio mucho su retroalimentación. Es reconfortante saber que nuestro trabajo conjunto está generando los resultados que buscamos. Su apertura al cambio ha sido fundamental para este progreso.",
      "Muchas gracias por tomarse el tiempo de escribir esta reseña. Su disposición para el trabajo terapéutico y su compromiso con el cambio han sido inspiradores. Continuemos este camino de crecimiento."
    ];

    console.log('\n=== CREATING REVIEWS ===');

    const createdReviews = [];

    for (let i = 0; i < Math.min(reviewTemplates.length, clients.length); i++) {
      const template = reviewTemplates[i];
      const client = clients[i];

      const reviewData = {
        clientId: client._id,
        therapistId: new mongoose.Types.ObjectId(therapistId),
        rating: template.rating,
        title: template.title,
        comment: template.comment,
        tags: template.tags,
        sentiment: template.sentiment,
        isPublic: true,
        isVerified: template.isVerified,
        moderationStatus: 'approved',
        helpfulCount: template.helpfulCount,
        metadata: template.metadata,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        updatedAt: new Date()
      };

      // Add response to some reviews (60% chance)
      if (Math.random() > 0.4) {
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        reviewData.response = randomResponse;
        reviewData.responseDate = new Date(reviewData.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // Response within 7 days
      }

      try {
        const review = new Review(reviewData);
        await review.save();
        createdReviews.push(review);

        console.log(`✓ Created review ${i + 1}: ${template.rating}★ - "${template.title}" by ${client.name}`);
      } catch (error) {
        console.error(`✗ Failed to create review ${i + 1}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdReviews.length} reviews for therapist ${therapistId}`);

    // Show summary statistics
    const totalReviews = await Review.countDocuments({ therapistId });
    const avgRating = await Review.aggregate([
      { $match: { therapistId: new mongoose.Types.ObjectId(therapistId) } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    console.log('\n=== SUMMARY STATISTICS ===');
    console.log(`Total reviews: ${totalReviews}`);
    console.log(`Average rating: ${avgRating.length > 0 ? avgRating[0].avg.toFixed(1) : 'N/A'}★`);

    // Show rating distribution
    const ratingDist = await Review.aggregate([
      { $match: { therapistId: new mongoose.Types.ObjectId(therapistId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\nRating distribution:');
    ratingDist.forEach(dist => {
      console.log(`${dist._id}★: ${dist.count} review(s)`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

main();