import axios from 'axios';
import {
  shouldUseLocalStorage,
  localStorageAuth,
  localStorageBookings,
  localStorageSpecialists,
  localStorageServices,
  localStorageSuperAdmin,
  localStorageUserAccess,
  localStoragePlatformPricing
} from './localStorage';

/**
 * API wrapper that can use either real API or localStorage
 * Toggle by setting localStorage.setItem('USE_LOCAL_STORAGE', 'true')
 * or environment variable REACT_APP_USE_LOCAL_STORAGE=true
 */

// Auth API
export const authAPI = {
  register: async (userData) => {
    if (shouldUseLocalStorage()) {
      return localStorageAuth.register(userData);
    }
    const response = await axios.post('/api/auth/register', userData);
    return response.data;
  },

  login: async (email, password) => {
    if (shouldUseLocalStorage()) {
      return localStorageAuth.login(email, password);
    }
    const response = await axios.post('/api/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    if (shouldUseLocalStorage()) {
      const token = localStorage.getItem('token');
      const user = await localStorageAuth.getUser(token);
      return { user };
    }
    const response = await axios.get('/api/auth/me');
    return response.data;
  }
};

// Bookings API
export const bookingsAPI = {
  getAll: async (params) => {
    if (shouldUseLocalStorage()) {
      const token = localStorage.getItem('token');
      const decoded = JSON.parse(atob(token));
      const bookings = await localStorageBookings.getAll(decoded.userId, decoded.role, params);
      return { bookings };
    }
    const response = await axios.get('/api/bookings', { params });
    return response.data;
  },

  create: async (bookingData) => {
    if (shouldUseLocalStorage()) {
      const token = localStorage.getItem('token');
      const decoded = JSON.parse(atob(token));
      const booking = await localStorageBookings.create(bookingData, decoded.userId, decoded.role);
      return { message: 'Booking created successfully', booking };
    }
    const response = await axios.post('/api/bookings', bookingData);
    return response.data;
  },

  update: async (bookingId, updates) => {
    if (shouldUseLocalStorage()) {
      const token = localStorage.getItem('token');
      const decoded = JSON.parse(atob(token));
      const booking = await localStorageBookings.update(bookingId, updates, decoded.userId, decoded.role);
      return { message: 'Booking updated successfully', booking };
    }
    const response = await axios.put(`/api/bookings/${bookingId}`, updates);
    return response.data;
  },

  delete: async (bookingId) => {
    if (shouldUseLocalStorage()) {
      const token = localStorage.getItem('token');
      const decoded = JSON.parse(atob(token));
      return await localStorageBookings.delete(bookingId, decoded.userId, decoded.role);
    }
    const response = await axios.delete(`/api/bookings/${bookingId}`);
    return response.data;
  },

  getAvailableSlots: async (date) => {
    if (shouldUseLocalStorage()) {
      const availableSlots = await localStorageBookings.getAvailableSlots(date);
      return { availableSlots };
    }
    const response = await axios.get('/api/bookings/available-slots', { params: { date } });
    return response.data;
  }
};

// Specialists API
export const specialistsAPI = {
  getAll: async (businessType) => {
    if (shouldUseLocalStorage()) {
      const specialists = await localStorageSpecialists.getAll(businessType);
      return { specialists };
    }
    const params = businessType ? { business_type: businessType } : {};
    const response = await axios.get('/api/specialists', { params });
    return response.data;
  },

  getAvailability: async (specialistId, date) => {
    if (shouldUseLocalStorage()) {
      const availability = await localStorageSpecialists.getAvailability(specialistId, date);
      return { availability };
    }
    const response = await axios.get(`/api/specialists/${specialistId}/availability`, { params: { date } });
    return response.data;
  }
};

// Services API
export const servicesAPI = {
  getAll: async (businessType) => {
    if (shouldUseLocalStorage()) {
      const services = await localStorageServices.getAll(businessType);
      return { services };
    }
    const params = businessType ? { business_type: businessType } : {};
    const response = await axios.get('/api/services', { params });
    return response.data;
  }
};

// Super Admin API
export const superAdminAPI = {
  getUsers: async () => {
    if (shouldUseLocalStorage()) {
      const users = await localStorageSuperAdmin.getUsers();
      return { users };
    }
    const response = await axios.get('/api/super-admin/users');
    return response.data;
  },

  getPlatformConfig: async () => {
    if (shouldUseLocalStorage()) {
      const config = await localStorageSuperAdmin.getPlatformConfig();
      return { config };
    }
    const response = await axios.get('/api/super-admin/platform-config');
    return response.data;
  },

  getAnalytics: async () => {
    if (shouldUseLocalStorage()) {
      return await localStorageSuperAdmin.getAnalytics();
    }
    const response = await axios.get('/api/super-admin/analytics');
    return response.data;
  },

  grantAccess: async (userId, businessType, subscriptionStatus, monthlyPrice, subscriptionDuration) => {
    if (shouldUseLocalStorage()) {
      return await localStorageSuperAdmin.grantAccess(userId, businessType, subscriptionStatus, monthlyPrice, subscriptionDuration);
    }
    const response = await axios.post('/api/super-admin/grant-access', {
      userId,
      businessType,
      subscriptionStatus,
      monthlyPrice,
      subscriptionDuration
    });
    return response.data;
  },

  createUser: async (userData) => {
    if (shouldUseLocalStorage()) {
      return await localStorageSuperAdmin.createUser(userData);
    }
    const response = await axios.post('/api/super-admin/create-user', userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    if (shouldUseLocalStorage()) {
      return await localStorageSuperAdmin.deleteUser(userId);
    }
    const response = await axios.delete(`/api/super-admin/delete-user/${userId}`);
    return response.data;
  },

  updatePlatformConfig: async (businessType, price) => {
    if (shouldUseLocalStorage()) {
      return await localStorageSuperAdmin.updatePlatformConfig(businessType, price);
    }
    const response = await axios.put('/api/super-admin/platform-config', { businessType, price });
    return response.data;
  }
};

// User Access API (for admin business access)
export const userAccessAPI = {
  getPermissions: async () => {
    if (shouldUseLocalStorage()) {
      const permissions = await localStorageUserAccess.getPermissions();
      return { permissions };
    }
    const response = await axios.get('/api/user-access/permissions');
    return response.data;
  },

  getAvailableBusinessTypes: async () => {
    if (shouldUseLocalStorage()) {
      const businessTypes = await localStorageUserAccess.getAvailableBusinessTypes();
      return { businessTypes };
    }
    const response = await axios.get('/api/user-access/available-business-types');
    return response.data;
  }
};

// Platform Pricing API
export const platformPricingAPI = {
  getPricing: async () => {
    if (shouldUseLocalStorage()) {
      const pricing = await localStoragePlatformPricing.getPricing();
      return { pricing };
    }
    const response = await axios.get('/api/super-admin/platform-pricing');
    return response.data;
  }
};

// Helper to check current mode
export const isLocalStorageMode = shouldUseLocalStorage;

// Helper to toggle mode
export const setLocalStorageMode = (enabled) => {
  if (enabled) {
    localStorage.setItem('USE_LOCAL_STORAGE', 'true');
  } else {
    localStorage.removeItem('USE_LOCAL_STORAGE');
  }
  window.location.reload(); // Reload to apply changes
};
