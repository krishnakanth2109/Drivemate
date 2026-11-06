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
  if (!user || !user.uid) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to publish post.',
    });
  }

  const lockKey = `race:post:${user.uid}`;
  let lockAcquired = false;

  try {
    lockAcquired = await acquireRaceLock(lockKey, 4);
    if (!lockAcquired) {
      return res.status(429).json({
        success: false,
        error: 'Concurrent post creation in progress. Please wait a moment.',
      });
    }

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

    // Fresh user state from database
    const freshUser = (await dataStore.getUserById(user.uid)) || user;

    // Create the post with ride-sharing / journey details
    const postPayload = {
      author: freshUser.fullName || req.body.author || 'Drivemate Driver',
      authorTag: freshUser.username ? `@${freshUser.username}` : (req.body.authorTag || '@driver'),
      authorAvatar: req.body.authorAvatar || freshUser.profilePicture || freshUser.photoUrl || '',
      userId: freshUser.uid,
      content: content.trim(),
      fromCity: fromCity && typeof fromCity === 'string' ? fromCity.trim() : undefined,
      toCity: toCity && typeof toCity === 'string' ? toCity.trim() : undefined,
      departureTime: departureTime && typeof departureTime === 'string' ? departureTime.trim() : undefined,
      availableSeats: availableSeats ? Math.max(0, parseInt(availableSeats, 10) || 0) : 0,
      pricePerSeat: pricePerSeat && typeof pricePerSeat === 'string' ? pricePerSeat.trim() : undefined,
      link: link && typeof link === 'string' && link.trim() ? link.trim() : undefined,
      linkTitle: linkTitle && typeof linkTitle === 'string' && linkTitle.trim() ? linkTitle.trim() : undefined,
      tag: tag && typeof tag === 'string' && tag.trim() ? tag.trim() : '#Carpool',
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
        freePostsUsed: freshUser.freePostsUsed || 0,
        maxFreePosts: freshUser.maxFreePosts || 100,
        singlePasses: freshUser.singlePasses || 0,
        isProUser: Boolean(freshUser.isProUser),
      },
    });
  } catch (error) {
    console.error('[PostController.createPost] Error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to publish post.',
    });
  } finally {
    if (lockAcquired) {
      await releaseRaceLock(lockKey).catch(() => {});
    }
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const user = req.user;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: 'Post ID is required.',
      });
    }

    if (!user || !user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to delete post.',
      });
    }

    const deleted = await dataStore.deletePost(postId, user.uid);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Post not found or unauthorized to delete.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully.',
      postId,
    });
  } catch (error) {
    console.error('[PostController.deletePost] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete post.',
    });
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
