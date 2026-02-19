const mongoose = require('mongoose');

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
    const reviewsCollection = mongoose.connection.db.collection('reviews');

    console.log('\n=== FINAL REVIEWS VERIFICATION ===');

    // Get all reviews for the therapist
    const reviews = await reviewsCollection.find({
      therapistId: new mongoose.Types.ObjectId(therapistId)
    }).sort({ createdAt: -1 }).toArray();

    console.log(`Total reviews found: ${reviews.length}`);

    if (reviews.length > 0) {
      console.log('\n📋 Reviews Summary:');
      reviews.forEach((review, index) => {
        console.log(`\n${index + 1}. ${review.rating}★ - "${review.title}"`);
        console.log(`   📝 Comment: ${review.comment.substring(0, 80)}...`);
        console.log(`   👤 Client ID: ${review.clientId}`);
        console.log(`   🏷️ Tags: ${review.tags?.join(', ') || 'none'}`);
        console.log(`   ✅ Verified: ${review.isVerified}`);
        console.log(`   👍 Helpful votes: ${review.helpfulCount}`);
        console.log(`   💬 Has response: ${!!review.response}`);
        if (review.response) {
          console.log(`   📞 Response: ${review.response.substring(0, 60)}...`);
        }
        console.log(`   📅 Created: ${new Date(review.createdAt).toLocaleDateString()}`);
      });

      // Statistics
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      const ratingCounts = reviews.reduce((counts, r) => {
        counts[r.rating] = (counts[r.rating] || 0) + 1;
        return counts;
      }, {});

      console.log('\n📊 STATISTICS:');
      console.log(`📈 Average Rating: ${avgRating.toFixed(1)}★`);
      console.log(`📊 Rating Distribution:`);
      for (let i = 1; i <= 5; i++) {
        const count = ratingCounts[i] || 0;
        const stars = '★'.repeat(i);
        console.log(`   ${stars}: ${count} review(s)`);
      }

      const withResponses = reviews.filter(r => r.response).length;
      const verified = reviews.filter(r => r.isVerified).length;
      const public_ = reviews.filter(r => r.isPublic).length;

      console.log(`💬 Reviews with responses: ${withResponses}/${reviews.length}`);
      console.log(`✅ Verified reviews: ${verified}/${reviews.length}`);
      console.log(`🌐 Public reviews: ${public_}/${reviews.length}`);

      const totalHelpful = reviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0);
      console.log(`👍 Total helpful votes: ${totalHelpful}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

main();