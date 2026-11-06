import { dataStore } from '../utils/database.js';
import { acquireRaceLock, releaseRaceLock } from '../config/redis.js';

export const getPosts = async (req, res) => {
  try {
    const posts = await dataStore.getAllPosts();
    const currentUserId = req.user ? req.user.uid : null;

    // Attach isLiked flag for current user
    const formatted = posts.map((p) => {
      const likedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
      return {
        ...p,
        isLiked: currentUserId ? likedBy.includes(currentUserId) : false,
      };
    });

    return res.status(200).json({
      success: true,
      posts: formatted,
    });
  } catch (error) {
    console.error('[PostController.getPosts] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch community posts.',
    });
  }
};

export const createPost = async (req, res) => {
  const user = req.user;
  const lockKey = `race:post:${user.uid}`;

  // Acquire Redis Distributed Lock to prevent race condition on quota
  const acquired = await acquireRaceLock(lockKey, 4);
  if (!acquired) {
    return res.status(429).json({
      success: false,
      error: 'Concurrent post creation in progress. Please wait a moment.',
    });
  }

  try {
    const {
      content,
      fromCity,
      toCity,
      departureTime,
      availableSeats,
      pricePerSeat,
      link,
      linkTitle,
      tag,
      photos,
    } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Post content cannot be empty.',
      });
    }

    // Fresh user state from database to ensure atomic quota check
    const freshUser = await dataStore.getUserById(user.uid) || user;
    const maxFree = typeof freshUser.maxFreePosts === 'number' ? freshUser.maxFreePosts : 2;
    const usedFree = typeof freshUser.freePostsUsed === 'number' ? freshUser.freePostsUsed : 0;
    const singlePasses = typeof freshUser.singlePasses === 'number' ? freshUser.singlePasses : 0;
    const isPro = !!freshUser.isProUser;

    // Strict 2 free posts barrier
    const canPost = isPro || singlePasses > 0 || usedFree < maxFree;

    if (!canPost) {
      return res.status(402).json({
        success: false,
        requirePayment: true,
        error: 'Free tier limit reached (2/2 posts used). Please upgrade to Pro or purchase a single post pass.',
        quota: {
          freePostsUsed: usedFree,
          maxFreePosts: maxFree,
          singlePasses,
          isProUser: isPro,
        },
      });
    }

    // Deduct pass or increment free posts count atomically
    let updatedFreeUsed = usedFree;
    let updatedSinglePasses = singlePasses;

    if (!isPro) {
      if (usedFree < maxFree) {
        updatedFreeUsed = usedFree + 1;
      } else if (singlePasses > 0) {
        updatedSinglePasses = singlePasses - 1;
      }
    }

    // Update user in database
    const updatedUser = await dataStore.updateUser(user.uid, {
      freePostsUsed: updatedFreeUsed,
      singlePasses: updatedSinglePasses,
    });

    // Create the post with ride-sharing / journey details
    const postPayload = {
      author: freshUser.fullName || 'Drivemate Driver',
      authorTag: freshUser.username ? `@${freshUser.username}` : '@driver',
      userId: freshUser.uid,
      content: content.trim(),
      fromCity: fromCity ? fromCity.trim() : undefined,
      toCity: toCity ? toCity.trim() : undefined,
      departureTime: departureTime ? departureTime.trim() : undefined,
      availableSeats: availableSeats ? Number(availableSeats) : 0,
      pricePerSeat: pricePerSeat ? pricePerSeat.trim() : undefined,
      link: link && link.trim() ? link.trim() : undefined,
      linkTitle: linkTitle && linkTitle.trim() ? linkTitle.trim() : undefined,
      tag: tag && tag.trim() ? tag.trim() : '#Carpool',
      photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
      timeAgo: 'Just now',
      likes: 0,
      commentsCount: 0,
      likedBy: [],
    };

    const newPost = await dataStore.createPost(postPayload);

    return res.status(201).json({
      success: true,
      message: 'Post published successfully.',
      post: {
        ...newPost,
        isLiked: false,
      },
      quota: {
        freePostsUsed: updatedUser.freePostsUsed,
        maxFreePosts: updatedUser.maxFreePosts,
        singlePasses: updatedUser.singlePasses,
        isProUser: updatedUser.isProUser,
      },
    });
  } catch (error) {
    console.error('[PostController.createPost] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to publish post.',
    });
  } finally {
    await releaseRaceLock(lockKey);
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.uid;

    const updatedPost = await dataStore.toggleLikePost(postId, userId);
    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found.',
      });
    }

    return res.status(200).json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error('[PostController.toggleLike] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update post like status.',
    });
  }
};
