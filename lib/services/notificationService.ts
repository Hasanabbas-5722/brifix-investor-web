import { API_BASE_URL } from './apiConfig';

/**
 * Converts a base64 URL-safe string to a Uint8Array
 * required by window.PushManager.subscribe({ applicationServerKey })
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface TopPickData {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  current_price: number;
  target_1d: number;
  target_5d: number;
  expected_return_pct: number;
  stop_loss: number;
  stop_loss_pct: number;
  risk_reward_ratio: string;
  signal: string;
  confidence: number;
  rsi?: number;
  rationale?: string;
  logo?: string;
}

export const notificationService = {
  /**
   * Checks whether the current browser supports Web Push & Service Workers
   */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  /**
   * Returns the current notification permission: 'default' | 'granted' | 'denied'
   */
  getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
    return Notification.permission;
  },

  /**
   * Registers the background service worker `/sw.js`
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      return reg;
    } catch (err) {
      console.error('[NotificationService] Service Worker registration failed:', err);
      return null;
    }
  },

  /**
   * Fetches the backend's VAPID public key
   */
  async getVapidPublicKey(): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/vapid-public-key`);
      const data = await res.json();
      if (data.status === 'success' && data.publicKey) {
        return data.publicKey;
      }
      return null;
    } catch (err) {
      console.error('[NotificationService] Failed to fetch VAPID public key:', err);
      return null;
    }
  },

  /**
   * Prompts user for permission and registers push subscription with backend
   */
  async subscribe(): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Push notifications are not supported in this browser.' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Notification permission denied.' };
      }

      const reg = await this.registerServiceWorker();
      if (!reg) {
        return { success: false, error: 'Failed to initialize background Service Worker.' };
      }

      const publicKey = await this.getVapidPublicKey();
      if (!publicKey) {
        return { success: false, error: 'Could not retrieve application VAPID public key.' };
      }

      // Check existing subscription
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }

      // Send subscription object to backend
      const res = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });
      const data = await res.json();

      return { success: data.status === 'success', subscription: sub };
    } catch (err: any) {
      console.error('[NotificationService] Error subscribing to push:', err);
      return { success: false, error: err.message || 'Subscription failed.' };
    }
  },

  /**
   * Triggers an immediate Web Push notification for the #1 AI-recommended stock.
   */
  async triggerTopPickPush(customSubscription?: PushSubscription | null): Promise<any> {
    try {
      let sub = customSubscription;
      if (!sub && this.isSupported()) {
        const reg = await navigator.serviceWorker.ready;
        sub = await reg.pushManager.getSubscription();
      }

      const res = await fetch(`${API_BASE_URL}/predict/notify-top-pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });
      return await res.json();
    } catch (err) {
      console.error('[NotificationService] Error triggering top pick push:', err);
      return { status: 'failed', error: String(err) };
    }
  },

  /**
   * Fetches the top-pick stock details directly from the prediction API
   */
  async getTopPick(): Promise<TopPickData | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/predict/top-pick`);
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        return data.data as TopPickData;
      }
      return null;
    } catch (err) {
      console.error('[NotificationService] Failed to load top stock pick:', err);
      return null;
    }
  }
};
