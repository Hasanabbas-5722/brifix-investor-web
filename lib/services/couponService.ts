import { COUPON_API_BASE_URL } from './apiConfig';

function bearerHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  } as const;
}

function requireCouponBase(): string {
  const base = COUPON_API_BASE_URL.replace(/\/$/, '');
  if (!base) {
    throw new Error(
      'Coupon API is not configured. Set NEXT_PUBLIC_COUPON_API_BASE_URL (e.g. https://your-host/v3).'
    );
  }
  return base;
}

/**
 * Coupon / trial APIs from `brifix_investors_frontend/src/api/couponService.js`.
 * Uses a separate base URL (`v3` service in RN); wire via env when that backend is available.
 */
export const couponService = {
  async getCoupons(accessToken: string) {
    try {
      const base = requireCouponBase();
      const res = await fetch(`${base}/coupons`, {
        method: 'GET',
        headers: bearerHeaders(accessToken),
      });
      if (!res.ok) throw new Error('Failed to fetch coupons');
      const data = await res.json();
      return (data.coupons ?? []) as unknown[];
    } catch (e) {
      console.error('couponService.getCoupons', e);
      return couponService.getMockCoupons();
    }
  },

  async redeemCoupon(accessToken: string, couponId: string, couponCode: string) {
    const base = requireCouponBase();
    const res = await fetch(`${base}/coupons/redeem`, {
      method: 'POST',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify({ couponId, couponCode }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error((errBody as { message?: string }).message || 'Failed to redeem coupon');
    }
    return res.json();
  },

  async getRedeemedCoupons(accessToken: string) {
    try {
      const base = requireCouponBase();
      const res = await fetch(`${base}/coupons/redeemed`, {
        method: 'GET',
        headers: bearerHeaders(accessToken),
      });
      if (!res.ok) throw new Error('Failed to fetch redeemed coupons');
      const data = await res.json();
      return (data.coupons ?? []) as unknown[];
    } catch (e) {
      console.error('couponService.getRedeemedCoupons', e);
      return [];
    }
  },

  async checkTrialEligibility(accessToken: string) {
    try {
      const base = requireCouponBase();
      const res = await fetch(`${base}/trial/eligibility`, {
        method: 'GET',
        headers: bearerHeaders(accessToken),
      });
      if (!res.ok) throw new Error('Failed to check trial eligibility');
      return res.json();
    } catch (e) {
      console.error('couponService.checkTrialEligibility', e);
      return { eligible: true, message: 'Eligible for trial' };
    }
  },

  async activateTrial(accessToken: string, couponCode: string) {
    const base = requireCouponBase();
    const res = await fetch(`${base}/trial/activate`, {
      method: 'POST',
      headers: bearerHeaders(accessToken),
      body: JSON.stringify({ couponCode }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error((errBody as { message?: string }).message || 'Failed to activate trial');
    }
    return res.json();
  },

  /** Same mock fallback as the React Native app for offline / missing backend. */
  getMockCoupons() {
    return [
      {
        id: '1',
        code: 'TRIAL15',
        title: '15-Day Premium Trial',
        description: 'Get full access to all premium features for 15 days',
        discount: '100% OFF',
        validUntil: '2024-12-31',
        isRedeemed: false,
        isExpired: false,
        category: 'trial',
        terms: [
          'Valid for new users only',
          'One-time use per account',
          'Full access to premium features',
          'No credit card required',
        ],
      },
    ];
  },

  validateCouponCode(code: string) {
    if (!code || typeof code !== 'string') return false;
    return /^[A-Z0-9]{6,12}$/.test(code);
  },

  isCouponExpired(validUntil: string) {
    return new Date() > new Date(validUntil);
  },

  formatExpiryDate(validUntil: string) {
    return new Date(validUntil).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  getDaysUntilExpiry(validUntil: string) {
    const diffTime = new Date(validUntil).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
};
