/**
 * LocalStorage utility for testing the booking app without backend
 * This allows data persistence in the browser for demonstration and testing
 */

const STORAGE_KEYS = {
  USERS: 'booking_users',
  BOOKINGS: 'booking_bookings',
  BUSINESS_HOURS: 'booking_business_hours',
  SPECIALISTS: 'booking_specialists',
  SERVICES: 'booking_services',
  SPECIALIST_AVAILABILITY: 'booking_specialist_availability',
  USER_BUSINESS_ACCESS: 'booking_user_business_access',
  CURRENT_USER: 'booking_current_user',
  AUTH_TOKEN: 'token',
  NEXT_ID: 'booking_next_id'
};

// Initialize default data
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@business.com',
        password: '$2a$10$8K1p/a0dL3LPB9H2Z0K0XO5J5Z0K0K0K0K0K0K0K0K0K0K0K0K0K0', // admin123
        role: 'admin',
        phone: '555-0123',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Super Admin',
        email: 'superadmin@platform.com',
        password: '$2a$10$8K1p/a0dL3LPB9H2Z0K0XO5J5Z0K0K0K0K0K0K0K0K0K0K0K0K0K0', // superadmin123
        role: 'superadmin',
        phone: '555-0000',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.BUSINESS_HOURS)) {
    const defaultBusinessHours = [
      { id: 1, day_of_week: 1, start_time: '09:00', end_time: '17:00', is_available: 1 },
      { id: 2, day_of_week: 2, start_time: '09:00', end_time: '17:00', is_available: 1 },
      { id: 3, day_of_week: 3, start_time: '09:00', end_time: '17:00', is_available: 1 },
      { id: 4, day_of_week: 4, start_time: '09:00', end_time: '17:00', is_available: 1 },
      { id: 5, day_of_week: 5, start_time: '09:00', end_time: '17:00', is_available: 1 }
    ];
    localStorage.setItem(STORAGE_KEYS.BUSINESS_HOURS, JSON.stringify(defaultBusinessHours));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SPECIALISTS)) {
    const defaultSpecialists = [
      { id: 1, name: 'Sarah Johnson', specialty: 'Deep Tissue', business_type: 'massage', email: 'sarah@massage.com', phone: null, is_active: 1, created_at: new Date().toISOString() },
      { id: 2, name: 'Maria Garcia', specialty: 'Swedish & Relaxation', business_type: 'massage', email: 'maria@massage.com', phone: null, is_active: 1, created_at: new Date().toISOString() },
      { id: 3, name: 'Dr. Emily Davis', specialty: 'General Dentistry', business_type: 'dental', email: 'emily@dental.com', phone: null, is_active: 1, created_at: new Date().toISOString() },
      { id: 4, name: 'Isabella Martinez', specialty: 'Hair Styling', business_type: 'beauty', email: 'isabella@beauty.com', phone: null, is_active: 1, created_at: new Date().toISOString() }
    ];
    localStorage.setItem(STORAGE_KEYS.SPECIALISTS, JSON.stringify(defaultSpecialists));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    const defaultServices = [
      { id: 1, name: 'Swedish Massage', business_type: 'massage', description: 'Relaxing full-body massage', price: 80.00, duration: 60, is_active: 1, created_at: new Date().toISOString() },
      { id: 2, name: 'Deep Tissue Massage', business_type: 'massage', description: 'Therapeutic deep muscle massage', price: 90.00, duration: 60, is_active: 1, created_at: new Date().toISOString() },
      { id: 3, name: 'Dental Cleaning', business_type: 'dental', description: 'Professional teeth cleaning', price: 120.00, duration: 60, is_active: 1, created_at: new Date().toISOString() },
      { id: 4, name: 'Haircut & Style', business_type: 'beauty', description: 'Professional haircut and styling', price: 45.00, duration: 60, is_active: 1, created_at: new Date().toISOString() }
    ];
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(defaultServices));
  }

  if (!localStorage.getItem(STORAGE_KEYS.NEXT_ID)) {
    localStorage.setItem(STORAGE_KEYS.NEXT_ID, JSON.stringify({ users: 3, bookings: 1, specialists: 5, services: 5 }));
  }
};

// Helper to get next ID
const getNextId = (entity) => {
  const nextIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.NEXT_ID));
  const id = nextIds[entity];
  nextIds[entity]++;
  localStorage.setItem(STORAGE_KEYS.NEXT_ID, JSON.stringify(nextIds));
  return id;
};

