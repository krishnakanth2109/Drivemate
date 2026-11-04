import { AnalyticsEvent } from '../models/AnalyticsEvent.js';

export const logEvent = async (req, res) => {
  try {
    const { eventName, params, platform } = req.body;
    const userId = req.user ? req.user.uid : (req.body.userId || 'anonymous');

    if (!eventName) {
      return res.status(400).json({ success: false, error: 'Event name required.' });
    }

    const event = await AnalyticsEvent.create({
      eventName,
      userId,
      params: params || {},
      platform: platform || 'mobile',
      ip: req.ip,
      timestamp: new Date(),
    });

    console.log(`📊 [Firebase Analytics Event] '${eventName}' logged for user: ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'Analytics event recorded.',
      event,
    });
  } catch (error) {
    console.error('[AnalyticsController.logEvent] Error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to record analytics.' });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await AnalyticsEvent.find().sort({ createdAt: -1 }).limit(50).lean();
    return res.status(200).json({ success: true, events });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch events.' });
  }
};

