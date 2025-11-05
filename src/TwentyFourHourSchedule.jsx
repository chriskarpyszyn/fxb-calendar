import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './App.css';
import LiveStreamBanner from './components/LiveStreamBanner';
import useTwitchStatus from './hooks/useTwitchStatus';

export default function TwentyFourHourSchedule() {
  const { channelName } = useParams();
  // Default to 'itsflannelbeard' for backward compatibility with /24hour-schedule route
  const normalizedChannel = channelName?.toLowerCase().trim() || 'itsflannelbeard';
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const twitchStatus = useTwitchStatus(normalizedChannel);

  // Load schedule data from API
  useEffect(() => {
    fetch(`/api/get-24hour-schedule?channelName=${encodeURIComponent(normalizedChannel)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load 24-hour schedule');
        }
        return response.json();
      })
      .then(data => {
        // Always preserve all metadata fields
        setScheduleData({
          channelName: data?.channelName || normalizedChannel,
          date: data?.date || '',
          startDate: data?.startDate || '',
          endDate: data?.endDate || '',
          startTime: data?.startTime || '',
          endTime: data?.endTime || '',
          timeSlots: data?.timeSlots || [],
          categories: data?.categories || {}
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [normalizedChannel]);

  // Get user's timezone
  const getUserTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  // Calculate the number of hours between start and end times
  const calculateHoursBetween = (startDate, startTime, endDate, endTime) => {
    if (!startDate || !startTime || !endDate || !endTime) {
      console.log('Missing date/time values:', { startDate, startTime, endDate, endTime });
      return 0;
    }

    try {
      // Parse start date and time (format: "HH:MM" in 24-hour format)
      const [startHour, startMinute] = startTime.split(':').map(Number);
      if (isNaN(startHour) || isNaN(startMinute)) {
        console.error('Invalid startTime format:', startTime);
        return 0;
      }
      
      // Create date string in ISO format to avoid timezone issues
      const startDateStr = `${startDate}T${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
      const startDateTime = new Date(startDateStr);

      // Parse end date and time
      const [endHour, endMinute] = endTime.split(':').map(Number);
      if (isNaN(endHour) || isNaN(endMinute)) {
        console.error('Invalid endTime format:', endTime);
        return 0;
      }
      
      const endDateStr = `${endDate}T${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;
      const endDateTime = new Date(endDateStr);

      // Check if dates are valid
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        console.error('Invalid dates created:', { startDateStr, endDateStr, startDateTime, endDateTime });
        return 0;
      }

      // Calculate difference in milliseconds, then convert to hours
      const diffMs = endDateTime.getTime() - startDateTime.getTime();
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60)); // Round up to include partial hours

      console.log('Date calculation:', {
        startDateStr,
        endDateStr,
        diffMs,
        diffHours
      });

      return Math.max(0, diffHours);
    } catch (error) {
      console.error('Error calculating hours between:', error, { startDate, startTime, endDate, endTime });
      return 0;
    }
  };

  // Calculate time range for a specific hour slot
  const calculateSlotTimeRange = (hourOffset, startDate, startTime) => {
    if (!startDate || !startTime) {
      return `Hour ${hourOffset}`;
    }

    try {
      // Parse start date and time (format: "HH:MM" in 24-hour format)
      const [startHour, startMinute] = startTime.split(':').map(Number);
      if (isNaN(startHour) || isNaN(startMinute)) {
        return `Hour ${hourOffset}`;
      }
      
      // Create date string in ISO format to avoid timezone issues
      const startDateStr = `${startDate}T${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
      const startDateTime = new Date(startDateStr);
      
      if (isNaN(startDateTime.getTime())) {
        return `Hour ${hourOffset}`;
      }

      // Calculate the start time for this hour slot (hour offset from start)
      const slotStartTime = new Date(startDateTime);
      slotStartTime.setHours(slotStartTime.getHours() + hourOffset);

      // Calculate the end time for this hour slot (one hour later)
      const slotEndTime = new Date(slotStartTime);
      slotEndTime.setHours(slotEndTime.getHours() + 1);

      // Convert to user's timezone
      const userTimezone = getUserTimezone();

      // Format times in 12-hour format with am/pm
      const formatTime = (date) => {
        try {
          return new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }).format(date).replace(/\s/g, '');
        } catch (error) {
          console.error('Date formatting error:', error, date);
          return '';
        }
      };

      const startTimeLocal = formatTime(slotStartTime);
      const endTimeLocal = formatTime(slotEndTime);

      return `${startTimeLocal} - ${endTimeLocal}`;
    } catch (error) {
      console.error('Error calculating slot time range:', error);
      return `Hour ${hourOffset}`;
    }
  };

  // Generate complete schedule array with all slots from start to end
  const generateCompleteSchedule = () => {
    if (!scheduleData) return [];

    const { startDate, startTime, endDate, endTime, timeSlots } = scheduleData;

    // Debug logging
    console.log('Schedule data:', { startDate, startTime, endDate, endTime, timeSlotsCount: timeSlots?.length });

    // Determine total hours to generate
    let totalHours = 0;
    let useMetadata = false;

    // If we have startDate and startTime, use metadata to calculate range
    if (startDate && startTime) {
      useMetadata = true;
      if (endDate && endTime) {
        totalHours = calculateHoursBetween(startDate, startTime, endDate, endTime);
        console.log('Calculated hours from start to end:', totalHours);
      } else {
        // Default to 24 hours if end time is not specified
        totalHours = 24;
        console.log('End time not specified, defaulting to 24 hours');
      }
    } else {
      // If no metadata, always generate 24 hours (starting from hour 0)
      totalHours = 24;
      console.log('No metadata found, defaulting to 24 hours from hour 0');
    }
    
    // Ensure we always have at least 24 hours if we have any schedule data
    if (totalHours === 0) {
      totalHours = 24;
      console.log('Total hours was 0, defaulting to 24 hours');
    }
    
    // Ensure minimum of 24 hours
    if (totalHours < 24) {
      console.log('Total hours less than 24, setting to 24');
      totalHours = 24;
    }

    // Create a map of existing slots by hour offset
    const slotsByHour = {};
    if (timeSlots) {
      timeSlots.forEach(slot => {
        slotsByHour[slot.hour] = slot;
      });
    }

    // Generate complete schedule array
    const completeSchedule = [];
    for (let hourOffset = 0; hourOffset < totalHours; hourOffset++) {
      const existingSlot = slotsByHour[hourOffset];
      
      if (existingSlot) {
        // Use existing slot data
        let slotTime = existingSlot.time;
        // If we have metadata, recalculate time to ensure consistency
        if (useMetadata && startDate && startTime) {
          slotTime = calculateSlotTimeRange(hourOffset, startDate, startTime);
        }
        // If existing slot doesn't have time, generate one
        if (!slotTime && useMetadata && startDate && startTime) {
          slotTime = calculateSlotTimeRange(hourOffset, startDate, startTime);
        } else if (!slotTime) {
          // Fallback: generate hour-based time
          slotTime = `Hour ${hourOffset}`;
        }
        
        completeSchedule.push({
          ...existingSlot,
          hour: hourOffset,
          time: slotTime
        });
      } else {
        // Create placeholder slot
        let slotTime;
        if (useMetadata && startDate && startTime) {
          slotTime = calculateSlotTimeRange(hourOffset, startDate, startTime);
        } else {
          // Generate a simple hour-based time string
          const hour = hourOffset % 24;
          const period = hour >= 12 ? 'pm' : 'am';
          const displayHour = hour % 12 || 12;
          const nextHour = (hourOffset + 1) % 24;
          const nextPeriod = nextHour >= 12 ? 'pm' : 'am';
          const nextDisplayHour = nextHour % 12 || 12;
          slotTime = `${displayHour}:00${period} - ${nextDisplayHour}:00${nextPeriod}`;
        }
        
        completeSchedule.push({
          hour: hourOffset,
          time: slotTime,
          category: '',
          activity: 'TBD',
          description: 'Open slot',
          isPlaceholder: true
        });
      }
    }

    console.log('Generated complete schedule with', completeSchedule.length, 'slots');
    return completeSchedule;
  };

  // Convert time to user's local timezone
  const convertTimeToUserTimezone = (timeString) => {
    try {
      // Parse "11:00pm - 12:00am" format
      const match = timeString.match(/(\d{1,2}):(\d{2})(am|pm)\s*-\s*(\d{1,2}):(\d{2})(am|pm)/);
      if (!match) return timeString; // Return original if parsing fails
    
    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;
    
    // Convert to 24-hour format
    const convertTo24Hour = (hour, period) => {
      let h = parseInt(hour);
      if (period.toLowerCase() === 'pm' && h !== 12) h += 12;
      if (period.toLowerCase() === 'am' && h === 12) h = 0;
      return h;
    };
    
    const startHour24 = convertTo24Hour(startHour, startPeriod);
    const endHour24 = convertTo24Hour(endHour, endPeriod);
    
    // Create Date objects for November 6, 2025 (using EST, UTC-5 since it's Standard Time in November)
    const year = 2025;
    const month = 11; // November
    const day = 6;
    
    // Handle day rollover for times after midnight
    const actualDay = startHour24 < 12 ? day + 1 : day;
    
    // Create dates more safely
    const startDateStr = `${year}-${month.toString().padStart(2, '0')}-${actualDay.toString().padStart(2, '0')}T${startHour24.toString().padStart(2, '0')}:${startMin}:00-05:00`;
    const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${actualDay.toString().padStart(2, '0')}T${endHour24.toString().padStart(2, '0')}:${endMin}:00-05:00`;
    
    const estStartTime = new Date(startDateStr);
    const estEndTime = new Date(endDateStr);
    
    // Check if dates are valid
    if (isNaN(estStartTime.getTime()) || isNaN(estEndTime.getTime())) {
      console.error('Invalid date created:', { startDateStr, endDateStr, startHour24, endHour24, actualDay });
      return timeString; // Return original if date creation fails
    }
    
    // Convert to user's timezone
    const userTimezone = getUserTimezone();
    
    // Format the converted times
    const formatTime = (date) => {
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(date).replace(/\s/g, '');
      } catch (error) {
        console.error('Date formatting error:', error, date);
        return timeString;
      }
    };
    
    const startTimeLocal = formatTime(estStartTime);
    const endTimeLocal = formatTime(estEndTime);
    
    return `${startTimeLocal} - ${endTimeLocal}`;
    } catch (error) {
      console.error('Timezone conversion error:', error, timeString);
      return timeString; // Return original if any error occurs
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading 24-hour schedule...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className="retro-container p-6 retro-glow mb-4">
            <h1 className="retro-title text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 leading-tight">
              {normalizedChannel.toUpperCase()}'S<br />
              24 HOUR STREAM SCHEDULE
            </h1>
            <p className="retro-text text-retro-muted text-sm sm:text-base md:text-lg font-mono">
              {scheduleData.date}
            </p>
            <p className="retro-text text-retro-muted text-xs sm:text-sm font-mono mt-2">
              All times shown in your timezone: {getUserTimezone()}
            </p>
            <div className="mt-4">
              <Link
                to={`/schedule/${normalizedChannel}/admin`}
                className="inline-block retro-button hover:scale-105 active:scale-95 text-sm"
              >
                Manage Schedule
              </Link>
            </div>
          </div>
        </div>

        {/* Live Stream Banner */}
        <LiveStreamBanner twitchStatus={twitchStatus} />

        {/* Schedule Grid */}
        <div className="retro-container p-4 md:p-6 retro-glow">
          {(() => {
            const completeSchedule = generateCompleteSchedule();
            
            if (completeSchedule.length === 0) {
              return (
                <div className="text-center py-12">
                  <p className="text-retro-muted text-lg">
                    No schedule slots yet. Check back soon!
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {completeSchedule.map((slot, index) => {
                  const categoryColor = scheduleData.categories[slot.category];
                  const isPlaceholder = slot.isPlaceholder;
                  const isFirstSlot = index === 0; // First slot gets day heading
                  const isSixHourMark = slot.hour % 6 === 0 && slot.hour > 0; // Every 6 hours (but not hour 0)
                  
                  // Determine if this is a day boundary (crossing midnight)
                  const previousSlot = index > 0 ? completeSchedule[index - 1] : null;
                  let isDayBoundary = false;
                  
                  if (previousSlot && scheduleData.startDate && scheduleData.startTime) {
                    try {
                      // Calculate the actual dates for both slots to detect day boundary
                      const [startHour, startMinute] = scheduleData.startTime.split(':').map(Number);
                      const startDateTime = new Date(scheduleData.startDate);
                      startDateTime.setHours(startHour, startMinute, 0, 0);
                      
                      const prevSlotDateTime = new Date(startDateTime);
                      prevSlotDateTime.setHours(prevSlotDateTime.getHours() + previousSlot.hour);
                      
                      const currentSlotDateTime = new Date(startDateTime);
                      currentSlotDateTime.setHours(currentSlotDateTime.getHours() + slot.hour);
                      
                      // Check if the date changed (day boundary crossed)
                      const prevDate = prevSlotDateTime.toDateString();
                      const currentDate = currentSlotDateTime.toDateString();
                      isDayBoundary = prevDate !== currentDate;
                    } catch (error) {
                      // Fallback: check time string patterns
                      const currentTime = slot.time;
                      const prevTime = previousSlot?.time || '';
                      isDayBoundary = prevTime.includes('pm') && currentTime.includes('12:00am');
                    }
                  }
                  
                  return (
                    <div key={`slot-${slot.hour}-${index}`}>
                      {/* Day heading for first slot */}
                      {isFirstSlot && scheduleData.startDate && (
                        <div className="text-center my-6">
                          <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm">
                            {new Date(scheduleData.startDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric' 
                            }).toUpperCase()}
                          </div>
                        </div>
                      )}
                      
                      {/* Day separator at day boundary */}
                      {isDayBoundary && scheduleData.startDate && scheduleData.startTime && (() => {
                        try {
                          // Calculate the actual date for this slot
                          const [startHour, startMinute] = scheduleData.startTime.split(':').map(Number);
                          const startDateTime = new Date(scheduleData.startDate);
                          startDateTime.setHours(startHour, startMinute, 0, 0);
                          
                          const currentSlotDateTime = new Date(startDateTime);
                          currentSlotDateTime.setHours(currentSlotDateTime.getHours() + slot.hour);
                          
                          return (
                            <div className="text-center my-6">
                              <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm">
                                {currentSlotDateTime.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'long', 
                                  day: 'numeric' 
                                }).toUpperCase()}
                              </div>
                            </div>
                          );
                        } catch (error) {
                          return null;
                        }
                      })()}
                      
                      {/* 6-hour separator */}
                      {isSixHourMark && !isDayBoundary && (
                        <div className="border-t border-gray-400 my-4"></div>
                      )}
                      
                      {/* Time slot */}
                      <div
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          isPlaceholder 
                            ? 'bg-gray-100 border-gray-300 border-dashed opacity-75' 
                            : categoryColor 
                              ? `${categoryColor.bg} ${categoryColor.border} hover:shadow-lg` 
                              : 'bg-gray-50 border-gray-300 hover:shadow-lg'
                        }`}
                      >
                        <div className="grid grid-cols-12 gap-4 items-start">
                          {/* Time Column - 3 columns */}
                          <div className="col-span-3">
                            <div className={`text-lg font-bold ${isPlaceholder ? 'text-gray-500' : 'text-gray-800'}`}>
                              {slot.time}
                            </div>
                          </div>
                          
                          {/* Category Column - 3 columns */}
                          <div className="col-span-3">
                            <div 
                              className={`text-sm font-semibold ${
                                isPlaceholder 
                                  ? 'text-gray-400 italic' 
                                  : categoryColor 
                                    ? categoryColor.text 
                                    : 'text-gray-800'
                              }`}
                            >
                              {isPlaceholder ? '—' : slot.category || '—'}
                            </div>
                          </div>
                          
                          {/* Activity/Subject Column - 6 columns */}
                          <div className="col-span-6">
                            <div className={`text-base font-bold mb-1 ${isPlaceholder ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                              {slot.activity || '—'}
                            </div>
                            <div className={`text-sm ${isPlaceholder ? 'text-gray-400 italic' : 'text-gray-600'}`}>
                              {slot.description || '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="retro-container p-4 retro-glow">
            <p className="text-sm text-gray-400">
              Join the 24-hour stream adventure! 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
