import { analyticsAPI } from "./api";

/**
 * Firebase Analytics helper
 * Records app events, screen views, and user journeys
 */
export async function logAnalyticsEvent(eventName: string, params: Record<string, any> = {}) {
  try {
    await analyticsAPI.logEvent(eventName, {
      ...params,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Non-blocking
  }
}

export async function logScreenView(screenName: string) {
  return logAnalyticsEvent("screen_view", { screen_name: screenName });
}

export async function logPostCreation(tag?: string, fromCity?: string, toCity?: string) {
  return logAnalyticsEvent("create_post", { tag, fromCity, toCity });
}

export async function logPaymentInitiated(plan: string) {
  return logAnalyticsEvent("payment_initiated", { plan });
}

export default {
  logAnalyticsEvent,
  logScreenView,
  logPostCreation,
  logPaymentInitiated,
};

