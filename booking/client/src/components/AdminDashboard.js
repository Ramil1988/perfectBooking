import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useBusinessContext } from '../contexts/BusinessContext';
import { useNavigate } from 'react-router-dom';
import CalendarView from './CalendarView';
import ScheduleModal from './ScheduleModal';

function AdminDashboard({ user }) {
  const { businessConfig } = useBusinessContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showSpecialistForm, setShowSpecialistForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSpecialistForSchedule, setSelectedSpecialistForSchedule] = useState(null);
  const [scheduleAvailability, setScheduleAvailability] = useState([]);
  const [editingSpecialist, setEditingSpecialist] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [platformPricing, setPlatformPricing] = useState([]);
  const [businessFilter, setBusinessFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSpecialist, setSelectedSpecialist] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [validDurations, setValidDurations] = useState([]);
  const [newBooking, setNewBooking] = useState({
    user_id: '',
    service_name: '',
    appointment_date: '',
    appointment_time: '',
    duration: businessConfig?.defaultDuration || 60,
    notes: '',
    staff_id: ''
  });
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [newSpecialist, setNewSpecialist] = useState({
    name: '',
    specialty: '',
    email: '',
    phone: ''
  });
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration: 60
  });

  const businessTypes = [
    { id: 'massage', name: 'Massage Therapy', icon: '💆‍♀️' },
    { id: 'dental', name: 'Dental Clinic', icon: '🦷' },
    { id: 'beauty', name: 'Beauty Salon', icon: '💄' }
  ];

  // Use business-specific service options for forms
  const serviceOptions = businessConfig?.services || ['General Service'];

  // Generate time slots based on business hours
  const generateTimeSlots = async (specialistId, appointmentDate, duration) => {
    const slots = [];
    
    if (!specialistId || !appointmentDate) {
      setAvailableSlots([]);
      return;
    }
    
    try {
      // Get specialist availability for the selected date
      const availabilityResponse = await axios.get(
        `/api/specialist-availability?business_type=${businessConfig?.id}&start_date=${appointmentDate}&end_date=${appointmentDate}&specialist_id=${specialistId}`
      );
      
      const availabilities = availabilityResponse.data.availability || [];
      const todayAvailability = availabilities.find(av => 
        av.specialist_id == specialistId && 
        av.date === appointmentDate && 
        av.is_available
      );
      
      if (todayAvailability) {
        const startTime = new Date(`1970-01-01T${todayAvailability.start_time}`);
        const endTime = new Date(`1970-01-01T${todayAvailability.end_time}`);
        const appointmentDuration = duration || businessConfig?.defaultDuration || 60;
        
        // Subtract appointment duration to ensure appointment can finish within working hours
        const lastSlotTime = new Date(endTime.getTime() - (appointmentDuration * 60 * 1000));
        
        for (let time = new Date(startTime); time <= lastSlotTime; time.setMinutes(time.getMinutes() + 30)) {
          slots.push(time.toTimeString().slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error fetching specialist availability:', error);
    }
    
    setAvailableSlots(slots);
  };

  useEffect(() => {
    fetchBookings();
    fetchUsers();
    fetchSpecialists();
    fetchServices();
    fetchPlatformPricing();
    // Initialize valid durations with all available durations
    setValidDurations(businessConfig?.durations || [30, 60, 90, 120]);
  }, [businessConfig]);

  useEffect(() => {
    if (selectedDate) {
      fetchBookings(selectedDate);
    } else {
      fetchBookings();
    }
  }, [selectedDate]);

  // Refresh bookings when switching to bookings tab
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  // Reset duration if current duration is no longer valid when validDurations changes
  useEffect(() => {
    if ((validDurations?.length || 0) > 0 && newBooking.duration && !validDurations.includes(newBooking.duration)) {
      const firstValidDuration = validDurations[0] || (businessConfig?.defaultDuration || 60);
      setNewBooking(prev => ({...prev, duration: firstValidDuration}));
    }
  }, [validDurations, newBooking.duration, businessConfig]);

  const getAnalytics = () => {
    const safeBookings = bookings || [];
    const total = safeBookings.length;
    const confirmed = safeBookings.filter(b => b.status === 'confirmed').length;
    const cancelled = safeBookings.filter(b => b.status === 'cancelled').length;

    // Calculate revenue based on business config
    const confirmedBookings = safeBookings.filter(b => b.status === 'confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, booking) => {
      const hourlyRate = businessConfig?.pricePerHour || 0;
      return sum + (hourlyRate * (booking.duration / 60));
    }, 0);

    const upcomingBookings = safeBookings.filter(b => {
      const bookingDate = new Date(b.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today && b.status === 'confirmed';
    });

    const todayBookings = safeBookings.filter(b => {
      const today = new Date().toISOString().split('T')[0];
      return b.appointment_date === today && b.status === 'confirmed';
    });

    // Service popularity
    const serviceStats = {};
    safeBookings.forEach(booking => {
      serviceStats[booking.service_name] = (serviceStats[booking.service_name] || 0) + 1;
    });

    // Staff/Resource utilization with hours
    const staffStats = {};
    const staffHours = {};
    const staffNames = {}; // Store actual names for display

    safeBookings.forEach(booking => {
      const duration = booking.duration || 60; // default to 60 minutes if not specified
      const hours = duration / 60; // convert minutes to hours
      
      if (booking.staff_id) {
        const displayName = booking.therapist_name || `Staff ${booking.staff_id}`;
        const key = booking.staff_id; // Use staff_id as key for consistency
        
        staffStats[key] = (staffStats[key] || 0) + 1;
        staffHours[key] = (staffHours[key] || 0) + hours;
        staffNames[key] = displayName; // Store the display name
      }
      if (booking.resource_id) {
        staffStats[booking.resource_id] = (staffStats[booking.resource_id] || 0) + 1;
        staffHours[booking.resource_id] = (staffHours[booking.resource_id] || 0) + hours;
        staffNames[booking.resource_id] = booking.resource_id; // Keep resource_id as-is
      }
    });

    return {
      total,
      confirmed,
      cancelled,
      confirmationRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      upcomingBookings: upcomingBookings.length,
      todayBookings: todayBookings.length,
      totalRevenue: Math.round(totalRevenue),
      serviceStats,
      staffStats,
      staffHours,
      staffNames,
      averageBookingValue: confirmed > 0 ? Math.round(totalRevenue / confirmed) : 0
    };
  };

  const filteredBookings = (bookings || [])
    .filter(booking => {
      if (businessFilter && booking.business_type !== businessFilter) return false;
      if (statusFilter && booking.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const now = new Date();
      const dateTimeA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateTimeB = new Date(`${b.appointment_date}T${b.appointment_time}`);

      const aIsFuture = dateTimeA > now;
      const bIsFuture = dateTimeB > now;

      // Future appointments first, sorted by earliest first
      if (aIsFuture && bIsFuture) {
        return dateTimeA - dateTimeB;
      }

      // If one is future and one is past, future comes first
      if (aIsFuture && !bIsFuture) return -1;
      if (!aIsFuture && bIsFuture) return 1;

      // Both are past, sort by most recent first
      return dateTimeB - dateTimeA;
    });

  const getBusinessTypeName = (type) => {
    const businessType = businessTypes.find(bt => bt.id === type);
    return businessType ? businessType.name : 'Unknown';
  };

  const getBusinessTypeIcon = (type) => {
    const businessType = businessTypes.find(bt => bt.id === type);
    return businessType ? businessType.icon : '📋';
  };

  const fetchBookings = async (date = '') => {
    try {
      const url = date ? `/api/bookings?date=${date}` : '/api/bookings';
      const response = await axios.get(url);
      // Filter bookings by selected business type and only show confirmed bookings
      const filteredBookings = response.data.bookings.filter(booking => 
        booking.business_type === businessConfig?.id && booking.status === 'confirmed'
      );
      setBookings(filteredBookings);
    } catch (error) {
      setError('Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      // Filter out the current admin user from the list
      const filteredUsers = response.data.users.filter(fetchedUser => fetchedUser.email !== user.email);
      setUsers(filteredUsers);
    } catch (error) {
      setError('Error fetching users');
    }
  };

  const fetchSpecialists = async () => {
    try {
      const response = await axios.get(`/api/specialists?business_type=${businessConfig?.id}`);
      setSpecialists(response.data.specialists);
    } catch (error) {
      setError('Error fetching specialists');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get(`/api/services?business_type=${businessConfig?.id}`);
      setServices(response.data.services);
    } catch (error) {
      setError('Error fetching services');
    }
  };

  const fetchPlatformPricing = async () => {
    try {
      const response = await axios.get('/api/super-admin/platform-pricing');
      setPlatformPricing(response.data.pricing);
    } catch (error) {
      console.error('Error fetching platform pricing:', error);
    }
  };

  const fetchAvailableSlots = async (specialistId, date) => {
    try {
      console.log(`AdminDashboard: fetchAvailableSlots called with specialistId: ${specialistId}, date: ${date}`);
      
      // Use exactly the same logic as CalendarView to eliminate discrepancies
      const availabilityResponse = await axios.get(
        `/api/specialist-availability?business_type=${businessConfig?.id}&start_date=${date}&end_date=${date}`
      );
      
      const bookingsResponse = await axios.get(`/api/bookings?date=${date}`);
      const existingBookings = bookingsResponse.data.bookings.filter(booking => 
        booking.business_type === businessConfig?.id && booking.status === 'confirmed'
      );
      
      console.log(`AdminDashboard: Found ${existingBookings.length} existing bookings for business type ${businessConfig?.id}`);
      
      const availabilities = availabilityResponse.data.availability || [];
      console.log(`AdminDashboard: Fetching availability for date ${date}:`, availabilities);
      
      if (availabilities.length === 0) {
        console.log('AdminDashboard: No availabilities found');
        setAvailableSlots([]);
        return;
      }
      
      const slots = [];
      
      // Use the same logic as CalendarView - process each availability
      availabilities.forEach(availability => {
        console.log(`AdminDashboard: Processing availability:`, availability);
        if (availability.is_available && availability.date === date && availability.specialist_id == specialistId) {
          // Generate 30-minute time slots within the availability window
          const startTime = new Date(`1970-01-01T${availability.start_time}`);
          const endTime = new Date(`1970-01-01T${availability.end_time}`);
          
          // Use a reasonable buffer for slot generation to allow bookings near closing time
          const slotBuffer = 30; // Only subtract 30 minutes instead of max duration
          console.log(`AdminDashboard: Using slot buffer: ${slotBuffer} minutes for slot generation`);
          
          // Subtract small buffer from end time to allow appointments to start near closing time
          const lastSlotTime = new Date(endTime.getTime() - (slotBuffer * 60 * 1000));
          
          for (let time = new Date(startTime); time <= lastSlotTime; time.setMinutes(time.getMinutes() + 30)) {
            const timeString = time.toTimeString().slice(0, 5);
            
            // Find booking that overlaps with this slot - using EXACT same logic as CalendarView
            const overlappingBooking = existingBookings.find(booking => {
              if (String(booking.staff_id) !== String(specialistId)) return false;
              
              // Use simple string comparison instead of Date objects to avoid timezone issues
              const bookingTime = booking.appointment_time; // e.g., "14:30"
              const bookingStartMinutes = parseInt(bookingTime.split(':')[0]) * 60 + parseInt(bookingTime.split(':')[1]);
              const bookingEndMinutes = bookingStartMinutes + booking.duration;
              const slotStartMinutes = parseInt(timeString.split(':')[0]) * 60 + parseInt(timeString.split(':')[1]);
              const slotEndMinutes = slotStartMinutes + 30; // 30-minute slot
              
              // Check if slot overlaps with booking using minutes since midnight
              const overlaps = slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes;
              if (overlaps) {
                console.log(`AdminDashboard: Found overlapping booking for ${timeString} (${slotStartMinutes}-${slotEndMinutes} min):`, booking);
              }
              return overlaps;
            });

            // Always add the slot, but mark if it's booked (same as CalendarView)
            console.log(`AdminDashboard: Generated slot ${timeString} - available: ${!overlappingBooking}`);
            
            slots.push({
              time: timeString,
              available: !overlappingBooking
            });
          }
        }
      });
      
      console.log(`AdminDashboard: Generated ${slots.length} total slots`);
      console.log(`AdminDashboard: Available slots:`, slots.filter(s => s.available).map(s => s.time));
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setError('Error fetching available slots');
      setAvailableSlots([]);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await axios.put(`/api/bookings/${bookingId}`, { status });
      setBookings((bookings || []).map(booking =>
        booking.id === bookingId
          ? { ...booking, status }
          : booking
      ));
      setSuccess('Booking status updated successfully');
      // Refresh calendar to reflect status changes
      setCalendarRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error updating booking status');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      await axios.delete(`/api/bookings/${bookingId}`);
      setBookings((bookings || []).filter(booking => booking.id !== bookingId));
      setSuccess('Booking deleted successfully');
      // Refresh calendar to reflect deletion
      setCalendarRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error deleting booking');
    }
  };

  const handleNewBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Add business type to the booking
      const bookingData = {
        ...newBooking,
        business_type: businessConfig?.id || 'general',
        duration: newBooking.duration || businessConfig?.defaultDuration || 60
      };
      
      const response = await axios.post('/api/bookings', bookingData);
      setBookings([response.data.booking, ...bookings]);
      setSuccess('Booking created successfully');
      setShowBookingForm(false);
      setNewBooking({
        user_id: '',
        service_name: '',
        appointment_date: '',
        appointment_time: '',
        duration: businessConfig?.defaultDuration || 60,
        notes: '',
        staff_id: ''
      });
      setSelectedSpecialist('');
      setAvailableSlots([]);
      // Refresh calendar to show new booking
      setCalendarRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/users', newCustomer);
      setUsers([response.data.user, ...users]);
      setSuccess('Customer created successfully');
      setShowCustomerForm(false);
      setNewCustomer({
        name: '',
        email: '',
        password: '',
        phone: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpecialist = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const specialistData = {
        ...newSpecialist,
        business_type: businessConfig?.id || 'general'
      };
      
      const response = await axios.post('/api/specialists', specialistData);
      setSpecialists([response.data.specialist, ...specialists]);
      setSuccess('Specialist created successfully');
      setShowSpecialistForm(false);
      setNewSpecialist({
        name: '',
        specialty: '',
        email: '',
        phone: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating specialist');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSpecialist = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const specialistData = {
        ...editingSpecialist,
        business_type: businessConfig?.id || 'general'
      };
      
      const response = await axios.put(`/api/specialists/${editingSpecialist.id}`, specialistData);
      setSpecialists((specialists || []).map(s => s.id === editingSpecialist.id ? response.data.specialist : s));
      setSuccess('Specialist updated successfully');
      setEditingSpecialist(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating specialist');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpecialist = async (specialistId) => {
    if (!window.confirm('Are you sure you want to delete this specialist?')) {
      return;
    }

    try {
      await axios.delete(`/api/specialists/${specialistId}`);
      setSpecialists((specialists || []).filter(s => s.id !== specialistId));
      setSuccess('Specialist deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error deleting specialist');
    }
  };

  const handleManageSchedule = async (specialist) => {
    setSelectedSpecialistForSchedule(specialist);
    setShowScheduleModal(true);
    // Fetch existing availability for this specialist
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now
      const response = await axios.get(`/api/specialist-availability?specialist_id=${specialist.id}&business_type=${businessConfig?.id}&start_date=${startDate}&end_date=${endDate}`);
      setScheduleAvailability(response.data.availability);
    } catch (error) {
      setError('Error fetching specialist availability');
    }
  };

  const handleSaveAvailability = async (availabilityData) => {
    try {
      await axios.post('/api/specialist-availability', {
        ...availabilityData,
        specialist_id: selectedSpecialistForSchedule.id,
        business_type: businessConfig?.id
      });
      setSuccess('Availability saved successfully');
      setTimeout(() => setSuccess(''), 3000);
      // Refresh availability and calendar
      handleManageSchedule(selectedSpecialistForSchedule);
      setCalendarRefreshKey(prev => prev + 1);
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving availability');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Service management functions
  const handleCreateService = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const serviceData = {
        ...newService,
        business_type: businessConfig?.id || 'general'
      };
      
      const response = await axios.post('/api/services', serviceData);
      setServices([response.data.service, ...services]);
      setSuccess('Service created successfully');
      setShowServiceForm(false);
      setNewService({
        name: '',
        description: '',
        price: '',
        duration: 60
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating service');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const serviceData = {
        ...editingService,
        business_type: businessConfig?.id || 'general'
      };
      
      const response = await axios.put(`/api/services/${editingService.id}`, serviceData);
      
      // Check if we got the updated service back
      if (response.data.service) {
        setServices((services || []).map(s => s.id === editingService.id ? response.data.service : s));
      } else {
        // Fallback: refetch all services to ensure we have the updated data
        const servicesResponse = await axios.get(`/api/services?business_type=${businessConfig?.id || 'general'}`);
        setServices(servicesResponse.data.services);
      }

      setSuccess('Service updated successfully');
      setEditingService(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating service');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await axios.delete(`/api/services/${serviceId}`);
      setServices((services || []).filter(s => s.id !== serviceId));
      setSuccess('Service deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error deleting service');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      description: service.description || '',
      price: service.price || '',
      duration: service.duration || 60
    });
    setShowServiceForm(true);
  };

  const handleSpecialistChange = async (specialistId) => {
    setSelectedSpecialist(specialistId);
    setNewBooking({...newBooking, staff_id: specialistId, appointment_time: ''});
    
    if (specialistId && newBooking.appointment_date) {
      await fetchAvailableSlots(specialistId, newBooking.appointment_date);
    } else {
      setAvailableSlots([]);
    }
  };

  const handleDateChange = async (date) => {
    setNewBooking({...newBooking, appointment_date: date, appointment_time: ''});
    
    if (selectedSpecialist && date) {
      await fetchAvailableSlots(selectedSpecialist, date);
    } else {
      setAvailableSlots([]);
    }
  };

  const handleDurationChange = async (duration) => {
    setNewBooking({...newBooking, duration: duration, appointment_time: ''});
    
    // Refresh available slots with new duration
    if (selectedSpecialist && newBooking.appointment_date) {
      await fetchAvailableSlots(selectedSpecialist, newBooking.appointment_date);
    }
  };

  // Calculate valid durations based on selected time and specialist availability
  const calculateValidDurations = async (specialistId, date, selectedTime) => {
    if (!specialistId || !date || !selectedTime) {
      setValidDurations(businessConfig?.durations || [30, 60, 90, 120]);
      return;
    }

    try {
      const availabilityResponse = await axios.get(
        `/api/specialist-availability?business_type=${businessConfig?.id}&start_date=${date}&end_date=${date}&specialist_id=${specialistId}`
      );
      
      const availability = availabilityResponse.data.availability.find(av => 
        av.specialist_id === parseInt(specialistId) && 
        av.date === date && 
        av.is_available
      );
      
      if (!availability) {
        setValidDurations([]);
        return;
      }
      
      const slotTime = new Date(`1970-01-01T${selectedTime}`);
      const endOfWorkDay = new Date(`1970-01-01T${availability.end_time}`);
      
      const availableMinutes = Math.floor((endOfWorkDay.getTime() - slotTime.getTime()) / (60 * 1000));
      console.log(`AdminDashboard: Available minutes for ${selectedTime}: ${availableMinutes} (end time: ${availability.end_time})`);
      
      const validDurationsList = (businessConfig?.durations || []).filter(duration => duration <= availableMinutes);
      setValidDurations(validDurationsList);
    } catch (error) {
      console.error('Error calculating valid durations:', error);
      setValidDurations(businessConfig?.durations || [30, 60, 90, 120]);
    }
  };
  
  const handleTimeChange = async (selectedTime) => {
    setNewBooking(prev => ({...prev, appointment_time: selectedTime}));
    
    // Calculate valid durations when time is selected
    await calculateValidDurations(selectedSpecialist, newBooking.appointment_date, selectedTime);
    
    // The duration reset logic needs to be in a separate useEffect since state updates are async
  };


  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewCustomer({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '' // Don't prefill password for security
    });
    setShowCustomerForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will also delete all their bookings.')) {
      return;
    }
    try {
      await axios.delete(`/api/users/${userId}`);
      setUsers((users || []).filter(u => u.id !== userId));
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error deleting user');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        await axios.put(`/api/users/${editingUser.id}`, {
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          role: editingUser.role
        });
        setUsers((users || []).map(u => u.id === editingUser.id ? {
          ...u,
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone
        } : u));
        setSuccess('User updated successfully');
      } else {
        // Create new user
        const response = await axios.post('/api/users', {
          ...newCustomer,
          role: 'customer'
        });
        setUsers([response.data.user, ...(users || [])]);
        setSuccess('Customer created successfully');
      }
      
      setShowCustomerForm(false);
      setEditingUser(null);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        password: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving customer');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    // Parse time string (e.g., "14:30") into hours and minutes
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date object using current date to avoid timezone issues with 1970
    const now = new Date();
    const timeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    return timeDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (loading && (bookings?.length || 0) === 0) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Admin Dashboard</h2>
        <button
          onClick={() => setShowBookingForm(true)}
          className="btn"
        >
          Create Booking for Customer
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`btn ${activeTab === 'analytics' ? '' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          📊 Analytics
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`btn ${activeTab === 'calendar' ? '' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          📅 Calendar
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`btn ${activeTab === 'bookings' ? '' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          📋 Bookings ({bookings?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? '' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          👥 Users ({users?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('specialists')}
          className={`btn ${activeTab === 'specialists' ? '' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          {businessConfig?.id === 'massage' ? '💆‍♀️' : businessConfig?.id === 'dental' ? '👨‍⚕️' : '👔'} Specialists ({specialists?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`btn ${activeTab === 'services' ? '' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          🛎️ Services
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`btn ${activeTab === 'subscription' ? '' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          💳 Subscribe
        </button>
      </div>

      {activeTab === 'analytics' && (
        <div>
          {(() => {
            const analytics = getAnalytics();
            return (
              <div>
                {/* Overview Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '2.5em' }}>{analytics.total}</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Total Bookings</p>
                  </div>
                  
                  <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '2.5em' }}>{analytics.todayBookings}</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Today's Bookings</p>
                  </div>
                  
                  <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '2.5em' }}>{analytics.upcomingBookings}</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Upcoming</p>
                  </div>
                  
                  <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '2.5em' }}>${analytics.totalRevenue}</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Total Revenue</p>
                  </div>
                  
                  <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #ff7b7b 0%, #ff9a56 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '2.5em' }}>${analytics.averageBookingValue}</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Avg Booking</p>
                  </div>
                </div>

                {/* Service Popularity */}
                <div className="card dashboard-card" style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '20px', color: '#1e40af' }}>📊 Most Popular Services</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {Object.entries(analytics.serviceStats).sort(([,a], [,b]) => b - a).slice(0, 6).map(([service, count]) => (
                      <div key={service} style={{
                        padding: '18px',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#1e40af', fontSize: '0.9em', fontWeight: '600' }}>{service}</h4>
                        <p style={{ margin: 0, fontSize: '1.5em', fontWeight: 'bold', color: '#3b82f6' }}>{count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff/Resource Utilization */}
                {Object.keys(analytics.staffStats).length > 0 && (
                  <div className="card" style={{ marginBottom: '30px' }}>
                    <h3 style={{ marginBottom: '20px', color: '#2EABE2' }}>
                      👥 {businessConfig?.id === 'massage' ? 'Therapist' : businessConfig?.id === 'dental' ? 'Doctor' : 'Resource'} Utilization
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #ddd' }}>
                            <th style={{ textAlign: 'left', padding: '15px' }}>
                              {businessConfig?.id === 'massage' ? 'Therapist' : businessConfig?.id === 'dental' ? 'Doctor' : 'Resource'}
                            </th>
                            <th style={{ textAlign: 'right', padding: '15px' }}>Bookings</th>
                            <th style={{ textAlign: 'right', padding: '15px' }}>Utilization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(analytics.staffStats).sort(([,a], [,b]) => b - a).map(([staffId, count]) => {
                            const specialistName = analytics.staffNames[staffId] || `Specialist ${staffId}`;
                            
                            // Get booked hours for this specialist
                            const bookedHours = analytics.staffHours[staffId] || 0;
                            
                            // Calculate available hours (assume 8 hours working day)
                            const availableHours = 8;
                            
                            // Calculate utilization percentage
                            const utilizationPercent = Math.min(Math.round((bookedHours / availableHours) * 100), 100);
                            
                            return (
                              <tr key={staffId} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px' }}>{specialistName}</td>
                                <td style={{ textAlign: 'right', padding: '15px', fontWeight: 'bold' }}>
                                  {count} ({bookedHours.toFixed(1)}h)
                                </td>
                                <td style={{ textAlign: 'right', padding: '15px', color: '#666' }}>
                                  {utilizationPercent}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Status Overview */}
                <div className="card dashboard-card">
                  <h3 style={{ marginBottom: '20px', color: '#1e40af' }}>📈 Booking Status Overview</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #28a745, #20c997)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5em',
                        fontWeight: 'bold',
                        margin: '0 auto 10px auto'
                      }}>
                        {analytics.confirmed}
                      </div>
                      <p style={{ margin: 0, color: '#28a745', fontWeight: 'bold' }}>Confirmed</p>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #dc3545, #fd7e14)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5em',
                        fontWeight: 'bold',
                        margin: '0 auto 10px auto'
                      }}>
                        {analytics.cancelled}
                      </div>
                      <p style={{ margin: 0, color: '#dc3545', fontWeight: 'bold' }}>Cancelled</p>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2EABE2, #17a2b8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                        margin: '0 auto 10px auto'
                      }}>
                        {analytics.confirmationRate}%
                      </div>
                      <p style={{ margin: 0, color: '#2EABE2', fontWeight: 'bold' }}>Success Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'calendar' && (
        <CalendarView key={calendarRefreshKey} user={user} />
      )}

      {activeTab === 'bookings' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Filter Bookings</h3>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label htmlFor="date-filter" style={{ marginRight: '10px' }}>Date:</label>
                <input
                  type="date"
                  id="date-filter"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="business-filter" style={{ marginRight: '10px' }}>Business:</label>
                <select
                  id="business-filter"
                  value={businessFilter}
                  onChange={(e) => setBusinessFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  {businessTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="status-filter" style={{ marginRight: '10px' }}>Status:</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <button
                onClick={() => {
                  setSelectedDate('');
                  setBusinessFilter('');
                  setStatusFilter('');
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </div>
            <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              Showing {filteredBookings?.length || 0} of {bookings?.length || 0} bookings
            </div>
          </div>

          <div className="card">
            {(filteredBookings?.length || 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#666' }}>
                  {selectedDate || businessFilter || statusFilter ? 'No bookings match your filters.' : 'No bookings yet.'}
                </p>
              </div>
            ) : (
              <div>
                {filteredBookings.map(booking => {
                  const now = new Date();
                  const bookingDateTime = new Date(`${booking.appointment_date}T${booking.appointment_time}`);
                  const isPast = bookingDateTime < now;
                  
                  return (
                  <div key={booking.id} className="booking-item" style={{
                    opacity: isPast ? 0.6 : 1,
                    backgroundColor: isPast ? '#f8f8f8' : 'white',
                    filter: isPast ? 'grayscale(20%)' : 'none'
                  }}>
                    <div className="booking-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '1.5em', marginRight: '10px' }}>
                            {getBusinessTypeIcon(booking.business_type)}
                          </span>
                          <h3 style={{ margin: 0, color: '#333' }}>{booking.service_name}</h3>
                          <span style={{
                            marginLeft: '15px',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: '#2EABE2',
                            color: 'white'
                          }}>
                            {getBusinessTypeName(booking.business_type)}
                          </span>
                        </div>
                        
                        <p style={{ margin: '5px 0', color: '#666' }}>
                          <strong>Customer:</strong> {booking.customer_name} ({booking.customer_email})
                        </p>
                        <p style={{ margin: '5px 0', color: '#666' }}>
                          <strong>Date & Time:</strong> {formatDate(booking.appointment_date)} at {formatTime(booking.appointment_time)}
                        </p>
                        <p style={{ margin: '5px 0', color: '#666' }}>
                          <strong>Duration:</strong> {booking.duration} minutes
                        </p>
                        {booking.customer_phone && (
                          <p style={{ margin: '5px 0', color: '#666' }}>
                            <strong>Phone:</strong> {booking.customer_phone}
                          </p>
                        )}
                        
                        {/* Business-specific details */}
                        {booking.staff_id && (
                          <p style={{ margin: '5px 0', color: '#666' }}>
                            <strong>Therapist:</strong> {booking.therapist_name || `Staff ${booking.staff_id}`}
                          </p>
                        )}
                        {booking.resource_id && (
                          <p style={{ margin: '5px 0', color: '#666' }}>
                            <strong>Resource:</strong> {booking.resource_id}
                          </p>
                        )}
                        
                        {/* Metadata display */}
                        {booking.metadata && (() => {
                          try {
                            const metadata = JSON.parse(booking.metadata);
                            return (
                              <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px', fontSize: '13px' }}>
                                <strong>Details:</strong>
                                <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                                  {Object.entries(metadata).map(([key, value]) => (
                                    <li key={key} style={{ margin: '2px 0' }}>
                                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {
                                        typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
                                      }
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`booking-status status-${booking.status}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                        <strong>Notes:</strong> {booking.notes}
                      </div>
                    )}
                    
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                          className="btn btn-secondary"
                          style={{ padding: '5px 15px', fontSize: '14px' }}
                        >
                          Cancel
                        </button>
                      )}
                      {booking.status === 'cancelled' && (
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                          className="btn"
                          style={{ padding: '5px 15px', fontSize: '14px' }}
                        >
                          Confirm
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingBooking(booking);
                          setShowEditBookingModal(true);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '5px 15px', fontSize: '14px', marginRight: '10px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="btn btn-danger"
                        style={{ padding: '5px 15px', fontSize: '14px' }}
                      >
                        Delete
                      </button>
                    </div>
                    
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                      Created on: {new Date(booking.created_at).toLocaleString()}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Users Management</h3>
            <button
              onClick={() => setShowCustomerForm(true)}
              className="btn"
            >
              Create New Customer
            </button>
          </div>

          <div className="card">
            {(users?.length || 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#666' }}>No users found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Role</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Phone</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Joined</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(users || []).map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{user.name}</td>
                        <td style={{ padding: '10px' }}>{user.email}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: user.role === 'admin' ? '#007bff' : '#28a745',
                            color: 'white'
                          }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>{user.phone || 'N/A'}</td>
                        <td style={{ padding: '10px' }}>
                          {user.created_at && !isNaN(new Date(user.created_at)) ?
                            new Date(user.created_at).toLocaleDateString() :
                            'N/A'
                          }
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="btn btn-danger"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              disabled={user.role === 'admin'}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'specialists' && (
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{businessConfig?.id === 'massage' ? 'Therapists' : businessConfig?.id === 'dental' ? 'Doctors' : 'Specialists'} Management</h3>
            <button
              onClick={() => setShowSpecialistForm(true)}
              className="btn"
            >
              Add New {businessConfig?.id === 'massage' ? 'Therapist' : businessConfig?.id === 'dental' ? 'Doctor' : 'Specialist'}
            </button>
          </div>

          <div className="card">
            {(specialists?.length || 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#666' }}>No specialists found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Specialty</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Phone</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(specialists || []).map(specialist => (
                      <tr key={specialist.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>
                          <strong>{specialist.name}</strong>
                        </td>
                        <td style={{ padding: '10px' }}>{specialist.specialty}</td>
                        <td style={{ padding: '10px' }}>{specialist.email || 'N/A'}</td>
                        <td style={{ padding: '10px' }}>{specialist.phone || 'N/A'}</td>
                        <td style={{ padding: '10px' }}>
                          <button
                            onClick={() => handleManageSchedule(specialist)}
                            className="btn"
                            style={{ marginRight: '10px', padding: '5px 10px', fontSize: '12px', backgroundColor: '#2EABE2', borderColor: '#2EABE2' }}
                          >
                            📅 Schedule
                          </button>
                          <button
                            onClick={() => setEditingSpecialist(specialist)}
                            className="btn btn-secondary"
                            style={{ marginRight: '10px', padding: '5px 10px', fontSize: '12px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSpecialist(specialist.id)}
                            className="btn btn-danger"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {showBookingForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90%',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Create Booking for Customer</h3>
            
            <form onSubmit={handleNewBookingSubmit}>
              <div className="form-group">
                <label htmlFor="user_id">Customer</label>
                <select
                  id="user_id"
                  name="user_id"
                  value={newBooking.user_id}
                  onChange={(e) => setNewBooking({...newBooking, user_id: e.target.value})}
                  required
                >
                  <option value="">Select a customer</option>
                  {(users || []).filter(u => u.role === 'customer').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="service_name">Service</label>
                <select
                  id="service_name"
                  name="service_name"
                  value={newBooking.service_name}
                  onChange={(e) => setNewBooking({...newBooking, service_name: e.target.value})}
                  required
                >
                  <option value="">Select a service</option>
                  {(services || []).filter(service => service && service.name).map(service => (
                    <option key={service.id} value={service.name}>{service.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="specialist">{businessConfig?.id === 'massage' ? 'Therapist' : businessConfig?.id === 'dental' ? 'Doctor' : 'Specialist'}</label>
                <select
                  id="specialist"
                  name="specialist"
                  value={selectedSpecialist}
                  onChange={(e) => handleSpecialistChange(e.target.value)}
                  required
                >
                  <option value="">Select a {businessConfig?.id === 'massage' ? 'therapist' : businessConfig?.id === 'dental' ? 'doctor' : 'specialist'}</option>
                  {(specialists || []).map(specialist => (
                    <option key={specialist.id} value={specialist.id}>
                      {specialist.name} - {specialist.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="appointment_date">Date</label>
                <input
                  type="date"
                  id="appointment_date"
                  name="appointment_date"
                  value={newBooking.appointment_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={getTodayDate()}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="appointment_time">Time</label>
                <select
                  id="appointment_time"
                  name="appointment_time"
                  value={newBooking.appointment_time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  required
                  disabled={!selectedSpecialist || !newBooking.appointment_date}
                >
                  <option value="">
                    {!selectedSpecialist || !newBooking.appointment_date 
                      ? 'Select specialist and date first' 
                      : 'Select an available time'}
                  </option>
                  {(availableSlots || []).map(slot => (
                    <option key={slot.time} value={slot.time} disabled={!slot.available}>
                      {formatTime(slot.time)} {!slot.available ? '(Booked)' : ''}
                    </option>
                  ))}
                </select>
                {selectedSpecialist && newBooking.appointment_date && (availableSlots?.length || 0) > 0 && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Booked slots are shown but disabled
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration (minutes)</label>
                <select
                  id="duration"
                  name="duration"
                  value={newBooking.duration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                >
                  {((validDurations?.length || 0) > 0 ? validDurations : (businessConfig?.durations || [30, 60, 90, 120])).map(duration => (
                    <option key={duration} value={duration}>
                      {duration} minutes
                    </option>
                  ))}
                </select>
                {newBooking.appointment_time && (validDurations?.length || 0) < ((businessConfig?.durations || []).length) && (
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    Some durations unavailable due to working hours constraints
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Creating...' : 'Create Booking'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowBookingForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCustomerForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Create New Customer</h3>
            
            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label htmlFor="customer_name">Name</label>
                <input
                  type="text"
                  id="customer_name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer_email">Email</label>
                <input
                  type="email"
                  id="customer_email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer_password">Password</label>
                <input
                  type="password"
                  id="customer_password"
                  value={newCustomer.password}
                  onChange={(e) => setNewCustomer({...newCustomer, password: e.target.value})}
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer_phone">Phone (Optional)</label>
                <input
                  type="tel"
                  id="customer_phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Creating...' : 'Create Customer'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCustomerForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(showSpecialistForm || editingSpecialist) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>
              {editingSpecialist ? 'Edit' : 'Add New'} {businessConfig?.id === 'massage' ? 'Therapist' : businessConfig?.id === 'dental' ? 'Doctor' : 'Specialist'}
            </h3>
            
            <form onSubmit={editingSpecialist ? handleUpdateSpecialist : handleCreateSpecialist}>
              <div className="form-group">
                <label htmlFor="specialist_name">Name</label>
                <input
                  type="text"
                  id="specialist_name"
                  value={editingSpecialist ? editingSpecialist.name : newSpecialist.name}
                  onChange={(e) => {
                    if (editingSpecialist) {
                      setEditingSpecialist({...editingSpecialist, name: e.target.value});
                    } else {
                      setNewSpecialist({...newSpecialist, name: e.target.value});
                    }
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialist_specialty">Specialty</label>
                <input
                  type="text"
                  id="specialist_specialty"
                  value={editingSpecialist ? editingSpecialist.specialty : newSpecialist.specialty}
                  onChange={(e) => {
                    if (editingSpecialist) {
                      setEditingSpecialist({...editingSpecialist, specialty: e.target.value});
                    } else {
                      setNewSpecialist({...newSpecialist, specialty: e.target.value});
                    }
                  }}
                  required
                  placeholder="e.g., Deep Tissue, General Dentistry, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialist_email">Email (Optional)</label>
                <input
                  type="email"
                  id="specialist_email"
                  value={editingSpecialist ? editingSpecialist.email : newSpecialist.email}
                  onChange={(e) => {
                    if (editingSpecialist) {
                      setEditingSpecialist({...editingSpecialist, email: e.target.value});
                    } else {
                      setNewSpecialist({...newSpecialist, email: e.target.value});
                    }
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialist_phone">Phone (Optional)</label>
                <input
                  type="tel"
                  id="specialist_phone"
                  value={editingSpecialist ? editingSpecialist.phone : newSpecialist.phone}
                  onChange={(e) => {
                    if (editingSpecialist) {
                      setEditingSpecialist({...editingSpecialist, phone: e.target.value});
                    } else {
                      setNewSpecialist({...newSpecialist, phone: e.target.value});
                    }
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn" disabled={loading} style={{ flex: 1 }}>
                  {loading ? (editingSpecialist ? 'Updating...' : 'Creating...') : (editingSpecialist ? 'Update' : 'Create')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowSpecialistForm(false);
                    setEditingSpecialist(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>
              {editingUser ? `Edit ${editingUser.name}` : 'Create New Customer'}
            </h3>
            
            <form onSubmit={handleCustomerSubmit}>
              <div className="form-group">
                <label htmlFor="customer_name">Name</label>
                <input
                  type="text"
                  id="customer_name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer_email">Email</label>
                <input
                  type="email"
                  id="customer_email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer_phone">Phone</label>
                <input
                  type="tel"
                  id="customer_phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label htmlFor="customer_password">Password</label>
                  <input
                    type="password"
                    id="customer_password"
                    value={newCustomer.password}
                    onChange={(e) => setNewCustomer({...newCustomer, password: e.target.value})}
                    required={!editingUser}
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn" disabled={loading} style={{ flex: 1 }}>
                  {loading ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Update User' : 'Create Customer')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCustomerForm(false);
                    setEditingUser(null);
                    setNewCustomer({
                      name: '',
                      email: '',
                      phone: '',
                      password: ''
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Services Management</h3>
            <button
              onClick={() => {
                setEditingService(null);
                setNewService({
                  name: '',
                  description: '',
                  price: '',
                  duration: 60
                });
                setShowServiceForm(true);
              }}
              className="btn"
            >
              Add New Service
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {(services || []).filter(service => service && service.name).map(service => (
              <div key={service.id} className="card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{service.name}</h4>
                <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.9em' }}>
                  {service.description || 'No description provided'}
                </p>
                <div style={{ margin: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#2EABE2', fontSize: '1.1em' }}>
                    ${service.price ? parseFloat(service.price).toFixed(2) : 'Price not set'}
                  </span>
                  <span style={{ color: '#666', fontSize: '0.9em' }}>
                    {service.duration} min
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    onClick={() => handleEditService(service)}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '0.9em' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="btn btn-danger"
                    style={{ flex: 1, fontSize: '0.9em' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(services?.length || 0) === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No services found. Add your first service to get started.
            </div>
          )}
        </div>
      )}

      {/* Service Form Modal */}
      {showServiceForm && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>
            
            <form onSubmit={editingService ? handleUpdateService : handleCreateService}>
              <div className="form-group">
                <label htmlFor="service_name">Service Name</label>
                <input
                  type="text"
                  id="service_name"
                  name="service_name"
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  required
                  placeholder="e.g., Swedish Massage, Teeth Cleaning"
                />
              </div>

              <div className="form-group">
                <label htmlFor="service_description">Description</label>
                <textarea
                  id="service_description"
                  name="service_description"
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  placeholder="Brief description of the service"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="service_price">Price ($)</label>
                <input
                  type="number"
                  id="service_price"
                  name="service_price"
                  value={newService.price}
                  onChange={(e) => setNewService({...newService, price: e.target.value})}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="service_duration">Duration (minutes)</label>
                <select
                  id="service_duration"
                  name="service_duration"
                  value={newService.duration}
                  onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value)})}
                  required
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={150}>2.5 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="submit" 
                  className="btn"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Saving...' : (editingService ? 'Update Service' : 'Create Service')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowServiceForm(false);
                    setEditingService(null);
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditBookingModal && editingBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#2EABE2' }}>Edit Booking</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const formData = new FormData(e.target);
                const updateData = {
                  service_name: formData.get('service_name'),
                  appointment_date: formData.get('appointment_date'),
                  appointment_time: formData.get('appointment_time'),
                  duration: parseInt(formData.get('duration')),
                  notes: formData.get('notes')
                };
                
                await axios.put(`/api/bookings/${editingBooking.id}`, updateData);
                
                // Refresh bookings list
                fetchBookings();
                setSuccess('Booking updated successfully');
                // Refresh calendar to reflect booking changes
                setCalendarRefreshKey(prev => prev + 1);
                setTimeout(() => setSuccess(''), 3000);
                
                // Close modal
                setShowEditBookingModal(false);
                setEditingBooking(null);
              } catch (error) {
                console.error('Error updating booking:', error);
                setError('Error updating booking: ' + (error.response?.data?.message || error.message));
                setTimeout(() => setError(''), 5000);
              }
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Customer: {editingBooking.customer_name}
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service</label>
                <select 
                  name="service_name" 
                  defaultValue={editingBooking.service_name}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  required
                >
                  {(businessConfig?.services || []).map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date</label>
                <input 
                  type="date" 
                  name="appointment_date" 
                  defaultValue={editingBooking.appointment_date}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Time</label>
                <input 
                  type="time" 
                  name="appointment_time" 
                  defaultValue={editingBooking.appointment_time}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Duration (minutes)</label>
                <select 
                  name="duration" 
                  defaultValue={editingBooking.duration}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  required
                >
                  {(businessConfig?.durations || [30, 60, 90, 120]).map(duration => (
                    <option key={duration} value={duration}>{duration} minutes</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes</label>
                <textarea 
                  name="notes" 
                  defaultValue={editingBooking.notes || ''}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Add any notes..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="submit"
                  className="btn"
                  style={{ flex: 1, backgroundColor: '#28a745', borderColor: '#28a745', color: 'white' }}
                >
                  Save Changes
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowEditBookingModal(false);
                    setEditingBooking(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div>
          <div className="card" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#1e40af' }}>💳 Platform Subscription</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Subscribe to unlock premium features for your {businessConfig?.name || 'business'} platform.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Restaurant/Salon/Clinic subscription options */}
              {businessConfig?.id && (
                <div className="card" style={{ 
                  padding: '24px', 
                  border: '2px solid #3b82f6', 
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.02) 100%)'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '3em', marginBottom: '10px' }}>{businessConfig.icon}</div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>
                      {businessConfig.name} Platform
                    </h4>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#3b82f6', marginBottom: '10px' }}>
                      ${platformPricing.find(p => p.business_type === businessConfig?.id)?.monthly_price || '49'}/month
                    </div>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      Full booking management system
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <h5 style={{ margin: '0 0 12px 0', color: '#374151' }}>Features:</h5>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
                      <li>Unlimited bookings</li>
                      <li>Customer management</li>
                      <li>Staff scheduling</li>
                      <li>Analytics & reporting</li>
                      <li>Email notifications</li>
                      <li>Custom branding</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/subscribe/${businessConfig.id}`)}
                    className="btn"
                    style={{ 
                      width: '100%', 
                      padding: '12px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    Subscribe Now
                  </button>
                </div>
              )}
              
              {/* Alternative business types */}
              <div className="card" style={{ padding: '24px', border: '1px solid #d1d5db' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>🏢</div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Other Business Types</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    Want to use a different business type?
                  </p>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  {businessTypes.filter(type => type.id !== businessConfig?.id).map(type => (
                    <div 
                      key={type.id} 
                      style={{ 
                        marginBottom: '12px', 
                        padding: '12px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: '1px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e3f2fd';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                      onClick={() => navigate(user.role === 'superadmin' ? '/subscription-payment' : `/subscribe/${type.id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '1.2em', marginRight: '8px' }}>{type.icon}</span>
                            <strong>{type.name}</strong>
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {type.id === 'massage' && 'Spa and wellness services with therapist management'}
                            {type.id === 'dental' && 'Medical appointments and patient management'}
                            {type.id === 'beauty' && 'Professional beauty and wellness treatments'}
                          </div>
                          <div style={{ fontSize: '16px', color: '#3b82f6', fontWeight: 'bold', marginTop: '4px' }}>
                            ${platformPricing.find(p => p.business_type === type.id)?.monthly_price || '49'}/month
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '500' }}>
                          Subscribe →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '30px', 
              padding: '20px', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '12px',
              border: '1px solid #0ea5e9'
            }}>
              <h5 style={{ margin: '0 0 12px 0', color: '#0c4a6e' }}>💡 Why Subscribe?</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', color: '#374151' }}>
                <div>
                  <strong>📈 Grow Your Business</strong>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>Professional booking system that scales</div>
                </div>
                <div>
                  <strong>⚡ Save Time</strong>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>Automated scheduling and notifications</div>
                </div>
                <div>
                  <strong>📊 Track Performance</strong>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>Analytics and business insights</div>
                </div>
                <div>
                  <strong>🎨 Custom Branding</strong>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>Make it yours with custom styling</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <ScheduleModal
        show={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        specialist={selectedSpecialistForSchedule}
        availability={scheduleAvailability}
        onSave={handleSaveAvailability}
        businessConfig={businessConfig}
      />
    </div>
  );
}

export default AdminDashboard;