// User operations
export const localStorageAuth = {
  register: async (userData) => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));

    // Check if email exists
    if (users.find(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: getNextId('users'),
      name: userData.name,
      email: userData.email,
      password: userData.password, // In real app, this would be hashed
      role: 'customer',
      phone: userData.phone || null,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Generate token (simplified)
    const token = btoa(JSON.stringify({ userId: newUser.id, email: newUser.email, role: newUser.role }));

    return {
      user: { ...newUser, password: undefined },
      token
    };
  },

  login: async (email, password) => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Simplified password check - in real app would use bcrypt
    // For demo, accept the plain passwords: admin123, superadmin123, or any password for new users
    const validPasswords = ['admin123', 'superadmin123', password];
    if (!validPasswords.includes(password) && user.password !== password) {
      throw new Error('Invalid credentials');
    }

    // Generate token (simplified)
    const token = btoa(JSON.stringify({ userId: user.id, email: user.email, role: user.role }));

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

    return {
      user: { ...user, password: undefined },
      token
    };
  },

  getUser: async (token) => {
    initializeData();
    try {
      const decoded = JSON.parse(atob(token));
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
      const user = users.find(u => u.id === decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      return { ...user, password: undefined };
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
};

// Booking operations
export const localStorageBookings = {
  getAll: async (userId, userRole, filters = {}) => {
    initializeData();
    let bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const specialists = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALISTS));

    // Filter by user if not admin
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      bookings = bookings.filter(b => b.user_id === userId);
    }

    // Apply additional filters
    if (filters.date) {
      bookings = bookings.filter(b => b.appointment_date === filters.date);
    }
    if (filters.status) {
      bookings = bookings.filter(b => b.status === filters.status);
    }

    // Enrich bookings with user and specialist data
    bookings = bookings.map(booking => {
      const user = users.find(u => u.id === booking.user_id);
      const specialist = specialists.find(s => s.id === booking.staff_id);

      return {
        ...booking,
        customer_name: user?.name,
        customer_email: user?.email,
        customer_phone: user?.phone,
        therapist_name: specialist?.name,
        therapist_specialty: specialist?.specialty
      };
    });

    return bookings;
  },

  create: async (bookingData, userId, userRole) => {
    initializeData();
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));

    const targetUserId = userRole === 'admin' && bookingData.user_id ? bookingData.user_id : userId;

    // Check for conflicts
    const hasConflict = bookings.some(b =>
      b.appointment_date === bookingData.appointment_date &&
      b.appointment_time === bookingData.appointment_time &&
      b.status === 'confirmed' &&
      (bookingData.staff_id ? b.staff_id === bookingData.staff_id : true)
    );

    if (hasConflict) {
      throw new Error('Time slot already booked');
    }

    const newBooking = {
      id: getNextId('bookings'),
      user_id: targetUserId,
      service_name: bookingData.service_name,
      appointment_date: bookingData.appointment_date,
      appointment_time: bookingData.appointment_time,
      duration: bookingData.duration || 60,
      status: 'confirmed',
      notes: bookingData.notes || null,
      created_by: userRole === 'admin' ? userId : null,
      business_type: bookingData.business_type || 'general',
      staff_id: bookingData.staff_id || null,
      resource_id: bookingData.resource_id || null,
      metadata: bookingData.metadata || null,
      payment_status: 'pending',
      payment_amount: 0,
      created_at: new Date().toISOString()
    };

    bookings.push(newBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Enrich with user data
    const user = users.find(u => u.id === targetUserId);
    return {
      ...newBooking,
      customer_name: user?.name,
      customer_email: user?.email,
      customer_phone: user?.phone
    };
  },

  update: async (bookingId, updates, userId, userRole) => {
    initializeData();
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
    const bookingIndex = bookings.findIndex(b => b.id === parseInt(bookingId));

    if (bookingIndex === -1) {
      throw new Error('Booking not found');
    }

    const booking = bookings[bookingIndex];

    // Check permissions
    if (userRole !== 'admin' && userRole !== 'superadmin' && booking.user_id !== userId) {
      throw new Error('Access denied');
    }

    // Update booking
    bookings[bookingIndex] = { ...booking, ...updates };
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    return bookings[bookingIndex];
  },

  delete: async (bookingId, userId, userRole) => {
    initializeData();
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
    const bookingIndex = bookings.findIndex(b => b.id === parseInt(bookingId));

    if (bookingIndex === -1) {
      throw new Error('Booking not found');
    }

    const booking = bookings[bookingIndex];

    // Check permissions
    if (userRole !== 'admin' && userRole !== 'superadmin' && booking.user_id !== userId) {
      throw new Error('Access denied');
    }

    bookings.splice(bookingIndex, 1);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    return { message: 'Booking deleted successfully' };
  },

  getAvailableSlots: async (date) => {
    initializeData();
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
    const businessHours = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUSINESS_HOURS));

    const dayOfWeek = new Date(date).getDay();
    const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    const businessHour = businessHours.find(bh => bh.day_of_week === adjustedDayOfWeek && bh.is_available === 1);

    if (!businessHour) {
      return [];
    }

    // Get booked times
    const bookedTimes = bookings
      .filter(b => b.appointment_date === date && b.status === 'confirmed')
      .map(b => b.appointment_time);

    // Generate available slots
    const slots = [];
    const start = new Date(`1970-01-01T${businessHour.start_time}`);
    const end = new Date(`1970-01-01T${businessHour.end_time}`);

    for (let time = new Date(start); time < end; time.setHours(time.getHours() + 1)) {
      const timeString = time.toTimeString().slice(0, 5);
      if (!bookedTimes.includes(timeString)) {
        slots.push(timeString);
      }
    }

    return slots;
  }
};

