import axios from 'axios';
import {
  shouldUseLocalStorage,
  localStorageAuth,
  localStorageBookings,
  localStorageSpecialists,
  localStorageServices,
  localStorageUsers,
  localStorageAvailability,
  localStorageSuperAdmin,
  localStorageUserAccess,
  localStoragePlatformPricing,
  localStoragePayments
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

  create: async (specialistData) => {
    if (shouldUseLocalStorage()) {
      const specialist = await localStorageSpecialists.create(specialistData);
      return { message: 'Specialist created successfully', specialist };
    }
    const response = await axios.post('/api/specialists', specialistData);
    return response.data;
  },

  update: async (specialistId, updates) => {
    if (shouldUseLocalStorage()) {
      const specialist = await localStorageSpecialists.update(specialistId, updates);
      return { message: 'Specialist updated successfully', specialist };
    }
    const response = await axios.put(`/api/specialists/${specialistId}`, updates);
    return response.data;
  },

  delete: async (specialistId) => {
    if (shouldUseLocalStorage()) {
      return await localStorageSpecialists.delete(specialistId);
    }
    const response = await axios.delete(`/api/specialists/${specialistId}`);
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
  },

  create: async (serviceData) => {
    if (shouldUseLocalStorage()) {
      const service = await localStorageServices.create(serviceData);
      return { message: 'Service created successfully', service };
    }
    const response = await axios.post('/api/services', serviceData);
    return response.data;
  },

  update: async (serviceId, updates) => {
    if (shouldUseLocalStorage()) {
      const service = await localStorageServices.update(serviceId, updates);
      return { message: 'Service updated successfully', service };
    }
    const response = await axios.put(`/api/services/${serviceId}`, updates);
    return response.data;
  },

  delete: async (serviceId) => {
    if (shouldUseLocalStorage()) {
      return await localStorageServices.delete(serviceId);
    }
    const response = await axios.delete(`/api/services/${serviceId}`);
    return response.data;
  }
};

// Users API (for admin creating/managing customers)
export const usersAPI = {
  getAll: async () => {
    if (shouldUseLocalStorage()) {
      const users = await localStorageUsers.getAll();
      return { users };
    }
    const response = await axios.get('/api/users');
    return response.data;
  },

  create: async (userData) => {
    if (shouldUseLocalStorage()) {
      const user = await localStorageUsers.create(userData);
      return { message: 'User created successfully', user };
    }
    const response = await axios.post('/api/users', userData);
    return response.data;
  },

  update: async (userId, updates) => {
    if (shouldUseLocalStorage()) {
      const user = await localStorageUsers.update(userId, updates);
      return { message: 'User updated successfully', user };
    }
    const response = await axios.put(`/api/users/${userId}`, updates);
    return response.data;
  },

  delete: async (userId) => {
    if (shouldUseLocalStorage()) {
      return await localStorageUsers.delete(userId);
    }
    const response = await axios.delete(`/api/users/${userId}`);
    return response.data;
  }
};

// Availability API
export const availabilityAPI = {
  getAll: async (params) => {
    if (shouldUseLocalStorage()) {
      // For localStorage mode, get all specialists' availability
      const availability = await localStorageAvailability.getAll(
        params?.business_type,
        params?.start_date,
        params?.end_date
      );
      return { availability };
    }
    const response = await axios.get('/api/specialist-availability', { params });
    return response.data;
  },

  getForSpecialist: async (specialistId, params) => {
    if (shouldUseLocalStorage()) {
      const availability = await localStorageAvailability.getForSpecialist(
        specialistId,
        params?.start_date,
        params?.end_date
      );
      return { availability };
    }
    const response = await axios.get('/api/specialist-availability', {
      params: { ...params, specialist_id: specialistId }
    });
    return response.data;
  },

  save: async (data) => {
    if (shouldUseLocalStorage()) {
      const availability = await localStorageAvailability.save(data.specialist_id, {
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        is_available: data.is_available
      });
      return { message: 'Availability saved successfully', availability };
    }
    const response = await axios.post('/api/specialist-availability', data);
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

// Payments API
export const paymentsAPI = {
  getSubscriptions: async (userId) => {
    if (shouldUseLocalStorage()) {
      const subscriptions = await localStoragePayments.getSubscriptions(userId);
      return { subscriptions };
    }
    const response = await axios.get('/api/payments/subscriptions');
    return response.data;
  },

  getPayments: async (userId) => {
    if (shouldUseLocalStorage()) {
      const payments = await localStoragePayments.getPayments(userId);
      return { payments };
    }
    const response = await axios.get('/api/payments/payments');
    return response.data;
  },

  createSubscription: async (subscriptionData) => {
    if (shouldUseLocalStorage()) {
      const subscription = await localStoragePayments.createSubscription(subscriptionData);
      return { subscription };
    }
    const response = await axios.post('/api/payments/subscribe', subscriptionData);
    return response.data;
  },

  cancelSubscription: async (subscriptionId) => {
    if (shouldUseLocalStorage()) {
      const subscription = await localStoragePayments.cancelSubscription(subscriptionId);
      return { subscription };
    }
    const response = await axios.post(`/api/payments/cancel-subscription/${subscriptionId}`);
    return response.data;
  },

  createPayment: async (paymentData) => {
    if (shouldUseLocalStorage()) {
      const payment = await localStoragePayments.createPayment(paymentData);
      return { payment };
    }
    const response = await axios.post('/api/payments/create-payment', paymentData);
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
