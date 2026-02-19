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

// Define schema
const reviewSchema = new mongoose.Schema({}, { strict: false });

const main = async () => {
  try {
    await connectDB();

    const Review = mongoose.model('Review', reviewSchema);
    const therapistId = '68ce20c17931a40b74af366a';

    console.log('\n=== REVIEWS VERIFICATION ===');

    // Get all reviews for the therapist
    const reviews = await Review.find({ therapistId }).sort({ createdAt: -1 });
    console.log(`Total reviews found: ${reviews.length}`);

    if (reviews.length > 0) {
      console.log('\nReviews summary:');
      reviews.forEach((review, index) => {
        console.log(`\n${index + 1}. ${review.rating}★ - "${review.title}"`);
        console.log(`   Client: ${review.clientId}`);
        console.log(`   Comment: ${review.comment.substring(0, 100)}...`);
        console.log(`   Public: ${review.isPublic}`);
        console.log(`   Verified: ${review.isVerified}`);
        console.log(`   Helpful count: ${review.helpfulCount}`);
        console.log(`   Has response: ${!!review.response}`);
        if (review.response) {
          console.log(`   Response: ${review.response.substring(0, 80)}...`);
        }
        console.log(`   Tags: ${review.tags?.join(', ') || 'none'}`);
        console.log(`   Sentiment: ${review.sentiment}`);
        console.log(`   Created: ${review.createdAt}`);
      });

      // Calculate statistics
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      const ratingDistribution = reviews.reduce((dist, review) => {
        dist[review.rating] = (dist[review.rating] || 0) + 1;
        return dist;
      }, {});

      console.log('\n=== STATISTICS ===');
      console.log(`Average rating: ${avgRating.toFixed(1)}★`);
      console.log(`Rating distribution:`);
      for (let i = 1; i <= 5; i++) {
        const count = ratingDistribution[i] || 0;
        console.log(`${i}★: ${count} review(s)`);
      }

      const withResponses = reviews.filter(r => r.response).length;
      console.log(`Reviews with therapist responses: ${withResponses}/${reviews.length}`);

      const verified = reviews.filter(r => r.isVerified).length;
      console.log(`Verified reviews: ${verified}/${reviews.length}`);

      const public_ = reviews.filter(r => r.isPublic).length;
      console.log(`Public reviews: ${public_}/${reviews.length}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

main();