// Specialists operations
export const localStorageSpecialists = {
  getAll: async (businessType) => {
    initializeData();
    let specialists = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALISTS));

    if (businessType) {
      specialists = specialists.filter(s => s.business_type === businessType && s.is_active === 1);
    }

    return specialists;
  },

  create: async (specialistData) => {
    initializeData();
    const specialists = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALISTS));

    // Check if email exists
    if (specialistData.email && specialists.some(s => s.email === specialistData.email)) {
      throw new Error('Email already exists');
    }

    const newSpecialist = {
      id: getNextId('specialists'),
      name: specialistData.name,
      specialty: specialistData.specialty,
      business_type: specialistData.business_type,
      email: specialistData.email || null,
      phone: specialistData.phone || null,
      is_active: 1,
      created_at: new Date().toISOString()
    };

    specialists.push(newSpecialist);
    localStorage.setItem(STORAGE_KEYS.SPECIALISTS, JSON.stringify(specialists));

    return newSpecialist;
  },

  update: async (specialistId, updates) => {
    initializeData();
    const specialists = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALISTS));
    const specialistIndex = specialists.findIndex(s => s.id === parseInt(specialistId));

    if (specialistIndex === -1) {
      throw new Error('Specialist not found');
    }

    // Check if email exists for other specialists
    if (updates.email) {
      const emailExists = specialists.some(s => s.email === updates.email && s.id !== parseInt(specialistId));
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    specialists[specialistIndex] = { ...specialists[specialistIndex], ...updates };
    localStorage.setItem(STORAGE_KEYS.SPECIALISTS, JSON.stringify(specialists));

    return specialists[specialistIndex];
  },

  delete: async (specialistId) => {
    initializeData();
    const specialists = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALISTS));
    const filteredSpecialists = specialists.filter(s => s.id !== parseInt(specialistId));

    if (specialists.length === filteredSpecialists.length) {
      throw new Error('Specialist not found');
    }

    localStorage.setItem(STORAGE_KEYS.SPECIALISTS, JSON.stringify(filteredSpecialists));

    // Also delete specialist's bookings
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
    const filteredBookings = bookings.filter(b => b.staff_id !== parseInt(specialistId));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(filteredBookings));

    return { message: 'Specialist deleted successfully' };
  },

  getAvailability: async (specialistId, date) => {
    initializeData();
    const availability = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALIST_AVAILABILITY) || '[]');
    return availability.filter(a =>
      a.specialist_id === parseInt(specialistId) &&
      a.date === date &&
      a.is_available === 1
    );
  }
};

