import React, { useState, useEffect } from 'react';

function ScheduleModal({ 
  show, 
  onClose, 
  specialist, 
  availability, 
  onSave,
  businessConfig 
}) {
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date: '',
    start_time: '',
    end_time: '',
    is_available: 1,
    notes: ''
  });
  const [recurringSchedules, setRecurringSchedules] = useState([]);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [newRecurringSchedule, setNewRecurringSchedule] = useState({
    name: 'Monday-Friday Schedule',
    pattern: 'monday-friday', // monday-friday, tuesday-saturday, custom
    start_time: '11:00',
    end_time: '19:00',
    days: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    }
  });

  useEffect(() => {
    if (availability) {
      setScheduleEntries(availability);
    }
  }, [availability]);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const validateTimeConstraints = (startTime, endTime, isEditing = false, originalEntry = null) => {
    // Basic time order validation
    if (startTime >= endTime) {
      alert('Start time must be before end time');
      return false;
    }

    // If editing, check extension constraints
    if (isEditing && originalEntry) {
      const originalEndHour = parseInt(originalEntry.end_time.split(':')[0]);
      const originalEndMinutes = parseInt(originalEntry.end_time.split(':')[1]);
      const originalEndTotalMinutes = originalEndHour * 60 + originalEndMinutes;
      
      const newEndHour = parseInt(endTime.split(':')[0]);
      const newEndMinutes = parseInt(endTime.split(':')[1]);
      const newEndTotalMinutes = newEndHour * 60 + newEndMinutes;
      
      // Allow extension up to 1 hour past the original end time
      const maxAllowedEndTotalMinutes = originalEndTotalMinutes + 60; // 1 hour after original end
      
      if (newEndTotalMinutes > maxAllowedEndTotalMinutes) {
        const maxEndTime = Math.floor(maxAllowedEndTotalMinutes / 60).toString().padStart(2, '0') + ':' + 
                           (maxAllowedEndTotalMinutes % 60).toString().padStart(2, '0');
        alert(`Maximum allowed end time is ${maxEndTime} (1 hour after original end time)`);
        return false;
      }
    }

    return true;
  };

  const handleSaveEntry = async () => {
    if (!newEntry.date || !newEntry.start_time || !newEntry.end_time) {
      alert('Please fill in date, start time, and end time');
      return;
    }

    // Validate date is not in the past
    if (newEntry.date < getTodayDate()) {
      alert('Cannot set availability for past dates');
      return;
    }

    // Validate time constraints
    if (!validateTimeConstraints(newEntry.start_time, newEntry.end_time, editingEntry !== null, editingEntry)) {
      return;
    }

    try {
      if (editingEntry) {
        // Update existing entry
        const response = await fetch(`/api/specialist-availability/${editingEntry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            date: newEntry.date,
            start_time: newEntry.start_time,
            end_time: newEntry.end_time,
            is_available: newEntry.is_available,
            notes: newEntry.notes
          })
        });

        if (response.ok) {
          const result = await response.json();
          setScheduleEntries(scheduleEntries.map(entry => 
            entry.id === editingEntry.id ? { ...entry, ...result.availability } : entry
          ));
        } else {
          const error = await response.json();
          alert('Error updating availability: ' + error.message);
          return;
        }
      } else {
        // Create new entry
        onSave(newEntry);
      }

      // Reset form
      setNewEntry({
        date: '',
        start_time: '',
        end_time: '',
        is_available: 1,
        notes: ''
      });
      setEditingEntry(null);
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability entry');
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setNewEntry({
      date: '',
      start_time: '',
      end_time: '',
      is_available: 1,
      notes: ''
    });
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setNewEntry({
      date: entry.date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      is_available: entry.is_available,
      notes: entry.notes || ''
    });
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this availability entry?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/specialist-availability/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setScheduleEntries(scheduleEntries.filter(entry => entry.id !== entryId));
      } else {
        const error = await response.json();
        alert('Error deleting availability: ' + error.message);
      }
    } catch (error) {
      console.error('Error deleting availability:', error);
      alert('Failed to delete availability entry');
    }
  };

  const getNextWeekDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const existingEntry = scheduleEntries.find(entry => entry.date === dateStr);
      const isAutoGenerated = existingEntry && existingEntry.notes && existingEntry.notes.includes('Auto-generated');
      const hasExistingEntry = !!existingEntry;

      // Only include dates that don't have any existing schedule entries
      if (!hasExistingEntry) {
        days.push({
          date: dateStr,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayDate: date.getDate(),
          hasEntry: false,
          isAutoGenerated: false,
          isDisabled: false
        });
      }
    }
    return days;
  };

  const getAppliedPatterns = () => {
    const patterns = [];
    const autoGeneratedEntries = scheduleEntries.filter(entry => 
      entry.notes && entry.notes.includes('Auto-generated from')
    );
    
    // Extract unique pattern names
    const uniquePatterns = [...new Set(autoGeneratedEntries.map(entry => 
      entry.notes.replace('Auto-generated from ', '')
    ))];
    
    return uniquePatterns;
  };

  const isDateCoveredByPattern = (dateStr) => {
    const entry = scheduleEntries.find(e => e.date === dateStr);
    return entry && entry.notes && entry.notes.includes('Auto-generated');
  };

  const getAvailableDatesForPattern = (schedule, months) => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = new Date(today.getFullYear(), today.getMonth() + months, 0);
    
    const potentialEntries = generateRecurringEntries(schedule, startDate, endDate);
    const availableEntries = potentialEntries.filter(entry => 
      !isDateCoveredByPattern(entry.date)
    );
    
    return availableEntries.length;
  };

  const getAvailableDatesForSingleMonth = (schedule, monthOffset) => {
    const today = new Date();
    const targetMonth = today.getMonth() + monthOffset;
    const targetYear = today.getFullYear() + Math.floor(targetMonth / 12);
    const adjustedMonth = targetMonth % 12;
    
    let startDate, endDate;
    
    if (monthOffset === 0) {
      // Current month - start from today
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
    } else {
      // Future months - full month
      startDate = new Date(targetYear, adjustedMonth, 1);
      endDate = new Date(targetYear, adjustedMonth + 1, 0); // Last day of target month
    }
    
    const potentialEntries = generateRecurringEntries(schedule, startDate, endDate);
    const availableEntries = potentialEntries.filter(entry => 
      !isDateCoveredByPattern(entry.date)
    );
    
    return availableEntries.length;
  };

  const handleApplyRecurringSingleMonth = async (schedule, monthOffset) => {
    try {
      const today = new Date();
      const targetMonth = today.getMonth() + monthOffset;
      const targetYear = today.getFullYear() + Math.floor(targetMonth / 12);
      const adjustedMonth = targetMonth % 12;
      
      let startDate, endDate;
      
      if (monthOffset === 0) {
        // Current month - start from today
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      } else {
        // Future months - full month
        startDate = new Date(targetYear, adjustedMonth, 1);
        endDate = new Date(targetYear, adjustedMonth + 1, 0);
      }
      
      const newEntries = generateRecurringEntries(schedule, startDate, endDate);
      
      if (newEntries.length === 0) {
        alert('No new entries to add. All dates already have schedule entries.');
        return;
      }
      
      const monthName = new Date(targetYear, adjustedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const monthText = monthOffset === 0 ? `rest of ${monthName}` : monthName;
      
      if (!window.confirm(`This will add ${newEntries.length} schedule entries for ${monthText}. Continue?`)) {
        return;
      }
      
      // Save all entries
      for (const entry of newEntries) {
        await onSave(entry);
      }
      
      alert(`Successfully added ${newEntries.length} recurring schedule entries for ${monthText}!`);
      
    } catch (error) {
      console.error('Error applying recurring schedule:', error);
      alert('Failed to apply recurring schedule');
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const handlePatternChange = (pattern) => {
    const patterns = {
      'monday-friday': {
        days: {
          monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
          saturday: false, sunday: false
        },
        name: 'Monday-Friday Schedule'
      },
      'tuesday-saturday': {
        days: {
          monday: false, tuesday: true, wednesday: true, thursday: true, friday: true,
          saturday: true, sunday: false
        },
        name: 'Tuesday-Saturday Schedule'
      },
      'custom': {
        days: newRecurringSchedule.days,
        name: newRecurringSchedule.name || 'Custom Schedule'
      }
    };
    
    const selectedPattern = patterns[pattern];
    
    setNewRecurringSchedule({
      ...newRecurringSchedule,
      pattern,
      days: selectedPattern.days,
      // Only auto-populate name if it's empty or matches a previous pattern name
      name: (!newRecurringSchedule.name || 
             newRecurringSchedule.name === 'Monday-Friday Schedule' || 
             newRecurringSchedule.name === 'Tuesday-Saturday Schedule' ||
             newRecurringSchedule.name === 'Custom Schedule') 
            ? selectedPattern.name 
            : newRecurringSchedule.name
    });
  };

  const generateRecurringEntries = (schedule, startDate, endDate) => {
    const entries = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const dayMap = {
      0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
      4: 'thursday', 5: 'friday', 6: 'saturday'
    };
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayName = dayMap[date.getDay()];
      
      if (schedule.days[dayName]) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Check if entry already exists for this date
        const existingEntry = scheduleEntries.find(entry => entry.date === dateStr);
        if (!existingEntry) {
          entries.push({
            date: dateStr,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            is_available: 1,
            notes: `Auto-generated from ${schedule.name}`
          });
        }
      }
    }
    
    return entries;
  };

  const getMonthNames = (startMonths = 0, count = 1) => {
    const today = new Date();
    const months = [];
    
    for (let i = startMonths; i < startMonths + count; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      
      if (i === 0) {
        // Current month - show "rest of [month]"
        months.push(`rest of ${monthName}`);
      } else {
        // Future months - show full month name
        months.push(monthName);
      }
    }
    
    return months;
  };

  const handleApplyRecurringSchedule = async (schedule, months = 1) => {
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endDate = new Date(today.getFullYear(), today.getMonth() + months, 0); // Last day of target month
      
      const newEntries = generateRecurringEntries(schedule, startDate, endDate);
      
      if (newEntries.length === 0) {
        alert('No new entries to add. All dates already have schedule entries.');
        return;
      }
      
      const monthNames = getMonthNames(0, months);
      const monthsText = monthNames.length === 1 
        ? monthNames[0] 
        : monthNames.slice(0, -1).join(', ') + ' and ' + monthNames[monthNames.length - 1];
      
      if (!window.confirm(`This will add ${newEntries.length} schedule entries for ${monthsText}. Continue?`)) {
        return;
      }
      
      // Save all entries
      for (const entry of newEntries) {
        await onSave(entry);
      }
      
      alert(`Successfully added ${newEntries.length} recurring schedule entries!`);
      
    } catch (error) {
      console.error('Error applying recurring schedule:', error);
      alert('Failed to apply recurring schedule');
    }
  };

  const saveRecurringSchedule = () => {
    if (!newRecurringSchedule.name.trim()) {
      alert('Please enter a name for this recurring schedule');
      return;
    }
    
    if (!newRecurringSchedule.start_time || !newRecurringSchedule.end_time) {
      alert('Please set start and end times');
      return;
    }
    
    if (newRecurringSchedule.start_time >= newRecurringSchedule.end_time) {
      alert('Start time must be before end time');
      return;
    }
    
    const hasSelectedDays = Object.values(newRecurringSchedule.days).some(day => day);
    if (!hasSelectedDays) {
      alert('Please select at least one day of the week');
      return;
    }
    
    const newSchedule = { ...newRecurringSchedule, id: Date.now() };
    setRecurringSchedules([...recurringSchedules, newSchedule]);
    
    // Reset form
    setNewRecurringSchedule({
      name: 'Monday-Friday Schedule',
      pattern: 'monday-friday',
      start_time: '11:00',
      end_time: '19:00',
      days: {
        monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
        saturday: false, sunday: false
      }
    });
    
    setShowRecurringForm(false);
  };

  if (!show) return null;

  return (
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
        maxWidth: '1200px',
        width: '95%',
        maxHeight: '95vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#2EABE2' }}>
          📅 Manage Schedule - {specialist?.name}
        </h3>

        {/* Applied Patterns Status */}
        {getAppliedPatterns().length > 0 && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', border: '1px solid #28a745' }}>
            <h4 style={{ marginBottom: '10px', color: '#155724', fontSize: '16px' }}>✅ Active Recurring Patterns</h4>
            <div style={{ fontSize: '14px', color: '#155724' }}>
              {getAppliedPatterns().map((pattern, index) => (
                <div key={pattern} style={{ marginBottom: '5px' }}>
                  • <strong>{pattern}</strong> - Auto-scheduling is active
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#1e293b', marginTop: '10px' }}>
              💡 Days covered by patterns are disabled in Quick Add section
            </div>
          </div>
        )}

        {/* Quick Add for Next 7 Days */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h4 style={{ marginBottom: '15px', color: '#333' }}>Quick Add - Next 7 Days</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '15px' }}>
            {getNextWeekDays().map(day => (
              <button
                key={day.date}
                className={`btn ${day.isDisabled ? 'btn-disabled' : 'btn-secondary'}`}
                style={{ 
                  padding: '8px 4px', 
                  fontSize: '11px',
                  backgroundColor: day.isDisabled 
                    ? 'white' 
                    : newEntry.date === day.date 
                      ? 'white' 
                      : 'white',
                  color: day.isDisabled ? '#1e293b' : newEntry.date === day.date ? '#1e293b' : '#1e293b',
                  border: day.isDisabled ? '1px solid #e9ecef' : newEntry.date === day.date ? '2px solid #28a745' : '1px solid #ddd',
                  cursor: day.isDisabled ? 'not-allowed' : 'pointer',
                  opacity: 1,
                  position: 'relative'
                }}
                onClick={() => !day.isDisabled && setNewEntry({...newEntry, date: day.date})}
                disabled={day.isDisabled}
                title={day.isDisabled ? 'This day is covered by a recurring pattern' : `Add schedule for ${day.dayName} ${day.dayDate}`}
              >
                {day.dayName}<br/>{day.dayDate}
                {day.isAutoGenerated && (
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#28a745',
                    borderRadius: '50%',
                    fontSize: '8px'
                  }} title="Auto-generated pattern">
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: editingEntry ? '1fr 1fr 1fr 1fr 1fr 140px' : '1fr 1fr 1fr 1fr 1fr 120px', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>Date</label>
              <input
                type="date"
                value={newEntry.date}
                min={getTodayDate()}
                onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', height: '40px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>From</label>
              <input
                type="time"
                value={newEntry.start_time}
                onChange={(e) => setNewEntry({...newEntry, start_time: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', height: '40px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>To</label>
              <input
                type="time"
                value={newEntry.end_time}
                onChange={(e) => setNewEntry({...newEntry, end_time: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', height: '40px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>Status</label>
              <select
                value={newEntry.is_available}
                onChange={(e) => setNewEntry({...newEntry, is_available: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', height: '40px', boxSizing: 'border-box' }}
              >
                <option value={1}>Available</option>
                <option value={0}>Unavailable</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>Notes</label>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newEntry.notes}
                onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', height: '40px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>Actions</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={handleSaveEntry}
                  className="btn"
                  style={{ padding: '8px 12px', minWidth: '50px', backgroundColor: editingEntry ? '#28a745' : '#007bff', color: 'white' }}
                >
                  {editingEntry ? '✓' : '➕'}
                </button>
                {editingEntry && (
                  <button
                    onClick={handleCancelEdit}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', minWidth: '50px', color: 'white' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recurring Weekly Timetable */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff4e6', borderRadius: '8px', border: '1px solid #ffa500' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: '#333' }}>🔄 Recurring Weekly Timetable</h4>
            <button
              onClick={() => setShowRecurringForm(!showRecurringForm)}
              className="btn"
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              {showRecurringForm ? 'Cancel' : '+ New Pattern'}
            </button>
          </div>
          
          {showRecurringForm && (
            <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h5 style={{ marginBottom: '15px', color: '#333' }}>Create New Recurring Schedule</h5>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>Schedule Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Regular Working Hours"
                    value={newRecurringSchedule.name}
                    onChange={(e) => setNewRecurringSchedule({...newRecurringSchedule, name: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>Quick Pattern</label>
                  <select
                    value={newRecurringSchedule.pattern}
                    onChange={(e) => handlePatternChange(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  >
                    <option value="monday-friday">Monday - Friday</option>
                    <option value="tuesday-saturday">Tuesday - Saturday</option>
                    <option value="custom">Custom Days</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>Start Time</label>
                  <input
                    type="time"
                    value={newRecurringSchedule.start_time}
                    onChange={(e) => setNewRecurringSchedule({...newRecurringSchedule, start_time: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>End Time</label>
                  <input
                    type="time"
                    value={newRecurringSchedule.end_time}
                    onChange={(e) => setNewRecurringSchedule({...newRecurringSchedule, end_time: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                </div>
              </div>
              
              {newRecurringSchedule.pattern === 'custom' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', fontWeight: '500', color: '#333' }}>Working Days</label>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newRecurringSchedule.days[day]}
                          onChange={(e) => setNewRecurringSchedule({
                            ...newRecurringSchedule,
                            days: { ...newRecurringSchedule.days, [day]: e.target.checked }
                          })}
                        />
                        <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{day.slice(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={saveRecurringSchedule}
                className="btn"
                style={{ padding: '10px 20px', marginBottom: '15px' }}
              >
                Save Recurring Schedule
              </button>

              {/* Immediate Apply Period Buttons */}
              <div style={{ marginTop: '15px' }}>
                <h6 style={{ marginBottom: '10px', color: '#333', fontSize: '14px' }}>Apply Current Schedule For:</h6>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(() => {
                    // Check if current form has valid data
                    const hasValidSchedule = newRecurringSchedule.start_time && 
                                            newRecurringSchedule.end_time && 
                                            Object.values(newRecurringSchedule.days).some(day => day);
                    
                    if (!hasValidSchedule) {
                      return <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                        Set schedule times and select days to see apply options
                      </div>;
                    }

                    const today = new Date();
                    const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });
                    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1).toLocaleDateString('en-US', { month: 'long' });
                    const thirdMonth = new Date(today.getFullYear(), today.getMonth() + 2).toLocaleDateString('en-US', { month: 'long' });

                    // Calculate available dates for individual months
                    const availableCurrentMonth = getAvailableDatesForSingleMonth(newRecurringSchedule, 0);
                    const availableNextMonth = getAvailableDatesForSingleMonth(newRecurringSchedule, 1);
                    const availableThirdMonth = getAvailableDatesForSingleMonth(newRecurringSchedule, 2);

                    return (
                      <>
                        <button
                          onClick={() => handleApplyRecurringSingleMonth(newRecurringSchedule, 0)}
                          className="btn"
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px', 
                            backgroundColor: availableCurrentMonth > 0 ? '#28a745' : '#6c757d', 
                            color: 'white', 
                            whiteSpace: 'nowrap',
                            cursor: availableCurrentMonth > 0 ? 'pointer' : 'not-allowed',
                            opacity: availableCurrentMonth > 0 ? 1 : 0.6,
                            border: 'none',
                            borderRadius: '4px'
                          }}
                          title={`Apply to ${availableCurrentMonth} available dates in rest of ${currentMonth}`}
                          disabled={availableCurrentMonth === 0}
                        >
                          📅 Rest of {currentMonth} ({availableCurrentMonth})
                        </button>
                        <button
                          onClick={() => handleApplyRecurringSingleMonth(newRecurringSchedule, 1)}
                          className="btn"
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px', 
                            backgroundColor: availableNextMonth > 0 ? '#fd7e14' : '#6c757d', 
                            color: 'white', 
                            whiteSpace: 'nowrap',
                            cursor: availableNextMonth > 0 ? 'pointer' : 'not-allowed',
                            opacity: availableNextMonth > 0 ? 1 : 0.6,
                            border: 'none',
                            borderRadius: '4px'
                          }}
                          title={`Apply to ${availableNextMonth} available dates in ${nextMonth}`}
                          disabled={availableNextMonth === 0}
                        >
                          📅 {nextMonth} ({availableNextMonth})
                        </button>
                        <button
                          onClick={() => handleApplyRecurringSingleMonth(newRecurringSchedule, 2)}
                          className="btn"
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px', 
                            backgroundColor: availableThirdMonth > 0 ? '#17a2b8' : '#6c757d', 
                            color: 'white', 
                            whiteSpace: 'nowrap',
                            cursor: availableThirdMonth > 0 ? 'pointer' : 'not-allowed',
                            opacity: availableThirdMonth > 0 ? 1 : 0.6,
                            border: 'none',
                            borderRadius: '4px'
                          }}
                          title={`Apply to ${availableThirdMonth} available dates in ${thirdMonth}`}
                          disabled={availableThirdMonth === 0}
                        >
                          📅 {thirdMonth} ({availableThirdMonth})
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          
          {/* Saved Recurring Schedules */}
          {recurringSchedules.length > 0 && (
            <div>
              <h5 style={{ marginBottom: '15px', color: '#333' }}>Saved Patterns</h5>
              <div style={{ display: 'grid', gap: '10px' }}>
                {recurringSchedules.map(schedule => {
                  const activeDays = Object.entries(schedule.days)
                    .filter(([day, active]) => active)
                    .map(([day]) => day.slice(0, 3).toUpperCase())
                    .join(', ');
                  
                  return (
                    <div
                      key={schedule.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 150px 80px',
                        gap: '15px',
                        padding: '15px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{schedule.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{activeDays}</div>
                      </div>
                      <div style={{ fontSize: '14px' }}>{formatTime(schedule.start_time)}</div>
                      <div style={{ fontSize: '14px' }}>{formatTime(schedule.end_time)}</div>
                      <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                        {(() => {
                          const available1Month = getAvailableDatesForPattern(schedule, 1);
                          const available2Months = getAvailableDatesForPattern(schedule, 2);
                          const available3Months = getAvailableDatesForPattern(schedule, 3);
                          
                          return (
                            <>
                              <button
                                onClick={() => handleApplyRecurringSchedule(schedule, 1)}
                                className="btn"
                                style={{ 
                                  padding: '4px 6px', 
                                  fontSize: '10px', 
                                  backgroundColor: available1Month > 0 ? '#28a745' : '#6c757d', 
                                  color: 'white', 
                                  whiteSpace: 'nowrap',
                                  cursor: available1Month > 0 ? 'pointer' : 'not-allowed',
                                  opacity: available1Month > 0 ? 1 : 0.6,
                                  marginBottom: '2px'
                                }}
                                title={`${available1Month} dates available in ${getMonthNames(0, 1)[0]}`}
                                disabled={available1Month === 0}
                              >
                                📅 {getMonthNames(0, 1)[0]} ({available1Month})
                              </button>
                              <button
                                onClick={() => handleApplyRecurringSchedule(schedule, 2)}
                                className="btn"
                                style={{ 
                                  padding: '4px 6px', 
                                  fontSize: '10px', 
                                  backgroundColor: available2Months > 0 ? '#fd7e14' : '#6c757d', 
                                  color: 'white', 
                                  whiteSpace: 'nowrap',
                                  cursor: available2Months > 0 ? 'pointer' : 'not-allowed',
                                  opacity: available2Months > 0 ? 1 : 0.6,
                                  marginBottom: '2px'
                                }}
                                title={`${available2Months} dates available in ${getMonthNames(0, 2).join(', ')}`}
                                disabled={available2Months === 0}
                              >
                                📅 2 months ({available2Months})
                              </button>
                              <button
                                onClick={() => handleApplyRecurringSchedule(schedule, 3)}
                                className="btn"
                                style={{ 
                                  padding: '4px 6px', 
                                  fontSize: '10px', 
                                  backgroundColor: available3Months > 0 ? '#17a2b8' : '#6c757d', 
                                  color: 'white', 
                                  whiteSpace: 'nowrap',
                                  cursor: available3Months > 0 ? 'pointer' : 'not-allowed',
                                  opacity: available3Months > 0 ? 1 : 0.6
                                }}
                                title={`${available3Months} dates available in ${getMonthNames(0, 3).join(', ')}`}
                                disabled={available3Months === 0}
                              >
                                📅 3 months ({available3Months})
                              </button>
                            </>
                          );
                        })()}
                      </div>
                      <div>
                        <button
                          onClick={() => setRecurringSchedules(recurringSchedules.filter(s => s.id !== schedule.id))}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px', fontSize: '12px' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {recurringSchedules.length === 0 && !showRecurringForm && (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              <p>Create recurring weekly patterns to automatically fill your schedule!</p>
              <p style={{ fontSize: '14px' }}>💡 Examples: Mon-Fri 11am-7pm, Tue-Sat 11am-7pm</p>
            </div>
          )}
        </div>

        {/* Current Schedule */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '15px', color: '#333' }}>Current Schedule</h4>
          {scheduleEntries.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#1e293b', backgroundColor: 'white', borderRadius: '5px', border: '1px solid #e9ecef' }}>
              No schedule entries found. Add availability above to get started.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {scheduleEntries
                .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
                .map(entry => (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 120px 120px 1fr 120px',
                    gap: '20px',
                    padding: '20px',
                    backgroundColor: entry.notes && entry.notes.includes('Auto-generated') 
                      ? (entry.is_available ? '#e8f8e8' : '#ffe0e0')
                      : (entry.is_available ? '#e8f5e8' : '#ffe8e8'),
                    borderRadius: '8px',
                    alignItems: 'center',
                    border: entry.notes && entry.notes.includes('Auto-generated') 
                      ? '2px solid #28a745' 
                      : '1px solid transparent',
                    position: 'relative'
                  }}
                >
                  {entry.notes && entry.notes.includes('Auto-generated') && (
                    <div style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      PATTERN
                    </div>
                  )}
                  <div style={{ fontWeight: 'bold' }}>
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div>{formatTime(entry.start_time)}</div>
                  <div>{formatTime(entry.end_time)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      backgroundColor: entry.is_available ? '#28a745' : '#dc3545',
                      color: 'white'
                    }}>
                      {entry.is_available ? 'Available' : 'Unavailable'}
                    </span>
                    {entry.notes && (
                      <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                        "{entry.notes}"
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="btn btn-primary"
                      style={{ padding: '5px 8px', fontSize: '12px' }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="btn btn-danger"
                      style={{ padding: '5px 8px', fontSize: '12px' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScheduleModal;