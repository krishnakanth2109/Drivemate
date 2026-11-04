import { dataStore } from '../utils/database.js';

export const getBillingStatus = async (req, res) => {
  try {
    const user = await dataStore.getUserById(req.user.uid);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      billing: {
        isProUser: !!user.isProUser,
        freePostsUsed: user.freePostsUsed || 0,
        maxFreePosts: user.maxFreePosts || 2,
        singlePasses: user.singlePasses || 0,
        canPost: !!user.isProUser || (user.singlePasses || 0) > 0 || (user.freePostsUsed || 0) < (user.maxFreePosts || 2),
      },
    });
  } catch (error) {
    console.error('[BillingController.getBillingStatus] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve billing status.',
    });
  }
};

export const upgradeToPro = async (req, res) => {
  try {
    const user = req.user;
    const updatedUser = await dataStore.updateUser(user.uid, {
      isProUser: true,
      planUpgradedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully upgraded to Drivemate Pro membership! Enjoy unlimited community posts and advanced telematics.',
      billing: {
        isProUser: true,
        freePostsUsed: updatedUser.freePostsUsed,
        maxFreePosts: updatedUser.maxFreePosts,
        singlePasses: updatedUser.singlePasses,
      },
    });
  } catch (error) {
    console.error('[BillingController.upgradeToPro] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upgrade to Pro tier.',
    });
  }
};

export const buySinglePass = async (req, res) => {
  try {
    const user = req.user;
    const currentPasses = typeof user.singlePasses === 'number' ? user.singlePasses : 0;
    const updatedUser = await dataStore.updateUser(user.uid, {
      singlePasses: currentPasses + 1,
    });

    return res.status(200).json({
      success: true,
      message: 'Single Post Pass purchased successfully. You can now publish your community post.',
      billing: {
        isProUser: !!updatedUser.isProUser,
        freePostsUsed: updatedUser.freePostsUsed,
        maxFreePosts: updatedUser.maxFreePosts,
        singlePasses: updatedUser.singlePasses,
      },
    });
  } catch (error) {
    console.error('[BillingController.buySinglePass] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to purchase single pass.',
    });
  }
};