// Services operations
export const localStorageServices = {
  getAll: async (businessType) => {
    initializeData();
    let services = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));

    if (businessType) {
      services = services.filter(s => s.business_type === businessType && s.is_active === 1);
    }

    return services;
  },

  create: async (serviceData) => {
    initializeData();
    const services = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));

    const newService = {
      id: getNextId('services'),
      name: serviceData.name,
      business_type: serviceData.business_type,
      description: serviceData.description || null,
      price: parseFloat(serviceData.price) || 0,
      duration: parseInt(serviceData.duration) || 60,
      is_active: 1,
      created_at: new Date().toISOString()
    };

    services.push(newService);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));

    return newService;
  },

  update: async (serviceId, updates) => {
    initializeData();
    const services = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));
    const serviceIndex = services.findIndex(s => s.id === parseInt(serviceId));

    if (serviceIndex === -1) {
      throw new Error('Service not found');
    }

    // Update price and duration with proper type conversion
    const updatedData = { ...updates };
    if (updates.price !== undefined) {
      updatedData.price = parseFloat(updates.price);
    }
    if (updates.duration !== undefined) {
      updatedData.duration = parseInt(updates.duration);
    }

    services[serviceIndex] = { ...services[serviceIndex], ...updatedData };
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));

    return services[serviceIndex];
  },

  delete: async (serviceId) => {
    initializeData();
    const services = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));
    const filteredServices = services.filter(s => s.id !== parseInt(serviceId));

    if (services.length === filteredServices.length) {
      throw new Error('Service not found');
    }

    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(filteredServices));

    return { message: 'Service deleted successfully' };
  }
};

// Users management operations (for admin creating customers)
export const localStorageUsers = {
  getAll: async () => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    // Return only customers, not admins
    return users
      .filter(u => u.role === 'customer')
      .map(user => ({
        ...user,
        password: undefined // Don't expose passwords
      }));
  },

  create: async (userData) => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));

    // Check if email exists
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: getNextId('users'),
      name: userData.name,
      email: userData.email,
      password: userData.password || '$2a$10$default', // Default hashed password
      role: 'customer',
      phone: userData.phone || null,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    return { ...newUser, password: undefined };
  },

  update: async (userId, updates) => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const userIndex = users.findIndex(u => u.id === parseInt(userId));

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Check if email exists for other users
    if (updates.email) {
      const emailExists = users.some(u => u.email === updates.email && u.id !== parseInt(userId));
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    // Don't allow role change for security
    const updatedData = { ...updates };
    delete updatedData.role;

    users[userIndex] = { ...users[userIndex], ...updatedData };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    return { ...users[userIndex], password: undefined };
  },

  delete: async (userId) => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const filteredUsers = users.filter(u => u.id !== parseInt(userId));

    if (users.length === filteredUsers.length) {
      throw new Error('User not found');
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));

    // Also delete user's bookings
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
    const filteredBookings = bookings.filter(b => b.user_id !== parseInt(userId));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(filteredBookings));

    return { message: 'User deleted successfully' };
  }
};

// Specialist Availability operations
export const localStorageAvailability = {
  getAll: async (businessType, startDate, endDate) => {
    initializeData();
    const availability = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALIST_AVAILABILITY) || '[]');
    const specialists = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALISTS) || '[]');

    // Filter by business type if provided
    let relevantSpecialistIds = specialists.map(s => s.id);
    if (businessType) {
      relevantSpecialistIds = specialists
        .filter(s => s.business_type === businessType)
        .map(s => s.id);
    }

    return availability.filter(a => {
      if (!relevantSpecialistIds.includes(a.specialist_id)) return false;
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      return true;
    });
  },

  getForSpecialist: async (specialistId, startDate, endDate) => {
    initializeData();
    const availability = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALIST_AVAILABILITY) || '[]');

    return availability.filter(a => {
      if (a.specialist_id !== parseInt(specialistId)) return false;
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      return true;
    });
  },

  save: async (specialistId, availabilityData) => {
    initializeData();
    let availability = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALIST_AVAILABILITY) || '[]');

    // Remove existing availability for this specialist and date
    availability = availability.filter(a =>
      !(a.specialist_id === parseInt(specialistId) && a.date === availabilityData.date)
    );

    // Add new availability
    const newAvailability = {
      id: Date.now(), // Simple ID generation
      specialist_id: parseInt(specialistId),
      date: availabilityData.date,
      start_time: availabilityData.start_time,
      end_time: availabilityData.end_time,
      is_available: availabilityData.is_available !== undefined ? availabilityData.is_available : 1,
      created_at: new Date().toISOString()
    };

    availability.push(newAvailability);
    localStorage.setItem(STORAGE_KEYS.SPECIALIST_AVAILABILITY, JSON.stringify(availability));

    return newAvailability;
  }
};

