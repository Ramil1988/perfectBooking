import axios from 'axios';
import {
  shouldUseLocalStorage,
  localStorageAuth,
  localStorageBookings,
  localStorageSpecialists,
  localStorageServices
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
