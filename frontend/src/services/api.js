import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh state
let isRefreshing = false;
let refreshSubscribers = [];

// Function to subscribe to token refresh
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Function to notify all subscribers when token is refreshed
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Check if token is about to expire (less than 5 minutes remaining)
const isTokenExpiringSoon = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    // Return true if less than 5 minutes remaining
    return timeUntilExpiry < 5 * 60 * 1000;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false;
  }
};

// Add request interceptor for authentication and token refresh
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Check if token is expiring soon and needs refresh
      if (refreshToken && isTokenExpiringSoon(token) && !isRefreshing) {
        isRefreshing = true;
        
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            { refreshToken }
          );
          
          const newToken = response.data.token || response.data.accessToken || response.data.data?.tokens?.accessToken;
          localStorage.setItem('token', newToken);
          localStorage.setItem('accessToken', newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
          
          isRefreshing = false;
          onTokenRefreshed(newToken);
        } catch (error) {
          isRefreshing = false;
          console.error('Token refresh failed:', error);
          // Continue with old token
        }
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('[api.js] 401 interceptor triggered for:', originalRequest.url);
      console.log('[api.js] Has refreshToken:', !!localStorage.getItem('refreshToken'));
      console.log('[api.js] Already retried:', !!originalRequest._retry);
      
      // If token expired and we have refresh token, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        
        if (isRefreshing) {
          console.log('[api.js] Already refreshing, queuing request');
          // If already refreshing, wait for it to complete
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axios(originalRequest));
            });
          });
        }
        
        isRefreshing = true;
        console.log('[api.js] Attempting token refresh...');
        
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            { refreshToken }
          );
          
          const newToken = response.data.token || response.data.accessToken || response.data.data?.tokens?.accessToken;
          localStorage.setItem('token', newToken);
          localStorage.setItem('accessToken', newToken);
          
          isRefreshing = false;
          onTokenRefreshed(newToken);
          
          console.log('[api.js] Token refresh successful, retrying request');
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          console.error('[api.js] Token refresh failed, logging out:', refreshError);
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
          
          const isAuthEndpoint = originalRequest.url?.includes('/auth/');
          const isOnLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
          
          if (!isOnLoginPage && !isAuthEndpoint) {
            console.log('[api.js] Redirecting to login page');
            window.location.href = '/';
          } else {
            console.log('[api.js] Already on login page or auth endpoint, not redirecting');
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        console.log('[api.js] No refresh token or already retried, logging out');
        // No refresh token or already tried refresh, log out
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        
        const isAuthEndpoint = originalRequest.url?.includes('/auth/');
        const isOnLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
        
        if (!isOnLoginPage && !isAuthEndpoint) {
          console.log('[api.js] Redirecting to login page');
          window.location.href = '/';
        } else {
          console.log('[api.js] Already on login page or auth endpoint, not redirecting');
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get user-friendly error messages
export const getErrorMessage = (error) => {
  // Network errors
  if (!error.response) {
    if (error.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  }
  
  // Server errors with response
  const status = error.response.status;
  const serverMessage = error.response.data?.message || error.response.data?.error;
  
  switch (status) {
    case 400:
      return serverMessage || 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return serverMessage || 'The requested resource was not found.';
    case 409:
      return serverMessage || 'This record already exists or conflicts with existing data.';
    case 422:
      return serverMessage || 'The data provided is invalid. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Our team has been notified. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'The server is temporarily unavailable. Please try again in a few minutes.';
    default:
      return serverMessage || `An error occurred (${status}). Please try again.`;
  }
};

// Auth services
export const authService = {
  login: async (credentials) => {
    try {
      console.log('authService.login called with:', { email: credentials.email, password: credentials.password ? '***' : 'empty' });
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Making POST request to /auth/login...');
      
      const response = await api.post('/auth/login', credentials);
      
      console.log('✅ Login API response received');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('Response data structure:', JSON.stringify(response.data, null, 2));
      
      // Backend response structure: { success: true, token: "...", data: { user: {...}, tokens: {...} } }
      const { token, data } = response.data;
      const user = data?.user;
      const tokens = data?.tokens || {};
      const refreshToken = tokens.refreshToken || data.refreshToken;
      
      console.log('Extracted token:', token ? 'YES' : 'NO');
      console.log('Extracted refreshToken:', refreshToken ? 'YES' : 'NO');
      console.log('Extracted data:', data);
      console.log('Extracted user:', user);
      
      if (!token || !user) {
        console.error('❌ Invalid response structure:', response.data);
        throw new Error('Invalid login response structure');
      }
      
      // Store token, refresh token, and user data
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('✅ Login successful, stored token and user data');
      
      return { token, refreshToken, user, tokens };
    } catch (error) {
      console.error('authService.login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove items even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    }
  },
};

// Budget services
export const budgetService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/budgets', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (budget) => {
    try {
      const response = await api.post('/budgets', budget);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, budget) => {
    try {
      const response = await api.put(`/budgets/${id}`, budget);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Trade Spend services
export const tradeSpendService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/trade-spends', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/trade-spends/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (tradeSpend) => {
    try {
      const response = await api.post('/trade-spends', tradeSpend);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, tradeSpend) => {
    try {
      const response = await api.put(`/trade-spends/${id}`, tradeSpend);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/trade-spends/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Promotion services
export const promotionService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/promotions', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/promotions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (promotion) => {
    try {
      const response = await api.post('/promotions', promotion);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, promotion) => {
    try {
      const response = await api.put(`/promotions/${id}`, promotion);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/promotions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Customer services
export const customerService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/customers', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (customer) => {
    try {
      const response = await api.post('/customers', customer);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, customer) => {
    try {
      const response = await api.put(`/customers/${id}`, customer);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Product services
export const productService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (product) => {
    try {
      const response = await api.post('/products', product);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, product) => {
    try {
      const response = await api.put(`/products/${id}`, product);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Analytics services
export const analyticsService = {
  getSummary: async (params) => {
    try {
      const response = await api.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getDashboard: async (params) => {
    try {
      const response = await api.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getReports: async (params) => {
    try {
      const response = await api.get('/analytics/reports', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getBudgetAnalytics: async (params) => {
    try {
      const response = await api.get('/analytics/budgets', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getPromotionAnalytics: async (params) => {
    try {
      const response = await api.get('/analytics/promotions', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getCustomerAnalytics: async (params) => {
    try {
      const response = await api.get('/analytics/customers', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getProductAnalytics: async (params) => {
    try {
      const response = await api.get('/analytics/products', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getAll: async (params) => {
    try {
      const response = await api.get('/analytics/dashboard', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Currency services
export const currencyService = {
  getAll: async () => {
    try {
      const response = await api.get('/analytics/currencies');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  convert: async (amount, from, to) => {
    try {
      const response = await api.get('/currencies/convert', {
        params: { amount, from, to }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Settings services
export const settingsService = {
  get: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (settings) => {
    try {
      const response = await api.put('/settings', settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// User services
export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateProfile: async (profile) => {
    try {
      const response = await api.put('/users/profile', profile);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Trading Terms services
export const tradingTermsService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/trading-terms', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/trading-terms/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (tradingTerm) => {
    try {
      const response = await api.post('/trading-terms', tradingTerm);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id, tradingTerm) => {
    try {
      const response = await api.put(`/trading-terms/${id}`, tradingTerm);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/trading-terms/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Forecasting services
export const forecastingService = {
  getProducts: async () => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getCustomers: async () => {
    try {
      const response = await api.get('/customers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  generateSalesForecast: async (filters) => {
    try {
      const response = await api.post('/forecasting/generate', filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  generateDemandForecast: async (params) => {
    try {
      const response = await api.post('/forecasting/demand', params);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  generateBudgetForecast: async (params) => {
    try {
      const response = await api.post('/forecasting/budget', params);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  exportForecast: async (type, filters) => {
    try {
      const response = await api.post(`/forecasting/export/${type}`, filters, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const aiCopilotService = {
  ask: async (question, context) => {
    const response = await api.post('/ai-copilot/ask', { question, context });
    return response.data;
  },
  suggestActions: async () => {
    const response = await api.post('/ai-copilot/suggest-actions', {});
    return response.data;
  },
};

export const smartApprovalsService = {
  evaluate: async (approvalId) => {
    const response = await api.post('/smart-approvals/evaluate', { approvalId });
    return response.data;
  },
  bulkEvaluate: async () => {
    const response = await api.post('/smart-approvals/bulk-evaluate', {});
    return response.data;
  },
};

export const deductionMatchService = {
  autoMatch: async () => {
    const response = await api.post('/deduction-match/auto-match', {});
    return response.data;
  },
  summary: async () => {
    const response = await api.get('/deduction-match/summary');
    return response.data;
  },
};

export const postEventAnalysisService = {
  getAnalysis: async (promotionId) => {
    const response = await api.get(`/post-event-analysis/${promotionId}`);
    return response.data;
  },
  compare: async () => {
    const response = await api.get('/post-event-analysis/compare');
    return response.data;
  },
};

export const anomalyDetectionService = {
  scan: async () => {
    const response = await api.get('/anomaly-detection/scan');
    return response.data;
  },
};

export const promotionConflictService = {
  check: async (params) => {
    const response = await api.post('/promotion-conflict/check', params);
    return response.data;
  },
};

export const baselineService = {
  getAll: async (params) => {
    const response = await api.get('/baselines', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/baselines/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/baselines', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/baselines/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/baselines/${id}`);
    return response.data;
  },
  calculate: async (id) => {
    const response = await api.post(`/baselines/${id}/calculate`);
    return response.data;
  },
  decompose: async (id, data) => {
    const response = await api.post(`/baselines/${id}/decompose`, data);
    return response.data;
  },
  approve: async (id) => {
    const response = await api.post(`/baselines/${id}/approve`);
    return response.data;
  },
  getDecompositions: async (id) => {
    const response = await api.get(`/baselines/${id}/decompositions`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/baselines/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/baselines/options');
    return response.data;
  },
};

export const accrualService = {
  getAll: async (params) => {
    const response = await api.get('/accruals', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/accruals/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/accruals', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/accruals/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/accruals/${id}`);
    return response.data;
  },
  calculate: async (id) => {
    const response = await api.post(`/accruals/${id}/calculate`);
    return response.data;
  },
  post: async (id) => {
    const response = await api.post(`/accruals/${id}/post`);
    return response.data;
  },
  reverse: async (id, data) => {
    const response = await api.post(`/accruals/${id}/reverse`, data);
    return response.data;
  },
  approve: async (id) => {
    const response = await api.post(`/accruals/${id}/approve`);
    return response.data;
  },
  getJournals: async (id) => {
    const response = await api.get(`/accruals/${id}/journals`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/accruals/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/accruals/options');
    return response.data;
  },
};

export const settlementService = {
  getAll: async (params) => {
    const response = await api.get('/settlements', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/settlements/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/settlements', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/settlements/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/settlements/${id}`);
    return response.data;
  },
  process: async (id) => {
    const response = await api.post(`/settlements/${id}/process`);
    return response.data;
  },
  approve: async (id, data) => {
    const response = await api.post(`/settlements/${id}/approve`, data);
    return response.data;
  },
  reject: async (id, data) => {
    const response = await api.post(`/settlements/${id}/reject`, data);
    return response.data;
  },
  pay: async (id, data) => {
    const response = await api.post(`/settlements/${id}/pay`, data);
    return response.data;
  },
  getLines: async (id) => {
    const response = await api.get(`/settlements/${id}/lines`);
    return response.data;
  },
  getPayments: async (id) => {
    const response = await api.get(`/settlements/${id}/payments`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/settlements/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/settlements/options');
    return response.data;
  },
};

export const pnlService = {
  getAll: async (params) => {
    const response = await api.get('/pnl', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/pnl/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/pnl', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/pnl/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/pnl/${id}`);
    return response.data;
  },
  generate: async (id) => {
    const response = await api.post(`/pnl/${id}/generate`);
    return response.data;
  },
  getLineItems: async (id) => {
    const response = await api.get(`/pnl/${id}/line-items`);
    return response.data;
  },
  getLiveByCustomer: async (params) => {
    const response = await api.get('/pnl/live-by-customer', { params });
    return response.data;
  },
  getLiveByPromotion: async (params) => {
    const response = await api.get('/pnl/live-by-promotion', { params });
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/pnl/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/pnl/options');
    return response.data;
  },
};

export const budgetAllocationService = {
  getAll: async (params) => {
    const response = await api.get('/budget-allocations', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/budget-allocations/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/budget-allocations', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/budget-allocations/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/budget-allocations/${id}`);
    return response.data;
  },
  distribute: async (id, overrides) => {
    const response = await api.post(`/budget-allocations/${id}/distribute`, { overrides });
    return response.data;
  },
  lock: async (id) => {
    const response = await api.post(`/budget-allocations/${id}/lock`);
    return response.data;
  },
  unlock: async (id) => {
    const response = await api.post(`/budget-allocations/${id}/unlock`);
    return response.data;
  },
  refreshUtilization: async (id) => {
    const response = await api.post(`/budget-allocations/${id}/refresh-utilization`);
    return response.data;
  },
  getLines: async (id) => {
    const response = await api.get(`/budget-allocations/${id}/lines`);
    return response.data;
  },
  updateLine: async (id, lineId, data) => {
    const response = await api.put(`/budget-allocations/${id}/lines/${lineId}`, data);
    return response.data;
  },
  getWaterfall: async (params) => {
    const response = await api.get('/budget-allocations/waterfall', { params });
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/budget-allocations/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/budget-allocations/options');
    return response.data;
  },
};

export const demandSignalService = {
  getAll: async (params) => {
    const response = await api.get('/demand-signals', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/demand-signals/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/demand-signals', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/demand-signals/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/demand-signals/${id}`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/demand-signals/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/demand-signals/options');
    return response.data;
  },
  getTrends: async (params) => {
    const response = await api.get('/demand-signals/trends', { params });
    return response.data;
  },
  getAnomalies: async (params) => {
    const response = await api.get('/demand-signals/anomalies', { params });
    return response.data;
  },
  getSources: async (params) => {
    const response = await api.get('/demand-signals/sources/list', { params });
    return response.data;
  },
  getSourceById: async (id) => {
    const response = await api.get(`/demand-signals/sources/${id}`);
    return response.data;
  },
  createSource: async (data) => {
    const response = await api.post('/demand-signals/sources', data);
    return response.data;
  },
  updateSource: async (id, data) => {
    const response = await api.put(`/demand-signals/sources/${id}`, data);
    return response.data;
  },
  deleteSource: async (id) => {
    const response = await api.delete(`/demand-signals/sources/${id}`);
    return response.data;
  },
};

export const scenarioService = {
  getAll: async (params) => {
    const response = await api.get('/scenarios', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/scenarios/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/scenarios', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/scenarios/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/scenarios/${id}`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/scenarios/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/scenarios/options');
    return response.data;
  },
  compare: async (scenarioA, scenarioB) => {
    const response = await api.get('/scenarios/compare', { params: { scenario_a: scenarioA, scenario_b: scenarioB } });
    return response.data;
  },
  simulate: async (id) => {
    const response = await api.post(`/scenarios/${id}/simulate`);
    return response.data;
  },
  getVariables: async (id) => {
    const response = await api.get(`/scenarios/${id}/variables`);
    return response.data;
  },
  addVariable: async (id, data) => {
    const response = await api.post(`/scenarios/${id}/variables`, data);
    return response.data;
  },
  updateVariable: async (id, varId, data) => {
    const response = await api.put(`/scenarios/${id}/variables/${varId}`, data);
    return response.data;
  },
  deleteVariable: async (id, varId) => {
    const response = await api.delete(`/scenarios/${id}/variables/${varId}`);
    return response.data;
  },
  getResults: async (id) => {
    const response = await api.get(`/scenarios/${id}/results`);
    return response.data;
  },
};

export const promotionOptimizerService = {
  getAll: async (params) => {
    const response = await api.get('/promotion-optimizer', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/promotion-optimizer/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/promotion-optimizer', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/promotion-optimizer/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/promotion-optimizer/${id}`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/promotion-optimizer/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/promotion-optimizer/options');
    return response.data;
  },
  optimize: async (id) => {
    const response = await api.post(`/promotion-optimizer/${id}/optimize`);
    return response.data;
  },
  getRecommendations: async (id) => {
    const response = await api.get(`/promotion-optimizer/${id}/recommendations`);
    return response.data;
  },
  updateRecommendationAction: async (id, recId, data) => {
    const response = await api.put(`/promotion-optimizer/${id}/recommendations/${recId}/action`, data);
    return response.data;
  },
  getConstraints: async (id) => {
    const response = await api.get(`/promotion-optimizer/${id}/constraints`);
    return response.data;
  },
  addConstraint: async (id, data) => {
    const response = await api.post(`/promotion-optimizer/${id}/constraints`, data);
    return response.data;
  },
  deleteConstraint: async (id, conId) => {
    const response = await api.delete(`/promotion-optimizer/${id}/constraints/${conId}`);
    return response.data;
  },
};

export const tradeCalendarService = {
  getAll: async (params) => {
    const response = await api.get('/trade-calendar', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/trade-calendar/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/trade-calendar', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/trade-calendar/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/trade-calendar/${id}`);
    return response.data;
  },
  syncPromotion: async (id) => {
    const response = await api.post(`/trade-calendar/${id}/sync-promotion`);
    return response.data;
  },
  checkConstraints: async (data) => {
    const response = await api.post('/trade-calendar/check-constraints', data);
    return response.data;
  },
  getTimeline: async (params) => {
    const response = await api.get('/trade-calendar/timeline', { params });
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/trade-calendar/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/trade-calendar/options');
    return response.data;
  },
  getConstraints: async (params) => {
    const response = await api.get('/trade-calendar/constraints/list', { params });
    return response.data;
  },
  getConstraintById: async (id) => {
    const response = await api.get(`/trade-calendar/constraints/${id}`);
    return response.data;
  },
  createConstraint: async (data) => {
    const response = await api.post('/trade-calendar/constraints', data);
    return response.data;
  },
  updateConstraint: async (id, data) => {
    const response = await api.put(`/trade-calendar/constraints/${id}`, data);
    return response.data;
  },
  deleteConstraint: async (id) => {
    const response = await api.delete(`/trade-calendar/constraints/${id}`);
    return response.data;
  },
};

export const customer360Service = {
  getSummary: async () => {
    const response = await api.get('/customer-360/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/customer-360/options');
    return response.data;
  },
  getProfiles: async (params) => {
    const response = await api.get('/customer-360/profiles', { params });
    return response.data;
  },
  getProfileById: async (id) => {
    const response = await api.get(`/customer-360/profiles/${id}`);
    return response.data;
  },
  createProfile: async (data) => {
    const response = await api.post('/customer-360/profiles', data);
    return response.data;
  },
  updateProfile: async (id, data) => {
    const response = await api.put(`/customer-360/profiles/${id}`, data);
    return response.data;
  },
  deleteProfile: async (id) => {
    const response = await api.delete(`/customer-360/profiles/${id}`);
    return response.data;
  },
  getInsights: async (profileId, params) => {
    const response = await api.get(`/customer-360/profiles/${profileId}/insights`, { params });
    return response.data;
  },
  createInsight: async (data) => {
    const response = await api.post('/customer-360/insights', data);
    return response.data;
  },
  deleteInsight: async (id) => {
    const response = await api.delete(`/customer-360/insights/${id}`);
    return response.data;
  },
  recalculate: async (profileId) => {
    const response = await api.post(`/customer-360/profiles/${profileId}/recalculate`);
    return response.data;
  },
  getLeaderboard: async (params) => {
    const response = await api.get('/customer-360/leaderboard', { params });
    return response.data;
  },
  getAtRisk: async (params) => {
    const response = await api.get('/customer-360/at-risk', { params });
    return response.data;
  },
};

export const advancedReportingService = {
  getSummary: async () => {
    const response = await api.get('/advanced-reporting/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/advanced-reporting/options');
    return response.data;
  },
  getTemplates: async (params) => {
    const response = await api.get('/advanced-reporting/templates', { params });
    return response.data;
  },
  getTemplateById: async (id) => {
    const response = await api.get(`/advanced-reporting/templates/${id}`);
    return response.data;
  },
  createTemplate: async (data) => {
    const response = await api.post('/advanced-reporting/templates', data);
    return response.data;
  },
  updateTemplate: async (id, data) => {
    const response = await api.put(`/advanced-reporting/templates/${id}`, data);
    return response.data;
  },
  deleteTemplate: async (id) => {
    const response = await api.delete(`/advanced-reporting/templates/${id}`);
    return response.data;
  },
  runTemplate: async (id, data) => {
    const response = await api.post(`/advanced-reporting/templates/${id}/run`, data || {});
    return response.data;
  },
  getReports: async (params) => {
    const response = await api.get('/advanced-reporting/reports', { params });
    return response.data;
  },
  getReportById: async (id) => {
    const response = await api.get(`/advanced-reporting/reports/${id}`);
    return response.data;
  },
  updateReport: async (id, data) => {
    const response = await api.put(`/advanced-reporting/reports/${id}`, data);
    return response.data;
  },
  deleteReport: async (id) => {
    const response = await api.delete(`/advanced-reporting/reports/${id}`);
    return response.data;
  },
  toggleFavorite: async (id) => {
    const response = await api.post(`/advanced-reporting/reports/${id}/toggle-favorite`);
    return response.data;
  },
  getSchedules: async (params) => {
    const response = await api.get('/advanced-reporting/schedules', { params });
    return response.data;
  },
  getScheduleById: async (id) => {
    const response = await api.get(`/advanced-reporting/schedules/${id}`);
    return response.data;
  },
  createSchedule: async (data) => {
    const response = await api.post('/advanced-reporting/schedules', data);
    return response.data;
  },
  updateSchedule: async (id, data) => {
    const response = await api.put(`/advanced-reporting/schedules/${id}`, data);
    return response.data;
  },
  deleteSchedule: async (id) => {
    const response = await api.delete(`/advanced-reporting/schedules/${id}`);
    return response.data;
  },
  getCrossModuleReport: async (params) => {
    const response = await api.get('/advanced-reporting/cross-module', { params });
    return response.data;
  },
};

export const revenueGrowthService = {
  getSummary: async () => {
    const response = await api.get('/revenue-growth/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/revenue-growth/options');
    return response.data;
  },
  getInitiatives: async (params) => {
    const response = await api.get('/revenue-growth/initiatives', { params });
    return response.data;
  },
  getInitiativeById: async (id) => {
    const response = await api.get(`/revenue-growth/initiatives/${id}`);
    return response.data;
  },
  createInitiative: async (data) => {
    const response = await api.post('/revenue-growth/initiatives', data);
    return response.data;
  },
  updateInitiative: async (id, data) => {
    const response = await api.put(`/revenue-growth/initiatives/${id}`, data);
    return response.data;
  },
  deleteInitiative: async (id) => {
    const response = await api.delete(`/revenue-growth/initiatives/${id}`);
    return response.data;
  },
  getPricing: async (params) => {
    const response = await api.get('/revenue-growth/pricing', { params });
    return response.data;
  },
  getPricingById: async (id) => {
    const response = await api.get(`/revenue-growth/pricing/${id}`);
    return response.data;
  },
  createPricing: async (data) => {
    const response = await api.post('/revenue-growth/pricing', data);
    return response.data;
  },
  updatePricing: async (id, data) => {
    const response = await api.put(`/revenue-growth/pricing/${id}`, data);
    return response.data;
  },
  deletePricing: async (id) => {
    const response = await api.delete(`/revenue-growth/pricing/${id}`);
    return response.data;
  },
  getMixAnalyses: async (params) => {
    const response = await api.get('/revenue-growth/mix', { params });
    return response.data;
  },
  createMixAnalysis: async (data) => {
    const response = await api.post('/revenue-growth/mix', data);
    return response.data;
  },
  deleteMixAnalysis: async (id) => {
    const response = await api.delete(`/revenue-growth/mix/${id}`);
    return response.data;
  },
  getGrowthTracking: async (params) => {
    const response = await api.get('/revenue-growth/growth-tracking', { params });
    return response.data;
  },
  createGrowthTracker: async (data) => {
    const response = await api.post('/revenue-growth/growth-tracking', data);
    return response.data;
  },
  deleteGrowthTracker: async (id) => {
    const response = await api.delete(`/revenue-growth/growth-tracking/${id}`);
    return response.data;
  },
};

export const executiveKpiService = {
  getSummary: async () => {
    const response = await api.get('/executive-kpi/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/executive-kpi/options');
    return response.data;
  },
  getDefinitions: async (params) => {
    const response = await api.get('/executive-kpi/definitions', { params });
    return response.data;
  },
  createDefinition: async (data) => {
    const response = await api.post('/executive-kpi/definitions', data);
    return response.data;
  },
  updateDefinition: async (id, data) => {
    const response = await api.put(`/executive-kpi/definitions/${id}`, data);
    return response.data;
  },
  deleteDefinition: async (id) => {
    const response = await api.delete(`/executive-kpi/definitions/${id}`);
    return response.data;
  },
  getTargets: async (params) => {
    const response = await api.get('/executive-kpi/targets', { params });
    return response.data;
  },
  createTarget: async (data) => {
    const response = await api.post('/executive-kpi/targets', data);
    return response.data;
  },
  deleteTarget: async (id) => {
    const response = await api.delete(`/executive-kpi/targets/${id}`);
    return response.data;
  },
  getActuals: async (params) => {
    const response = await api.get('/executive-kpi/actuals', { params });
    return response.data;
  },
  createActual: async (data) => {
    const response = await api.post('/executive-kpi/actuals', data);
    return response.data;
  },
  deleteActual: async (id) => {
    const response = await api.delete(`/executive-kpi/actuals/${id}`);
    return response.data;
  },
  getScorecards: async (params) => {
    const response = await api.get('/executive-kpi/scorecards', { params });
    return response.data;
  },
  getScorecardById: async (id) => {
    const response = await api.get(`/executive-kpi/scorecards/${id}`);
    return response.data;
  },
  createScorecard: async (data) => {
    const response = await api.post('/executive-kpi/scorecards', data);
    return response.data;
  },
  updateScorecard: async (id, data) => {
    const response = await api.put(`/executive-kpi/scorecards/${id}`, data);
    return response.data;
  },
  deleteScorecard: async (id) => {
    const response = await api.delete(`/executive-kpi/scorecards/${id}`);
    return response.data;
  },
};

export const notificationCenterService = {
  getSummary: async () => {
    const response = await api.get('/notification-center/summary');
    return response.data;
  },
  getOptions: async () => {
    const response = await api.get('/notification-center/options');
    return response.data;
  },
  getNotifications: async (params) => {
    const response = await api.get('/notification-center/notifications', { params });
    return response.data;
  },
  createNotification: async (data) => {
    const response = await api.post('/notification-center/notifications', data);
    return response.data;
  },
  markRead: async (id) => {
    const response = await api.put(`/notification-center/notifications/${id}/read`);
    return response.data;
  },
  dismiss: async (id) => {
    const response = await api.put(`/notification-center/notifications/${id}/dismiss`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await api.put('/notification-center/notifications/mark-all-read');
    return response.data;
  },
  deleteNotification: async (id) => {
    const response = await api.delete(`/notification-center/notifications/${id}`);
    return response.data;
  },
  getRules: async (params) => {
    const response = await api.get('/notification-center/rules', { params });
    return response.data;
  },
  createRule: async (data) => {
    const response = await api.post('/notification-center/rules', data);
    return response.data;
  },
  updateRule: async (id, data) => {
    const response = await api.put(`/notification-center/rules/${id}`, data);
    return response.data;
  },
  deleteRule: async (id) => {
    const response = await api.delete(`/notification-center/rules/${id}`);
    return response.data;
  },
  getHistory: async (params) => {
    const response = await api.get('/notification-center/history', { params });
    return response.data;
  },
  createAlert: async (data) => {
    const response = await api.post('/notification-center/history', data);
    return response.data;
  },
  acknowledgeAlert: async (id) => {
    const response = await api.put(`/notification-center/history/${id}/acknowledge`);
    return response.data;
  },
  resolveAlert: async (id) => {
    const response = await api.put(`/notification-center/history/${id}/resolve`);
    return response.data;
  },
  deleteAlert: async (id) => {
    const response = await api.delete(`/notification-center/history/${id}`);
    return response.data;
  },
};

export default api;
