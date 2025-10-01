import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useBusinessContext } from '../contexts/BusinessContext';

function CalendarView({ user }) {
  const { businessConfig } = useBusinessContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showDayView, setShowDayView] = useState(false);
  const [dayBookings, setDayBookings] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showManageBookingModal, setShowManageBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [users, setUsers] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [validDurations, setValidDurations] = useState([]);
  const [newBooking, setNewBooking] = useState({
    user_id: '',
    service_name: '',
    staff_id: '',
    resource_id: '',
    notes: '',
    duration: businessConfig?.defaultDuration || 60
  });

  // Force fetch bookings on mount
  useEffect(() => {
    console.log('CalendarView: Mount effect - forcing fetch');
    const timer = setTimeout(() => {
      fetchMonthBookings();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('CalendarView: MAIN useEffect triggered', { currentDate, businessConfig: businessConfig?.id });
    if (businessConfig?.id) {
      console.log('CalendarView: About to call fetchMonthBookings');
      fetchMonthBookings();
      fetchUsers();
      fetchSpecialists();
    } else {
      console.log('CalendarView: businessConfig not loaded yet');
    }
  }, [currentDate, businessConfig?.id]); // Changed dependency to prevent object reference issues

  // Add a manual refresh effect that always runs
  useEffect(() => {
    console.log('CalendarView: Manual refresh effect');
    const timer = setTimeout(() => {
      if (businessConfig?.id) {
        console.log('CalendarView: Delayed manual refresh');
        fetchMonthBookings();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [businessConfig]);

  const fetchMonthBookings = async () => {
    try {
      console.log('CalendarView: Fetching month bookings for business type:', businessConfig?.id);
      const response = await axios.get('/api/bookings');
      console.log('CalendarView: Received bookings response:', response.data);
      const filtered = response.data.bookings.filter(booking => 
        booking.business_type === businessConfig?.id && booking.status === 'confirmed'
      );
      console.log(`CalendarView: Filtered ${filtered.length} bookings for business type ${businessConfig?.id}:`, filtered);
      setBookings(filtered);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.users.filter(u => u.role === 'customer'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSpecialists = async () => {
    try {
      const response = await axios.get(`/api/specialists?business_type=${businessConfig?.id}`);
      // Only show active specialists
      setSpecialists(response.data.specialists.filter(s => s.is_active));
    } catch (error) {
      console.error('Error fetching specialists:', error);
    }
  };


  const fetchDaySchedule = async (date) => {
    const dateStr = date.toISOString().split('T')[0];
    console.log('Fetching day schedule for:', dateStr);
    try {
      // Get bookings for this day
      const response = await axios.get(`/api/bookings?date=${dateStr}`);
      const dayBookingsFiltered = response.data.bookings.filter(booking => 
        booking.business_type === businessConfig?.id
      );
      console.log(`CalendarView: Day bookings for ${dateStr}:`, dayBookingsFiltered);
      setDayBookings(dayBookingsFiltered);

      // Generate available slots
      await generateAvailableSlots(date, dayBookingsFiltered);
    } catch (error) {
      console.error('Error fetching day schedule:', error);
    }
  };

  const generateAvailableSlots = async (date, existingBookings) => {
    const slots = [];
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      // For specialists, fetch their availability from the database
      const availabilityResponse = await axios.get(
          `/api/specialist-availability?business_type=${businessConfig?.id}&start_date=${dateStr}&end_date=${dateStr}`
        );
        
        const availabilities = availabilityResponse.data.availability || [];
        console.log(`Fetching availability for date ${dateStr}:`, availabilities);
        
        if (availabilities.length === 0) {
          setAvailableProviders([]);
          setAvailableSlots([]);
          return;
        }
        
        // Get unique specialists who have availability for this date
        const specialistsWithAvailability = [];
        const addedSpecialistIds = new Set();
        
        // Only show slots for specialists who have availability set for this date
        availabilities.forEach(availability => {
          console.log(`Processing availability:`, availability);
          if (availability.is_available && availability.date === dateStr) {
            const specialist = specialists.find(s => s.id === availability.specialist_id);
            if (specialist && !addedSpecialistIds.has(specialist.id)) {
              specialistsWithAvailability.push(specialist);
              addedSpecialistIds.add(specialist.id);
            }
            if (specialist) {
              // Generate 30-minute time slots within the availability window
              const startTime = new Date(`1970-01-01T${availability.start_time}`);
              const endTime = new Date(`1970-01-01T${availability.end_time}`);
              
              // Use a reasonable buffer for slot generation to allow bookings near closing time
              const slotBuffer = 30; // Only subtract 30 minutes instead of max duration
              console.log(`Using slot buffer: ${slotBuffer} minutes for slot generation`);
              
              // Subtract small buffer from end time to allow appointments to start near closing time
              const lastSlotTime = new Date(endTime.getTime() - (slotBuffer * 60 * 1000));
              
              for (let time = new Date(startTime); time <= lastSlotTime; time.setMinutes(time.getMinutes() + 30)) {
                const timeString = time.toTimeString().slice(0, 5);
                
                // Find booking that overlaps with this slot
                const overlappingBooking = existingBookings.find(booking => {
                  // Convert both to strings for comparison to avoid type issues
                  if (String(booking.staff_id) !== String(specialist.id)) return false;
                  
                  // Use simple string comparison instead of Date objects to avoid timezone issues
                  const bookingTime = booking.appointment_time; // e.g., "14:30"
                  const bookingStartMinutes = parseInt(bookingTime.split(':')[0]) * 60 + parseInt(bookingTime.split(':')[1]);
                  const bookingEndMinutes = bookingStartMinutes + booking.duration;
                  const slotStartMinutes = parseInt(timeString.split(':')[0]) * 60 + parseInt(timeString.split(':')[1]);
                  const slotEndMinutes = slotStartMinutes + 30; // 30-minute slot
                  
                  // Check if slot overlaps with booking using minutes since midnight
                  const overlaps = slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes;
                  if (overlaps) {
                    console.log(`CalendarView: Found overlapping booking for ${timeString} (${slotStartMinutes}-${slotEndMinutes} min) with specialist ${specialist.id}:`, booking);
                  }
                  return overlaps;
                });

                // Always add the slot, but mark if it's booked
                console.log(`CalendarView: Generated slot ${timeString} - isBooked: ${!!overlappingBooking}`);
                console.log(`CalendarView: Slot ${timeString} formatted as: ${formatTime(timeString)}`);
                
                slots.push({
                  time: timeString,
                  provider: specialist,
                  date: date,
                  isBooked: !!overlappingBooking,
                  booking: overlappingBooking || null
                });
              }
            }
          }
        });
        
        setAvailableProviders(specialistsWithAvailability);
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error generating available slots:', error);
      setAvailableSlots([]);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getBookingsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(booking => booking.appointment_date === dateStr);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowDayView(true);
    fetchDaySchedule(date);
  };

  const handleSlotClick = async (slot) => {
    setSelectedSlot(slot);
    
    // Calculate valid durations for this slot using real availability data
    const validDurationsList = await calculateValidDurations(slot);
    setValidDurations(validDurationsList);
    
    // Use the default duration if valid, otherwise use the first valid duration
    const defaultDuration = businessConfig?.defaultDuration || 60;
    const selectedDuration = validDurationsList.includes(defaultDuration) ? defaultDuration : validDurationsList[0] || 60;
    
    setNewBooking({
      ...newBooking,
      service_name: businessConfig?.services?.[0] || '',
      staff_id: slot.provider.id,
      resource_id: '',
      duration: selectedDuration
    });
    setShowBookingModal(true);
  };

  const handleBookingClick = (booking, provider, timeString) => {
    setSelectedBooking({
      ...booking,
      provider,
      timeString,
      formattedTime: formatTime(timeString)
    });
    setShowManageBookingModal(true);
  };

  // Calculate valid durations for the selected time slot using real availability data and existing bookings
  const calculateValidDurations = async (slot) => {
    if (!slot || !slot.provider) return businessConfig?.durations || [];
    
    try {
      // Find the specialist's actual availability for this date
      const dateStr = slot.date.toISOString().split('T')[0];
      const availabilityResponse = await axios.get(
        `/api/specialist-availability?business_type=${businessConfig?.id}&start_date=${dateStr}&end_date=${dateStr}&specialist_id=${slot.provider.id}`
      );
      
      const availability = availabilityResponse.data.availability.find(av => 
        av.specialist_id === slot.provider.id && 
        av.date === dateStr && 
        av.is_available
      );
      
      if (!availability) return [];
      
      const slotTime = new Date(`1970-01-01T${slot.time}`);
      const endOfWorkDay = new Date(`1970-01-01T${availability.end_time}`);
      
      // Calculate max minutes until end of work day
      const workDayMinutes = Math.floor((endOfWorkDay.getTime() - slotTime.getTime()) / (60 * 1000));
      console.log(`Work day minutes for ${slot.time}: ${workDayMinutes} (end time: ${availability.end_time})`);
      
      // Find existing bookings for this specialist on this date
      const existingBookingsForDate = bookings.filter(booking => 
        String(booking.staff_id) === String(slot.provider.id) && 
        booking.appointment_date === dateStr &&
        booking.status === 'confirmed'
      );
      
      // For each duration, check if it would conflict with existing bookings
      const validDurations = (businessConfig?.durations || []).filter(duration => {
        // First check if duration fits within working hours
        if (duration > workDayMinutes) {
          console.log(`Duration ${duration} exceeds work day limit of ${workDayMinutes} minutes`);
          return false;
        }
        
        // Calculate when this appointment would end
        const appointmentEndTime = new Date(slotTime.getTime() + (duration * 60 * 1000));
        
        // Check if this duration would conflict with any existing booking
        const hasConflict = existingBookingsForDate.some(booking => {
          const existingStart = new Date(`1970-01-01T${booking.appointment_time}`);
          const existingEnd = new Date(existingStart.getTime() + (booking.duration * 60 * 1000));
          
          // Check if proposed appointment overlaps with existing booking
          const overlaps = slotTime < existingEnd && appointmentEndTime > existingStart;
          
          if (overlaps) {
            console.log(`Duration ${duration} min would conflict with existing booking from ${booking.appointment_time} (${booking.duration} min)`);
          }
          
          return overlaps;
        });
        
        return !hasConflict;
      });
      
      console.log(`Valid durations for ${slot.time}:`, validDurations);
      return validDurations;
      
    } catch (error) {
      console.error('Error fetching availability for duration validation:', error);
      return businessConfig?.durations || [];
    }
  };
  
  const getValidDurations = () => validDurations;

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate that the selected duration fits within specialist availability
      const appointmentEndTime = new Date(`1970-01-01T${selectedSlot.time}`);
      appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + newBooking.duration);
      const endTimeString = appointmentEndTime.toTimeString().slice(0, 5);
      
      // Get specialist availability for validation
      const dateStr = selectedSlot.date.toISOString().split('T')[0];
      const availabilityResponse = await axios.get(
        `/api/specialist-availability?business_type=${businessConfig?.id}&start_date=${dateStr}&end_date=${dateStr}&specialist_id=${selectedSlot.provider.id}`
      );
      
      const availability = availabilityResponse.data.availability.find(av => 
        av.specialist_id === selectedSlot.provider.id && 
        av.date === dateStr && 
        av.is_available &&
        selectedSlot.time >= av.start_time &&
        endTimeString <= av.end_time
      );
      
      console.log('Booking validation:', {
        selectedDate: dateStr,
        selectedTime: selectedSlot.time,
        duration: newBooking.duration,
        endTime: endTimeString,
        availabilities: availabilityResponse.data.availability,
        foundAvailability: availability
      });
      
      if (!availability) {
        alert(`Selected duration (${newBooking.duration} minutes) extends beyond specialist's working hours. Please choose a shorter duration or earlier time slot.`);
        return;
      }

      const bookingData = {
        ...newBooking,
        appointment_date: selectedSlot.date.toISOString().split('T')[0],
        appointment_time: selectedSlot.time,
        business_type: businessConfig?.id
      };

      console.log('Submitting booking data:', bookingData);
      const response = await axios.post('/api/bookings', bookingData);
      console.log('Booking response:', response.data);
      
      // Refresh the day schedule
      await fetchDaySchedule(selectedDate);
      await fetchMonthBookings();
      
      setShowBookingModal(false);
      setSelectedSlot(null);
      setNewBooking({
        user_id: '',
        service_name: '',
        staff_id: '',
        resource_id: '',
        notes: '',
        duration: businessConfig?.defaultDuration || 60
      });
      
      console.log('Booking created successfully, data refreshed');
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  if (showDayView) {
    return (
      <div>
        {/* Day View Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => setShowDayView(false)} className="btn btn-secondary">
            ← Back to Calendar
          </button>
          <h2 style={{ margin: 0, color: '#2EABE2' }}>
            📅 {selectedDate?.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          <div></div>
        </div>

        {/* Staff/Resource Schedule */}
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: '#333' }}>
            {businessConfig?.id === 'massage' ? '👥 Therapist Schedule' : 
             businessConfig?.id === 'dental' ? '👩‍⚕️ Doctor Schedule' : 
             'Schedule'}
          </h3>
          
          {/* Time Grid */}
          {(() => {
            // Get providers first to calculate grid columns - use only available providers
            const providers = availableProviders;
            
            // If no providers have availability, show a message
            if (providers.length === 0) {
              return (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#666',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '2px dashed #ddd'
                }}>
                  <h4 style={{ color: '#666', marginBottom: '15px' }}>No Availability Set</h4>
                  <p>No specialists have set their availability for {selectedDate?.toLocaleDateString()}.</p>
                  <p>Go to <strong>Specialists</strong> tab and click <strong>📅 Schedule</strong> to set working hours.</p>
                </div>
              );
            }
            
            const numColumns = providers.length + 1; // +1 for time column
            const gridTemplateColumns = `100px ${'150px '.repeat(providers.length)}`.trim();
            
            return (
              <div style={{ 
                overflowX: 'auto',
                maxWidth: '100%',
                border: '1px solid #e0e0e0',
                borderRadius: '5px'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: gridTemplateColumns,
                  gap: '1px',
                  backgroundColor: '#e0e0e0',
                  minWidth: `${100 + (providers.length * 150)}px`
                }}>
                {/* Header Row */}
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '10px', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  Time
                </div>
                
                {providers.map(provider => (
                  <div key={provider.id} style={{ 
                    backgroundColor: 'white', 
                    padding: '8px', 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    <div style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {provider.name || provider.id}
                    </div>
                    {provider.specialty && (
                      <div style={{ 
                        fontSize: '10px', 
                        color: '#666', 
                        fontWeight: 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {provider.specialty}
                      </div>
                    )}
                  </div>
                ))}
            
                {/* Time Slots - Generate row by row */}
                {(() => {
                  const slots = [];
                  
                  // If no available slots, don't show any time slots
                  if (availableSlots.length === 0) {
                    return (
                      <div style={{
                        gridColumn: '1 / -1',
                        padding: '40px',
                        textAlign: 'center',
                        color: '#666',
                        backgroundColor: 'white',
                        borderRadius: '8px'
                      }}>
                        No availability set for this date. Please set working hours in the Specialists section.
                      </div>
                    );
                  }
                  
                  // Get time range from available slots instead of business hours
                  const availableTimes = availableSlots.map(slot => slot.time).sort();
                  if (availableTimes.length === 0) {
                    return null;
                  }
                  
                  const earliestTime = availableTimes[0];
                  const latestTime = availableTimes[availableTimes.length - 1];
                  
                  const startTime = new Date(`1970-01-01T${earliestTime}`);
                  const endTime = new Date(`1970-01-01T${latestTime}`);
                  endTime.setMinutes(endTime.getMinutes() + 30); // Include the last slot

                  // Generate grid row by row (time + all providers for that time)
                  for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 30)) {
                    const timeString = time.toTimeString().slice(0, 5);
                    
                    // Time label column (first column of each row)
                    slots.push(
                      <div key={`time-${timeString}`} style={{ 
                        backgroundColor: 'white', 
                        padding: '10px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRight: '2px solid #e0e0e0'
                      }}>
                        {formatTime(timeString)}
                      </div>
                    );

                    // Provider slots for this time (remaining columns of the row)
                    providers.forEach(provider => {
                      const slotData = availableSlots.find(slot => 
                        slot.time === timeString && slot.provider.id === provider.id
                      );

                      // Determine slot status and styling
                      const isWithinAvailability = !!slotData;
                      const isBooked = slotData?.isBooked || false;
                      const booking = slotData?.booking || null;
                      const isAvailable = isWithinAvailability && !isBooked;
                      const isUnavailable = !isWithinAvailability;

                      // Skip rendering this slot if it's part of a booking that already started
                      if (isBooked && booking.appointment_time !== timeString) {
                        return; // Skip continuation slots
                      }

                      let backgroundColor, textColor, displayText, clickable;
                      
                      if (isBooked) {
                        backgroundColor = '#ff6b6b';
                        textColor = 'white';
                        displayText = 'Booked';
                        clickable = true;
                        
                        // Calculate how many slots this booking spans
                        const bookingDuration = booking.duration;
                        const slotsSpanned = Math.ceil(bookingDuration / 30);
                        
                        slots.push(
                          <div
                            key={`${timeString}-${provider.id}-booking-${booking.id}`}
                            onClick={() => handleBookingClick(booking, provider, timeString)}
                            style={{
                              backgroundColor,
                              padding: '8px',
                              minHeight: `${40 * slotsSpanned - 2}px`, // Span multiple slots with slight gap adjustment
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              transition: 'all 0.2s ease',
                              border: '2px solid transparent',
                              gridRow: `span ${slotsSpanned}`,
                              borderRadius: '4px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              margin: '1px 0'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.backgroundColor = '#e64a4a';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.backgroundColor = backgroundColor;
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                            }}
                          >
                            <div style={{ color: textColor, fontWeight: 'bold', textAlign: 'center' }}>
                              <div style={{ fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                                {booking.customer_name}
                              </div>
                              <div style={{ fontSize: '11px', marginBottom: '2px' }}>
                                {booking.service_name}
                              </div>
                              <div style={{ fontSize: '10px', opacity: 0.9 }}>
                                {bookingDuration} min
                              </div>
                            </div>
                          </div>
                        );
                        
                      } else if (isAvailable) {
                        backgroundColor = 'white';
                        textColor = '#1e293b';
                        displayText = 'Available';
                        clickable = true;
                        
                        slots.push(
                          <div
                            key={`${timeString}-${provider.id}`}
                            onClick={() => handleSlotClick({ time: timeString, provider, date: selectedDate })}
                            style={{
                              backgroundColor,
                              padding: '8px',
                              minHeight: '40px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              transition: 'all 0.2s ease',
                              border: '1px solid #28a745',
                              opacity: 1
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.backgroundColor = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.backgroundColor = backgroundColor;
                            }}
                          >
                            <div style={{ color: textColor, fontWeight: 'bold', textAlign: 'center' }}>
                              {displayText}
                            </div>
                          </div>
                        );
                        
                      } else {
                        backgroundColor = 'white';
                        textColor = '#1e293b';
                        displayText = 'Unavailable';
                        
                        slots.push(
                          <div
                            key={`${timeString}-${provider.id}`}
                            style={{
                              backgroundColor,
                              padding: '8px',
                              minHeight: '40px',
                              cursor: 'not-allowed',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              opacity: 1,
                              border: '1px solid #e9ecef'
                            }}
                          >
                            <div style={{ color: textColor, fontWeight: 'bold', textAlign: 'center' }}>
                              {displayText}
                            </div>
                          </div>
                        );
                      }
                    });
                  }

                  return slots;
                })()}
                </div>
              </div>
            );
          })()}


          {/* Legend */}
          <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '15px', height: '15px', backgroundColor: 'white', border: '1px solid #28a745' }}></div>
              Available (Click to book)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '15px', height: '15px', backgroundColor: '#ff6b6b' }}></div>
              Booked (Click to manage)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '15px', height: '15px', backgroundColor: 'white', border: '1px solid #e9ecef' }}></div>
              Unavailable
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
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
              <h3 style={{ marginBottom: '20px' }}>Book Appointment</h3>
              
              <form onSubmit={handleBookingSubmit}>
                <div className="form-group">
                  <label>Customer</label>
                  <select
                    value={newBooking.user_id}
                    onChange={(e) => setNewBooking({...newBooking, user_id: e.target.value})}
                    required
                  >
                    <option value="">Select customer</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Service</label>
                  <select
                    value={newBooking.service_name}
                    onChange={(e) => setNewBooking({...newBooking, service_name: e.target.value})}
                    required
                  >
                    {(businessConfig?.services || []).map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration</label>
                  <select
                    value={newBooking.duration}
                    onChange={(e) => setNewBooking({...newBooking, duration: parseInt(e.target.value)})}
                    required
                  >
                    {getValidDurations().map(duration => (
                      <option key={duration} value={duration}>
                        {duration === 30 ? '30 minutes' :
                         duration === 60 ? '1 hour' :
                         duration === 90 ? '1 hour 30 minutes' :
                         duration === 120 ? '2 hours' :
                         `${duration} minutes`}
                      </option>
                    ))}
                  </select>
                  {getValidDurations().length < (businessConfig?.durations || []).length && (
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      Some durations unavailable due to working hours or booking conflicts
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Time Slot</label>
                  <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px', border: '1px solid #e9ecef' }}>
                    <strong>{formatTime(selectedSlot?.time)}</strong> with{' '}
                    <strong>{selectedSlot?.provider?.name || selectedSlot?.provider?.id}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                    placeholder="Optional notes..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="btn" style={{ flex: 1 }}>
                    Book Appointment
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowBookingModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Booking Management Modal */}
        {showManageBookingModal && selectedBooking && (
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
              <h3 style={{ marginBottom: '20px', color: '#2EABE2' }}>Manage Booking</h3>
              
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px', border: '1px solid #e9ecef' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Customer:</strong> {selectedBooking.customer_name}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Service:</strong> {selectedBooking.service_name}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Date & Time:</strong> {selectedDate?.toLocaleDateString()} at {selectedBooking.formattedTime}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Provider:</strong> {selectedBooking.provider?.name || selectedBooking.provider?.id}
                </div>
                {selectedBooking.notes && (
                  <div>
                    <strong>Notes:</strong> {selectedBooking.notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
                <button 
                  className="btn"
                  style={{ flex: '1 1 calc(50% - 5px)', backgroundColor: '#28a745', borderColor: '#28a745' }}
                  onClick={() => {
                    setEditingBooking(selectedBooking);
                    setShowEditBookingModal(true);
                    setShowManageBookingModal(false);
                  }}
                >
                  Edit Booking
                </button>
                <button 
                  className="btn"
                  style={{ flex: '1 1 calc(50% - 5px)', backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to cancel this booking?')) {
                      try {
                        await axios.delete(`/api/bookings/${selectedBooking.id}`);
                        await fetchDaySchedule(selectedDate);
                        await fetchMonthBookings();
                        setShowManageBookingModal(false);
                        setSelectedBooking(null);
                      } catch (error) {
                        console.error('Error canceling booking:', error);
                      }
                    }
                  }}
                >
                  Cancel Booking
                </button>
                <button 
                  className="btn"
                  style={{ flex: '1 1 calc(50% - 5px)', backgroundColor: '#6c757d', borderColor: '#6c757d' }}
                  onClick={() => {
                    // Mark as unavailable functionality
                    console.log('Mark as unavailable');
                  }}
                >
                  Mark Unavailable
                </button>
                <button 
                  className="btn btn-secondary"
                  style={{ flex: '1 1 calc(50% - 5px)' }}
                  onClick={() => {
                    setShowManageBookingModal(false);
                    setSelectedBooking(null);
                  }}
                >
                  Close
                </button>
              </div>
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
                  
                  // Refresh calendar
                  await fetchDaySchedule(selectedDate);
                  await fetchMonthBookings();
                  
                  // Close modal
                  setShowEditBookingModal(false);
                  setEditingBooking(null);
                } catch (error) {
                  console.error('Error updating booking:', error);
                  alert('Error updating booking: ' + (error.response?.data?.message || error.message));
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
      </div>
    );
  }

  return (
    <div>
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={prevMonth} className="btn btn-secondary">← Previous</button>
        <h2 style={{ margin: 0, color: '#2EABE2' }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={nextMonth} className="btn btn-secondary">Next →</button>
      </div>

      {/* Calendar Grid */}
      <div className="card">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          backgroundColor: '#e0e0e0'
        }}>
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {getDaysInMonth(currentDate).map((date, index) => {
            const dayBookings = date ? getBookingsForDate(date) : [];
            const isToday = date && date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                onClick={() => date && handleDateClick(date)}
                style={{
                  backgroundColor: 'white',
                  minHeight: '100px',
                  padding: '8px',
                  cursor: date ? 'pointer' : 'default',
                  opacity: 1,
                  border: isToday ? '2px solid #2EABE2' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (date) {
                    e.target.style.backgroundColor = '#f0f8ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (date) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                {date && (
                  <>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {date.getDate()}
                    </div>
                    
                    {dayBookings.slice(0, 3).map((booking, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: booking.status === 'confirmed' ? '#e8f5e8' : '#ffe8e8',
                          color: booking.status === 'confirmed' ? '#2e7d32' : '#d32f2f',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          marginBottom: '2px',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {formatTime(booking.appointment_time)} - {booking.service_name}
                      </div>
                    ))}
                    
                    {dayBookings.length > 3 && (
                      <div style={{ fontSize: '10px', color: '#666' }}>
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CalendarView;