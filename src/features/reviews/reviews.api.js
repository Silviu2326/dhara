import { reviewService } from '../../services/api/reviewService.js';
import { clientService } from '../../services/api/clientService.js';
import { sessionNoteService } from '../../services/api/sessionNoteService.js';
import { notificationService } from '../../services/api/notificationService.js';
import { privacy } from '../../services/utils/privacy.js';
import { apiClient } from '../../services/config/apiClient.js';
import { ENDPOINTS } from '../../services/config/endpoints.js';

// Helper to get current therapist ID from storage
const getCurrentTherapistId = () => {
  const userStr = localStorage.getItem('dhara-user') || sessionStorage.getItem('dhara-user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id;
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  return null;
};


/**
 * Get reviews with advanced filtering and pagination
 * @param {Object} filters - Filter parameters
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Number of reviews per page
 * @returns {Promise<Object>} Reviews data with metadata
 */
export const getReviews = async (filters = {}, page = 1, limit = 20) => {
  try {
    // Initialize services if needed
    await reviewService.initialize();
    await clientService.initialize();

    // Log access for tracking
    console.log('Reviews accessed:', { filters, page, limit });

    // Get current therapist ID
    const therapistId = getCurrentTherapistId();
    
    // Build comprehensive filter object
    const reviewFilters = {
      // Filter by therapist (only if not admin)
      ...(therapistId && { therapistId }),
      
      // Rating filters
      ...(filters.ratings && filters.ratings.length > 0 && {
        rating: { $in: filters.ratings }
      }),

      // Response status filters
      ...(filters.responded === 'responded' && {
        'response.text': { $exists: true, $ne: null }
      }),
      ...(filters.responded === 'pending' && {
        'response.text': { $exists: false }
      }),

      // Date range filters
      ...(filters.dateFrom && {
        createdAt: { $gte: new Date(filters.dateFrom) }
      }),
      ...(filters.dateTo && {
        createdAt: {
          ...filters.dateFrom && { $gte: new Date(filters.dateFrom) },
          $lte: new Date(filters.dateTo)
        }
      }),

      // Text search filters
      ...(filters.search && {
        $or: [
          { comment: { $regex: filters.search, $options: 'i' } },
          { 'response.text': { $regex: filters.search, $options: 'i' } }
        ]
      }),

      // Moderation status filters
      ...(filters.moderationStatus && {
        moderationStatus: filters.moderationStatus
      }),

      // Client filters
      ...(filters.clientId && { clientId: filters.clientId }),

      // Session filters
      ...(filters.sessionId && { sessionId: filters.sessionId })
    };

    // Build sort options
    const sortOptions = {};
    switch (filters.sortBy) {
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'lowest_rating':
        sortOptions.rating = 1;
        break;
      case 'highest_rating':
        sortOptions.rating = -1;
        break;
      case 'most_helpful':
        sortOptions.helpfulCount = -1;
        break;
      default:
        sortOptions.createdAt = -1; // newest first
    }

    // Make direct API call to /api/reviews
    console.log('reviews.api.js: Making direct API call to /api/reviews');

    const apiParams = {
      page,
      limit,
      ...reviewFilters
    };

    console.log('reviews.api.js: API call params:', apiParams);

    const response = await apiClient.get(ENDPOINTS.REVIEWS.BASE, { params: apiParams });
    const reviewsData = response.data;

    console.log('reviews.api.js: Direct API response:', reviewsData);

    // Handle API response structure: { success: true, data: { reviews: [...], pagination: {...} } }
    const actualReviews = reviewsData?.data?.reviews || reviewsData?.reviews || [];
    const paginationData = reviewsData?.data?.pagination || {};

    console.log('reviews.api.js: extracted reviews:', actualReviews.length, 'pagination:', paginationData);

    // Use reviews as they come from the API (they already include client data)
    console.log('reviews.api.js: Processing reviews without additional API calls');

    const enhancedReviews = actualReviews.map((review) => {
      console.log('reviews.api.js: Processing review:', review.id, 'with client:', review.client);

      return {
        ...review,
        // Use client data already included in the API response
        clientName: review.client?.name || 'Cliente anónimo',
        clientAvatar: review.client?.avatar || null,
        sessionDate: review.sessionDate || review.createdAt,
        sessionType: review.sessionType || 'session',
        canModerate: true,
        canRespond: !review.response,
        moderationFlags: review.moderationFlags || [],
        sentiment: review.sentiment || null,
        helpfulCount: review.helpfulCount || 0,
        reportCount: review.reportCount || 0
      };
    });

    // Calculate basic statistics from the reviews we received
    console.log('reviews.api.js: Calculating basic stats from received reviews');

    const totalRating = enhancedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = enhancedReviews.length > 0 ? totalRating / enhancedReviews.length : 0;

    const ratingDistribution = enhancedReviews.reduce((dist, review) => {
      const rating = Math.floor(review.rating);
      dist[rating] = (dist[rating] || 0) + 1;
      return dist;
    }, {});

    const pendingResponses = enhancedReviews.filter(review => !review.response).length;

    const stats = {
      averageRating,
      totalReviews: enhancedReviews.length,
      pendingResponses,
      ratingDistribution,
      moderationQueue: 0,
      sentimentSummary: null,
      trendData: null
    };

    console.log('reviews.api.js: Calculated stats:', stats);

    // Use actual pagination data from API response
    const total = paginationData.total || actualReviews.length;
    const totalPages = paginationData.pages || Math.ceil(total / limit);

    console.log('reviews.api.js: final return data:', {
      reviewsCount: enhancedReviews.length,
      total,
      totalPages,
      currentPage: page
    });

    return {
      reviews: enhancedReviews,
      total: total,
      totalPages: totalPages,
      currentPage: page,
      averageRating: stats.averageRating,
      ratingDistribution: stats.ratingDistribution,
      totalReviews: stats.totalReviews,
      pendingResponses: stats.pendingResponses,
      moderationQueue: stats.moderationQueue,
      sentimentSummary: stats.sentimentSummary,
      trendData: stats.trendData,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

  } catch (error) {
    console.error('Error fetching reviews:', error);

    // Log error for tracking
    console.error('Reviews access error:', { error: error.message, filters });

    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }
};

/**
 * Respond to a review with automatic moderation and notifications
 * @param {string} reviewId - Review ID
 * @param {string} responseText - Response text
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Response result
 */
export const respondToReview = async (reviewId, responseText, options = {}) => {
  try {
    // Validate input
    if (!reviewId || !responseText?.trim()) {
      throw new Error('Review ID and response text are required');
    }

    // Get original review for context
    const originalReview = await reviewService.getReviewById(reviewId, {
      includeMetadata: true,
      decryptSensitiveData: true
    });
    if (!originalReview) {
      throw new Error('Review not found');
    }

    // Auto-moderate response before saving (fallback if method doesn't exist)
    let moderationResult = { status: 'approved', blocked: false, flags: [] };
    try {
      if (typeof reviewService.moderateContent === 'function') {
        moderationResult = await reviewService.moderateContent(responseText, {
          type: 'response',
          reviewId,
          autoApprove: options.skipModeration || false
        });
      } else {
        // Use automatic moderation from reviewService
        moderationResult = await reviewService.automaticModeration({
          content: responseText,
          type: 'response'
        });
      }
    } catch (error) {
      console.warn('Moderation service unavailable, proceeding without moderation:', error);
    }

    if (moderationResult.blocked && !options.forceSubmit) {
      throw new Error(`Response blocked by moderation: ${moderationResult.reason}`);
    }

    // Submit response
    const response = await reviewService.respondToReview(reviewId, {
      text: responseText,
      moderationStatus: moderationResult.status,
      moderationFlags: moderationResult.flags,
      isPublic: options.isPublic !== false, // Default to public
      notifyClient: options.notifyClient !== false, // Default to notify
      responseTemplate: options.templateId || null
    });

    // Send notification to client if enabled
    if (options.notifyClient !== false && originalReview.clientId) {
      try {
        await notificationService.createNotification({
          userId: originalReview.clientId,
          type: 'review_response',
          title: 'Respuesta a tu reseña',
          message: 'Tu terapeuta ha respondido a tu reseña. ¡Échale un vistazo!',
          metadata: {
            reviewId,
            responseId: response.id,
            therapistName: response.therapistName
          },
          channels: ['push', 'email'],
          priority: 'normal'
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the response if notification fails
      }
    }

    // Log response action
    console.log('Review response created:', {
      reviewId,
      responseId: response.id,
      moderationStatus: moderationResult.status,
      clientNotified: options.notifyClient !== false
    });

    // Check if this creates any new alerts (low rating responses, etc.)
    const alertsCreated = await checkForResponseAlerts(originalReview, response);

    return {
      success: true,
      response,
      moderationResult,
      alertsCreated,
      message: 'Response submitted successfully'
    };

  } catch (error) {
    console.error('Error responding to review:', error);

    // Log error
    console.error('Review response error:', { reviewId, error: error.message });

    throw error;
  }
};

/**
 * Get comprehensive review statistics based on real API data
 * @param {Object} options - Options for statistics calculation
 * @returns {Promise<Object>} Review statistics
 */
export const getReviewsStats = async (options = {}) => {
  try {
    console.log('getReviewsStats: Starting with options:', options);
    
    // Get current therapist ID
    const therapistId = getCurrentTherapistId();

    // Get all reviews directly from API
    const apiParams = {
      limit: 1000,
      ...(therapistId && { therapistId })
    };

    console.log('[STATS] getReviewsStats: API params:', apiParams);

    const response = await apiClient.get(ENDPOINTS.REVIEWS.BASE, { params: apiParams });
    const reviewsData = response.data;

    console.log('[STATS] getReviewsStats: Raw API response structure:', {
      hasSuccess: 'success' in reviewsData,
      hasData: 'data' in reviewsData,
      hasReviews: 'reviews' in reviewsData,
      topLevelKeys: Object.keys(reviewsData)
    });

    // Handle both response formats: {success: true, data: {reviews: [...]}} or {reviews: [...]}
    const allReviews = reviewsData?.data?.reviews || reviewsData?.reviews || [];

    console.log('[STATS] getReviewsStats: Got reviews for stats:', allReviews.length);

    // Calculate basic statistics
    const totalReviews = allReviews.length;
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    // Calculate rating distribution
    const ratingDistribution = allReviews.reduce((dist, review) => {
      const rating = Math.floor(review.rating);
      dist[rating] = (dist[rating] || 0) + 1;
      return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    // Calculate pending responses
    const pendingResponses = allReviews.filter(review => !review.response).length;
    const responseRate = totalReviews > 0 ? ((totalReviews - pendingResponses) / totalReviews) * 100 : 0;

    // Calculate satisfaction rate (4-5 stars)
    const satisfactionRate = totalReviews > 0
      ? ((ratingDistribution[4] + ratingDistribution[5]) / totalReviews) * 100
      : 0;

    // Time-based calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const last30DaysReviews = allReviews.filter(review =>
      new Date(review.createdAt) >= thirtyDaysAgo
    );
    const last90DaysReviews = allReviews.filter(review =>
      new Date(review.createdAt) >= ninetyDaysAgo
    );

    const last30DaysAverage = last30DaysReviews.length > 0
      ? last30DaysReviews.reduce((sum, r) => sum + r.rating, 0) / last30DaysReviews.length
      : averageRating;

    const last90DaysAverage = last90DaysReviews.length > 0
      ? last90DaysReviews.reduce((sum, r) => sum + r.rating, 0) / last90DaysReviews.length
      : averageRating;

    // Calculate trend changes
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const previousMonthReviews = allReviews.filter(review => {
      const reviewDate = new Date(review.createdAt);
      return reviewDate >= previousMonthStart && reviewDate <= previousMonthEnd;
    });

    const currentMonthReviews = allReviews.filter(review => {
      const reviewDate = new Date(review.createdAt);
      return reviewDate >= currentMonthStart;
    });

    const previousMonthAvg = previousMonthReviews.length > 0
      ? previousMonthReviews.reduce((sum, r) => sum + r.rating, 0) / previousMonthReviews.length
      : 0;

    const currentMonthAvg = currentMonthReviews.length > 0
      ? currentMonthReviews.reduce((sum, r) => sum + r.rating, 0) / currentMonthReviews.length
      : averageRating;

    // Rating trend calculation
    const ratingChange = previousMonthAvg > 0 ? ((currentMonthAvg - previousMonthAvg) / previousMonthAvg) * 100 : 0;
    const ratingTrendType = ratingChange > 2 ? 'positive' : ratingChange < -2 ? 'negative' : 'neutral';

    // Volume trend calculation
    const volumeChange = previousMonthReviews.length > 0
      ? ((currentMonthReviews.length - previousMonthReviews.length) / previousMonthReviews.length) * 100
      : 0;
    const volumeTrendType = volumeChange > 10 ? 'positive' : volumeChange < -10 ? 'negative' : 'neutral';

    // Recent vs overall comparison
    const recentVsOverall = averageRating > 0 ? ((last30DaysAverage - averageRating) / averageRating) * 100 : 0;
    const recentType = recentVsOverall > 1 ? 'positive' : recentVsOverall < -1 ? 'negative' : 'neutral';

    console.log('getReviewsStats: Calculated basic stats:', {
      totalReviews,
      averageRating,
      pendingResponses,
      responseRate,
      satisfactionRate
    });

    return {
      // Basic metrics
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      pendingResponses,
      responseRate: Math.round(responseRate * 10) / 10,
      satisfactionRate: Math.round(satisfactionRate * 10) / 10,

      // Advanced metrics
      ratingDistribution,
      last90DaysAverage: Math.round(last90DaysAverage * 10) / 10,
      last30DaysAverage: Math.round(last30DaysAverage * 10) / 10,

      // Trend analysis
      trend: {
        rating: {
          type: ratingTrendType,
          value: `${ratingChange > 0 ? '+' : ''}${Math.round(ratingChange * 10) / 10}%`,
          label: 'vs mes anterior'
        },
        total: {
          type: volumeTrendType,
          value: `${volumeChange > 0 ? '+' : ''}${Math.round(volumeChange * 10) / 10}%`,
          label: 'vs mes anterior'
        },
        recent: {
          type: recentType,
          value: `${recentVsOverall > 0 ? '+' : ''}${Math.round(recentVsOverall * 10) / 10}%`,
          label: 'vs promedio general'
        }
      },

      // Moderation and quality
      moderationQueue: 0,
      flaggedReviews: 0,
      autoModerated: 0,

      // Sentiment analysis (basic)
      sentimentSummary: {
        positive: ratingDistribution[4] + ratingDistribution[5],
        neutral: ratingDistribution[3],
        negative: ratingDistribution[1] + ratingDistribution[2],
        averageScore: averageRating / 5
      },

      // Time-based metrics
      reviewsThisMonth: currentMonthReviews.length,
      reviewsLastMonth: previousMonthReviews.length,

      // Additional calculated metrics
      averageWordsPerReview: allReviews.length > 0
        ? Math.round(allReviews.reduce((sum, r) => sum + (r.comment?.split(' ').length || 0), 0) / allReviews.length)
        : 0,
      helpfulnessScore: allReviews.length > 0
        ? Math.round((allReviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0) / allReviews.length) * 10) / 10
        : 0
    };

  } catch (error) {
    console.error('Error fetching review statistics:', error);

    // Return default stats structure on error
    return {
      averageRating: 0,
      totalReviews: 0,
      pendingResponses: 0,
      responseRate: 0,
      satisfactionRate: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      last90DaysAverage: 0,
      last30DaysAverage: 0,
      trend: {
        rating: { type: 'neutral', value: '0%', label: 'vs mes anterior' },
        total: { type: 'neutral', value: '0%', label: 'vs mes anterior' },
        recent: { type: 'neutral', value: '0%', label: 'vs promedio general' }
      },
      moderationQueue: 0,
      sentimentSummary: {
        positive: 0,
        neutral: 0,
        negative: 0,
        averageScore: 0
      },
      reviewsThisMonth: 0,
      reviewsLastMonth: 0,
      averageWordsPerReview: 0,
      helpfulnessScore: 0
    };
  }
};

/**
 * Get rating trend data for charts based on real review data
 * @param {Object} options - Options for trend calculation
 * @returns {Promise<Array>} Trend data points
 */
export const getRatingTrend = async (options = {}) => {
  console.log('[TREND] getRatingTrend: FUNCTION CALLED with options:', options);

  try {
    const timeframe = options.timeframe || '30_days';
    const days = timeframe === '30_days' ? 30 : timeframe === '7_days' ? 7 : 90;

    console.log('[TREND] getRatingTrend: Using timeframe:', timeframe, 'days:', days);
    
    // Get current therapist ID
    const therapistId = getCurrentTherapistId();

    // Get all reviews directly from API to calculate trend
    console.log('[TREND] getRatingTrend: About to fetch reviews from API...');

    const apiParams = {
      limit: 1000,
      ...(therapistId && { therapistId })
    };

    console.log('[TREND] getRatingTrend: API params:', apiParams);

    const response = await apiClient.get(ENDPOINTS.REVIEWS.BASE, { params: apiParams });
    const reviewsData = response.data;

    console.log('[TREND] getRatingTrend: Raw API response structure:', {
      hasSuccess: 'success' in reviewsData,
      hasData: 'data' in reviewsData,
      hasReviews: 'reviews' in reviewsData,
      topLevelKeys: Object.keys(reviewsData)
    });

    // Handle both response formats: {success: true, data: {reviews: [...]}} or {reviews: [...]}
    const allReviews = reviewsData?.data?.reviews || reviewsData?.reviews || [];

    console.log('[TREND] getRatingTrend: SUCCESS - Got reviews for trend:', allReviews.length);
    console.log('[TREND] getRatingTrend: First few reviews:', allReviews.slice(0, 2).map(r => ({
      id: r.id,
      createdAt: r.createdAt,
      rating: r.rating
    })));

    // Create date buckets for the timeframe
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('getRatingTrend: Date range:', { startDate, endDate, days });

    // Group reviews by date
    const reviewsByDate = {};

    console.log('getRatingTrend: Processing reviews for date grouping...');
    console.log('getRatingTrend: Sample review dates:', allReviews.slice(0, 3).map(r => ({
      id: r.id,
      createdAt: r.createdAt,
      rating: r.rating
    })));

    allReviews.forEach(review => {
      const reviewDate = new Date(review.createdAt);
      const dateKey = reviewDate.toISOString().split('T')[0];

      console.log('getRatingTrend: Processing review:', {
        id: review.id,
        createdAt: review.createdAt,
        reviewDate: reviewDate,
        dateKey: dateKey,
        rating: review.rating,
        withinRange: reviewDate >= startDate && reviewDate <= endDate
      });

      if (reviewDate >= startDate && reviewDate <= endDate) {
        if (!reviewsByDate[dateKey]) {
          reviewsByDate[dateKey] = [];
        }
        reviewsByDate[dateKey].push(review);
      }
    });

    console.log('getRatingTrend: Reviews grouped by date:', Object.keys(reviewsByDate).length, 'days with reviews');
    console.log('getRatingTrend: Date groups:', Object.keys(reviewsByDate).sort());
    console.log('getRatingTrend: Sample grouped data:', Object.entries(reviewsByDate).slice(0, 3).map(([date, reviews]) => ({
      date,
      count: reviews.length,
      ratings: reviews.map(r => r.rating)
    })));

    // Generate trend data for each day
    const trendData = [];

    console.log('getRatingTrend: Generating trend data for', days + 1, 'days');

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const dayReviews = reviewsByDate[dateKey] || [];

      console.log('getRatingTrend: Day', dateKey, '- found', dayReviews.length, 'reviews');

      // Calculate average rating for this day
      let averageRating = 0;
      if (dayReviews.length > 0) {
        const totalRating = dayReviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = totalRating / dayReviews.length;
        console.log('getRatingTrend: Day', dateKey, '- calculated average:', averageRating, 'from ratings:', dayReviews.map(r => r.rating));
      } else {
        // If no reviews for this day, use rolling average from previous days
        const previousData = trendData.slice(-7); // Last 7 days
        if (previousData.length > 0) {
          const validRatings = previousData.filter(d => d.volume > 0);
          if (validRatings.length > 0) {
            averageRating = validRatings.reduce((sum, d) => sum + d.rating, 0) / validRatings.length;
            console.log('getRatingTrend: Day', dateKey, '- using rolling average:', averageRating);
          }
        }
      }

      const dataPoint = {
        date: dateKey,
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        volume: dayReviews.length,
        reviewCount: dayReviews.length,
        sentiment: averageRating / 5 // Normalize to 0-1
      };

      console.log('getRatingTrend: Adding data point:', dataPoint);
      trendData.push(dataPoint);
    }

    console.log('getRatingTrend: Generated trend data points:', trendData.length);
    console.log('getRatingTrend: Sample data:', trendData.slice(0, 3));

    // Filter out days with no data if we have enough data points
    const hasDataPoints = trendData.filter(d => d.volume > 0);
    const finalData = hasDataPoints.length >= 7 ? hasDataPoints : trendData;

    // Add trend calculations
    const enhancedTrend = finalData.map((point, index) => {
      const previousPoint = index > 0 ? finalData[index - 1] : null;
      const change = previousPoint ? point.rating - previousPoint.rating : 0;
      const changePercentage = previousPoint && previousPoint.rating > 0
        ? ((change / previousPoint.rating) * 100)
        : 0;

      return {
        ...point,
        change: Math.round(change * 100) / 100,
        changePercentage: Math.round(changePercentage * 100) / 100,
        trend: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable'
      };
    });

    console.log('getRatingTrend: Final enhanced trend data:', enhancedTrend.length, 'points');

    return enhancedTrend;

  } catch (error) {
    console.error('[ERROR] getRatingTrend: ERROR occurred:', error);
    console.error('[ERROR] getRatingTrend: Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Return fallback data on error
    const days = 30;
    const fallbackData = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      fallbackData.push({
        date: date.toISOString().split('T')[0],
        rating: 4.0,
        volume: 1,
        sentiment: 0.8,
        change: 0,
        changePercentage: 0,
        trend: 'stable'
      });
    }

    console.log('[WARNING] getRatingTrend: Returning fallback data due to error');
    return fallbackData;
  }
};

/**
 * Moderate a review (approve, flag, or block)
 * @param {string} reviewId - Review ID
 * @param {string} action - Moderation action
 * @param {string} reason - Reason for moderation
 * @returns {Promise<Object>} Moderation result
 */
export const moderateReview = async (reviewId, action, reason = '') => {
  try {
    const result = await reviewService.moderateReview(reviewId, {
      action, // 'approve', 'flag', 'block', 'delete'
      reason,
      moderatorNotes: reason
    }, {
      createAuditLog: true,
      notifyModerator: true
    });

    // Log moderation action
    console.log('Review moderated:', {
      reviewId,
      moderationAction: action,
      reason,
      moderationId: result.moderationId
    });

    // Send notification if review was blocked/flagged
    if (['flag', 'block'].includes(action)) {
      await notificationService.createNotification({
        type: 'moderation_alert',
        title: 'Revisión moderada',
        message: `Una revisión ha sido ${action === 'flag' ? 'marcada' : 'bloqueada'} para moderación`,
        metadata: { reviewId, action, reason },
        channels: ['push'],
        priority: 'high'
      });
    }

    return result;

  } catch (error) {
    console.error('Error moderating review:', error);

    console.error('Review moderation error:', { reviewId, action, error: error.message });

    throw error;
  }
};

/**
 * Helper function to calculate trend changes
 * @private
 */
const calculateTrendChanges = (trendData) => {
  if (!trendData || trendData.length < 2) {
    return {
      rating: { type: 'neutral', value: '0%', label: 'vs mes anterior' },
      total: { type: 'neutral', value: '0%', label: 'vs mes anterior' },
      recent: { type: 'neutral', value: '0%', label: 'vs promedio general' }
    };
  }

  const recent = trendData.slice(-7); // Last 7 data points
  const previous = trendData.slice(-14, -7); // Previous 7 data points

  const recentAvg = recent.reduce((sum, point) => sum + point.rating, 0) / recent.length;
  const previousAvg = previous.length > 0
    ? previous.reduce((sum, point) => sum + point.rating, 0) / previous.length
    : recentAvg;

  const overallAvg = trendData.reduce((sum, point) => sum + point.rating, 0) / trendData.length;

  // Calculate rating change
  const ratingChange = ((recentAvg - previousAvg) / previousAvg) * 100;
  const ratingType = ratingChange > 2 ? 'positive' : ratingChange < -2 ? 'negative' : 'neutral';

  // Calculate vs overall average
  const recentVsOverall = ((recentAvg - overallAvg) / overallAvg) * 100;
  const recentType = recentVsOverall > 1 ? 'positive' : recentVsOverall < -1 ? 'negative' : 'neutral';

  return {
    rating: {
      type: ratingType,
      value: `${ratingChange > 0 ? '+' : ''}${Math.round(ratingChange * 10) / 10}%`,
      label: 'vs período anterior'
    },
    total: {
      type: recent.length > previous.length ? 'positive' : recent.length < previous.length ? 'negative' : 'neutral',
      value: `${recent.length > previous.length ? '+' : ''}${Math.round(((recent.length - previous.length) / Math.max(previous.length, 1)) * 100)}%`,
      label: 'vs período anterior'
    },
    recent: {
      type: recentType,
      value: `${recentVsOverall > 0 ? '+' : ''}${Math.round(recentVsOverall * 10) / 10}%`,
      label: 'vs promedio general'
    }
  };
};

/**
 * Helper function to check for response alerts
 * @private
 */
const checkForResponseAlerts = async (originalReview, response) => {
  const alerts = [];

  try {
    // Check if original review was low-rated and now has a response
    if (originalReview.rating <= 2) {
      alerts.push({
        type: 'low_rating_response',
        priority: 'medium',
        message: 'Low-rated review has been responded to',
        data: { reviewId: originalReview.id, rating: originalReview.rating }
      });
    }

    // Check response sentiment
    if (response.sentimentAnalysis?.score < 0.3) {
      alerts.push({
        type: 'negative_response_sentiment',
        priority: 'high',
        message: 'Response has concerning sentiment - review recommended',
        data: { responseId: response.id, sentiment: response.sentimentAnalysis.score }
      });
    }

    // Create alert notifications
    for (const alert of alerts) {
      await notificationService.createNotification({
        type: alert.type,
        title: 'Alerta de respuesta',
        message: alert.message,
        metadata: alert.data,
        channels: ['push'],
        priority: alert.priority
      });
    }

    return alerts;

  } catch (error) {
    console.error('Error checking response alerts:', error);
    return [];
  }
};

