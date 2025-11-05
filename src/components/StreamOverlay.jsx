import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function StreamOverlay() {
  const { channelName } = useParams();
  const normalizedChannel = channelName?.toLowerCase().trim() || 'itsflannelbeard';
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlot, setCurrentSlot] = useState(null);
  const [upcomingSlots, setUpcomingSlots] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load schedule data from API
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const response = await fetch(`/api/get-24hour-schedule?channelName=${encodeURIComponent(normalizedChannel)}`);
        if (!response.ok) {
          throw new Error('Failed to load schedule');
        }
        const data = await response.json();
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
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error loading schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [normalizedChannel]);

  // Calculate time range for a specific hour slot
  const calculateSlotTimeRange = (hourOffset, startDate, startTime) => {
    if (!startDate || !startTime) {
      return null;
    }

    try {
      // Parse start date and time (format: "HH:MM" in 24-hour format)
      const [startHour, startMinute] = startTime.split(':').map(Number);
      if (isNaN(startHour) || isNaN(startMinute)) {
        return null;
      }
      
      // Create date string in ISO format to avoid timezone issues
      const startDateStr = `${startDate}T${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
      const startDateTime = new Date(startDateStr);
      
      if (isNaN(startDateTime.getTime())) {
        return null;
      }

      // Calculate the start time for this hour slot (hour offset from start)
      const slotStartTime = new Date(startDateTime);
      slotStartTime.setHours(slotStartTime.getHours() + hourOffset);

      // Calculate the end time for this hour slot (one hour later)
      const slotEndTime = new Date(slotStartTime);
      slotEndTime.setHours(slotEndTime.getHours() + 1);

      return {
        start: slotStartTime,
        end: slotEndTime
      };
    } catch (error) {
      console.error('Error calculating slot time range:', error);
      return null;
    }
  };

  // Format time for display (12-hour format in user's timezone)
  const formatTime = (date) => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date).replace(/\s/g, '');
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // Calculate current and upcoming slots
  useEffect(() => {
    if (!scheduleData || !scheduleData.startDate || !scheduleData.startTime) {
      setCurrentSlot(null);
      setUpcomingSlots([]);
      return;
    }

    const now = currentTime;

    // Create a map of slots with their actual start/end times
    const slotsWithTimes = scheduleData.timeSlots
      .map(slot => {
        const timeRange = calculateSlotTimeRange(
          slot.hour,
          scheduleData.startDate,
          scheduleData.startTime
        );
        
        if (!timeRange) return null;

        return {
          ...slot,
          startTime: timeRange.start,
          endTime: timeRange.end,
          timeRange
        };
      })
      .filter(slot => slot !== null)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Find current slot
    const current = slotsWithTimes.find(slot => {
      return now >= slot.startTime && now < slot.endTime;
    });

    // Find upcoming slots (next 1-2 slots after current time)
    // If we have a current slot, show next slots after it ends
    // Otherwise, show next slots from now
    const upcoming = slotsWithTimes
      .filter(slot => {
        if (current) {
          return slot.startTime >= current.endTime;
        }
        return slot.startTime > now;
      })
      .slice(0, 2);

    setCurrentSlot(current || null);
    setUpcomingSlots(upcoming);
  }, [scheduleData, currentTime]);

  // Update current time every minute and check for transitions
  useEffect(() => {
    let minuteInterval = null;
    
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    // Update immediately
    updateTime();

    // Update every 60 seconds as primary check
    const interval = setInterval(updateTime, 60000);

    // Also check on minute boundaries for activity transitions
    const now = new Date();
    const msUntilNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    
    const minuteCheck = setTimeout(() => {
      updateTime();
      // After the first minute check, continue checking every minute
      minuteInterval = setInterval(updateTime, 60000);
    }, Math.max(100, msUntilNextMinute));

    return () => {
      clearInterval(interval);
      clearTimeout(minuteCheck);
      if (minuteInterval) {
        clearInterval(minuteInterval);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="text-white text-lg font-semibold">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="text-red-400 text-lg font-semibold">Error: {error}</div>
      </div>
    );
  }

  if (!scheduleData || scheduleData.timeSlots.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="text-gray-300 text-lg font-semibold">No schedule available</div>
      </div>
    );
  }

  const getCategoryColor = (category) => {
    if (!category || !scheduleData.categories[category]) {
      return {
        bg: 'bg-gray-900/95',
        border: 'border-gray-700',
        text: 'text-gray-100',
        accent: 'text-gray-400'
      };
    }
    const cat = scheduleData.categories[category];
    // Convert light colors to dark overlay-friendly versions
    let bgColor = 'bg-gray-900/95';
    let borderColor = cat.border || 'border-gray-700';
    let textColor = 'text-gray-100';
    
    // Map category colors to dark overlay versions
    if (cat.bg?.includes('purple')) {
      bgColor = 'bg-purple-900/95';
      borderColor = 'border-purple-600';
      textColor = 'text-purple-100';
    } else if (cat.bg?.includes('green')) {
      bgColor = 'bg-green-900/95';
      borderColor = 'border-green-600';
      textColor = 'text-green-100';
    } else if (cat.bg?.includes('blue')) {
      bgColor = 'bg-blue-900/95';
      borderColor = 'border-blue-600';
      textColor = 'text-blue-100';
    } else if (cat.bg?.includes('yellow')) {
      bgColor = 'bg-yellow-900/95';
      borderColor = 'border-yellow-600';
      textColor = 'text-yellow-100';
    }
    
    return {
      bg: bgColor,
      border: borderColor,
      text: textColor,
      accent: textColor.replace('100', '300')
    };
  };

  return (
    <div className="min-h-screen bg-transparent p-6 font-mono">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Current Activity */}
        {currentSlot ? (
          <div className={`${getCategoryColor(currentSlot.category).bg} ${getCategoryColor(currentSlot.category).border} border-2 rounded-lg p-5 shadow-2xl backdrop-blur-md`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold uppercase tracking-wider text-red-400 animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                NOW
              </span>
              <span className={`text-sm font-semibold ${getCategoryColor(currentSlot.category).accent}`}>
                {formatTime(currentSlot.startTime)} - {formatTime(currentSlot.endTime)}
              </span>
            </div>
            <div className={`text-sm font-semibold uppercase tracking-wide mb-2 ${getCategoryColor(currentSlot.category).accent}`}>
              {currentSlot.category || '—'}
            </div>
            <div className={`text-2xl font-bold ${getCategoryColor(currentSlot.category).text} leading-tight`}>
              {currentSlot.activity || '—'}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/95 border-2 border-gray-700 rounded-lg p-5 shadow-2xl backdrop-blur-md">
            <div className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">NOW</div>
            <div className="text-xl text-gray-300">No current activity</div>
          </div>
        )}

        {/* Upcoming Activities */}
        {upcomingSlots.length > 0 && (
          <div className="space-y-3">
            {upcomingSlots.map((slot, index) => {
              const colors = getCategoryColor(slot.category);
              return (
                <div key={`upcoming-${slot.hour}-${index}`} className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 shadow-xl backdrop-blur-md`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">UPCOMING</span>
                    <span className={`text-xs font-semibold ${colors.accent}`}>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </span>
                  </div>
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${colors.accent}`}>
                    {slot.category || '—'}
                  </div>
                  <div className={`text-xl font-bold ${colors.text} leading-tight`}>
                    {slot.activity || '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No upcoming activities message */}
        {!currentSlot && upcomingSlots.length === 0 && (
          <div className="bg-gray-900/95 border-2 border-gray-700 rounded-lg p-5 shadow-2xl backdrop-blur-md">
            <div className="text-xl text-gray-300">No upcoming activities scheduled</div>
          </div>
        )}
      </div>
    </div>
  );
}

