import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';

export const authService = {
  register: (payload: unknown) => apiClient.post(API_ENDPOINTS.REGISTER, payload),
  login: (payload: unknown) => apiClient.post(API_ENDPOINTS.LOGIN, payload),
  updatePassword: (payload: unknown) => apiClient.post(API_ENDPOINTS.UPDATE_PASSWORD, payload),
  verifyOtp: (payload: unknown) => apiClient.post(API_ENDPOINTS.VERIFY_OTP, payload),
  getTopGainers: () => apiClient.get(API_ENDPOINTS.TOP_GAINERS),
  getSymbols: () => apiClient.get(API_ENDPOINTS.SYMBOLS_LIST),
  getNews: () => apiClient.get(API_ENDPOINTS.TOP_NEWS),
  createOrder: (payload: unknown) => apiClient.post(API_ENDPOINTS.CREATE_ORDER, payload),
  getOrderHistory: (payload: unknown) => apiClient.post(API_ENDPOINTS.ORDER_HISTORY, payload),
  acceptTnC: (payload: unknown) => apiClient.post(API_ENDPOINTS.ACCEPT_TNC, payload),
  getAutoOrderHistory: (payload: unknown) =>
    apiClient.post(API_ENDPOINTS.AUTO_ORDER_HISTORY, payload),
  getAllHoldings: () => apiClient.get(API_ENDPOINTS.GET_ALL_HOLDING),
  activeAccount: (payload: unknown) => apiClient.post(API_ENDPOINTS.ACTIVE_ACCOUNT, payload),
  getAllDemoHoldings: (payload: unknown) =>
    apiClient.post(API_ENDPOINTS.GET_ALL_DEMO_HOLDING, payload),
  getWatchlist: () => apiClient.get(API_ENDPOINTS.WATCHLIST),
  getWatchlistQuotes: (symbols?: string, tab?: string) =>
    apiClient.get(API_ENDPOINTS.WATCHLIST, { params: { symbols, tab } }),
  addToWatchlist: (payload: { symbol: string; name?: string; tab?: string }) =>
    apiClient.post(`${API_ENDPOINTS.WATCHLIST}/add`, payload),
  removeFromWatchlist: (payload: { symbol: string; tab?: string }) =>
    apiClient.post(`${API_ENDPOINTS.WATCHLIST}/remove`, payload),
  searchWatchlistSymbols: (q: string) =>
    apiClient.get(`${API_ENDPOINTS.WATCHLIST}/search`, { params: { q } }),
  createPaymentOrder: (payload: unknown) =>
    apiClient.post(API_ENDPOINTS.CREATE_PAYMENT_ORDER, payload),
  verifyPayment: (payload: unknown) => apiClient.post(API_ENDPOINTS.PAYMENT_VERIFY, payload),
  getAllPlans: () => apiClient.get(API_ENDPOINTS.GET_ALL_PLANS),
  getBalance: () => apiClient.get(API_ENDPOINTS.GET_BALANCE),
  getNiftyGainer: () => apiClient.get(API_ENDPOINTS.NIFTY_GAINER),
  getBankNiftyGainer: () => apiClient.get(API_ENDPOINTS.BANKNIFTY_GAINER),
  getBankNiftyLoser: () => apiClient.get(API_ENDPOINTS.BANKNIFTY_LOSER),
  getNiftyLoser: () => apiClient.get(API_ENDPOINTS.NIFTY_LOSER),
  getDashboard: () => apiClient.get(API_ENDPOINTS.DASHBOARD),
  predictStock: (params: { symbol: string; exchange?: string }) =>
    apiClient.get(API_ENDPOINTS.PREDICT, {
      params: { ...params, exchange: params.exchange || 'NSE' },
    }),
  getDailyRecommendations: () => apiClient.get(API_ENDPOINTS.DAILY_PICKS),
  growwUserProfile: () => apiClient.get(API_ENDPOINTS.GROWW_PROFILE),
  growwOrderList: () => apiClient.get(API_ENDPOINTS.GROWW_ORDER_LIST),
  marketStatus: () => apiClient.get(API_ENDPOINTS.MARKET_STATUS),
  // Broker Account Integration
  connectBroker: (payload: { broker: string; credentials?: Record<string, string> }) =>
    apiClient.post(API_ENDPOINTS.BROKER_CONNECT, payload),
  getBrokerStatus: () => apiClient.get(API_ENDPOINTS.BROKER_STATUS),
  disconnectBroker: () => apiClient.post(API_ENDPOINTS.BROKER_DISCONNECT, {}),
  // Automated Trading
  toggleAutoTrade: (enabled: boolean) =>
    apiClient.post(API_ENDPOINTS.AUTOTRADE_TOGGLE, { enabled }),
  getAutoTradeConfig: () => apiClient.get(API_ENDPOINTS.AUTOTRADE_CONFIG),
  updateAutoTradeConfig: (payload: unknown) =>
    apiClient.post(API_ENDPOINTS.AUTOTRADE_CONFIG, payload),
  getAutoTradePositions: () => apiClient.get(API_ENDPOINTS.AUTOTRADE_POSITIONS),
  getAutoTradeHistory: () => apiClient.get(API_ENDPOINTS.AUTOTRADE_HISTORY),
  emergencyExitAutoTrade: () => apiClient.post(API_ENDPOINTS.AUTOTRADE_EMERGENCY_EXIT, {}),
};
