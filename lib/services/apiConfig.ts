/** Flask / Socket.IO host without trailing path (same as RN hard-coded host pattern). */
export const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:6001'
).replace(/\/$/, '');

/** REST base for routes mirrored from `brifix_investors_frontend/src/api/AuthService.js`. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? `${API_ORIGIN}/api/v1`
).replace(/\/$/, '');

/** Socket.IO server URL (defaults to same origin as REST). */
export const SOCKET_URL = (
  process.env.NEXT_PUBLIC_SOCKET_URL ?? API_ORIGIN
).replace(/\/$/, '');

/** Mounted at app root in Flask, not under `/api/v1`. */
export const CHART_DATA_URL = `${API_ORIGIN}/chart-data`;

/**
 * Coupon microservice base (RN used `http://...:3000/v3`).
 * Leave unset to skip coupon calls except `getCoupons` mock fallback.
 */
export const COUPON_API_BASE_URL = (process.env.NEXT_PUBLIC_COUPON_API_BASE_URL ?? '').replace(
  /\/$/,
  ''
);

export const API_ENDPOINTS = {
  REGISTER: '/users/register',
  LOGIN: '/users/login',
  UPDATE_PASSWORD: '/users/forgot-password',
  VERIFY_OTP: '/verifyOtp',
  TOP_GAINERS: '/topGainner',
  SYMBOLS_LIST: '/symbolsList',
  TOP_NEWS: '/top_news',
  CREATE_ORDER: '/createOrder',
  ORDER_HISTORY: '/orderHistory',
  ACCEPT_TNC: '/acceptTnC',
  AUTO_ORDER_HISTORY: '/autoOrderHistory',
  GET_ALL_HOLDING: '/getAllHolding',
  ACTIVE_ACCOUNT: '/activeAccount',
  GET_ALL_DEMO_HOLDING: '/getAllDemoHolding',
  WATCHLIST: '/watchlist',
  CREATE_PAYMENT_ORDER: '/create-order',
  PAYMENT_VERIFY: '/payment-verify',
  GET_ALL_PLANS: '/getAllPlans',
  GET_BALANCE: '/getBalance',
  NIFTY_GAINER: '/top/nifty_gainner',
  BANKNIFTY_GAINER: '/top/banknifty_gainner',
  BANKNIFTY_LOSER: '/top/banknifty_losser',
  NIFTY_LOSER: '/top/nifty_losser',
  DASHBOARD: '/top/get_top_gain_loss_dashboard',
  PREDICT: '/predict',
  DAILY_PICKS: '/predict/daily-picks',
  GROWW_PROFILE: '/groww/groww_user_profile',
  GROWW_ORDER_LIST: '/groww/getOrderList',
  MARKET_STATUS: '/market_status',
};