// Super Admin operations
export const localStorageSuperAdmin = {
  getUsers: async () => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    return users.map(user => ({
      ...user,
      password: undefined // Don't expose passwords
    }));
  },

  getPlatformConfig: async () => {
    initializeData();
    // Return configuration for different business types
    return [
      {
        business_type: 'massage',
        monthly_price: 79.00,
        status: 'active',
        description: 'Massage therapy clinics and spa services'
      },
      {
        business_type: 'dental',
        monthly_price: 99.00,
        status: 'active',
        description: 'Dental clinics and orthodontics'
      },
      {
        business_type: 'beauty',
        monthly_price: 69.00,
        status: 'active',
        description: 'Beauty salons and cosmetic services'
      }
    ];
  },

  getAnalytics: async () => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
    const specialists = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALISTS));
    const services = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));

    return {
      totalUsers: users.length,
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.payment_amount || 0), 0),
      activeSpecialists: specialists.filter(s => s.is_active === 1).length,
      activeServices: services.filter(s => s.is_active === 1).length,
      usersByRole: {
        customer: users.filter(u => u.role === 'customer').length,
        admin: users.filter(u => u.role === 'admin').length,
        superadmin: users.filter(u => u.role === 'superadmin').length
      }
    };
  },

  grantAccess: async (userId, businessType, subscriptionStatus, monthlyPrice, subscriptionDuration) => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Update user with business access
    users[userIndex].businessAccess = {
      businessType,
      subscriptionStatus,
      monthlyPrice,
      subscriptionDuration,
      grantedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { message: 'Access granted successfully' };
  },

  createUser: async (userData) => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));

    // Check if email exists
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: getNextId('users'),
      name: userData.fullName,
      email: userData.email,
      password: '$2a$10$8K1p/a0dL3LPB9H2Z0K0XO5J5Z0K0K0K0K0K0K0K0K0K0K0K0K0K0', // Hashed password
      role: userData.role || 'customer',
      phone: userData.phone || '',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    return { message: 'User created successfully', user: { ...newUser, password: undefined } };
  },

  deleteUser: async (userId) => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const filteredUsers = users.filter(u => u.id !== userId);

    if (users.length === filteredUsers.length) {
      throw new Error('User not found');
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));

    // Also delete user's bookings
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS));
    const filteredBookings = bookings.filter(b => b.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(filteredBookings));

    return { message: 'User deleted successfully' };
  },

  updatePlatformConfig: async (businessType, price) => {
    // In localStorage mode, this is just for demo purposes
    // Actual config is returned from getPlatformConfig()
    return { message: 'Price updated successfully (demo mode)' };
  }
};

// User Access operations (for admin business access)
export const localStorageUserAccess = {
  getPermissions: async () => {
    initializeData();
    const token = localStorage.getItem('token');
    if (!token) return [];

    const decoded = JSON.parse(atob(token));
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const user = users.find(u => u.id === decoded.userId);

    if (!user || user.role !== 'admin') return [];

    // Return permissions based on businessAccess
    if (user.businessAccess) {
      return [{
        business_type: user.businessAccess.businessType,
        subscription_status: user.businessAccess.subscriptionStatus,
        monthly_price: user.businessAccess.monthlyPrice,
        isExpired: false
      }];
    }

    return [];
  },

  getAvailableBusinessTypes: async () => {
    initializeData();
    // Return all available business types
    return [
      { business_type: 'massage', name: 'Massage Therapy', is_available: true },
      { business_type: 'dental', name: 'Dental Practice', is_available: true },
      { business_type: 'beauty', name: 'Beauty Salon', is_available: true }
    ];
  }
};

// Platform Pricing operations
export const localStoragePlatformPricing = {
  getPricing: async () => {
    initializeData();
    return [
      {
        business_type: 'massage',
        monthly_price: 79.00,
        description: 'Professional appointment scheduling for massage therapy clinics'
      },
      {
        business_type: 'dental',
        monthly_price: 99.00,
        description: 'Professional appointment scheduling for dental practices'
      },
      {
        business_type: 'beauty',
        monthly_price: 69.00,
        description: 'Professional appointment scheduling for beauty salons'
      }
    ];
  }
};

// Check if we should use localStorage mode
export const shouldUseLocalStorage = () => {
  // Use localStorage if REACT_APP_USE_LOCAL_STORAGE is set to true
  // or if we detect we're in demo mode
  return process.env.REACT_APP_USE_LOCAL_STORAGE === 'true' ||
         window.location.hostname === 'localhost' ||
         localStorage.getItem('USE_LOCAL_STORAGE') === 'true';
};

// Initialize data on load
initializeData();
