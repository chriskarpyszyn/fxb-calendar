import React, { useState, useEffect } from 'react';
import './App.css';

export default function StreamCalendar() {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    idea: '',
    username: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', 'loading', or null
  const [twitchStatus, setTwitchStatus] = useState({
    isLive: false,
    loading: true,
    channelName: 'itsFlannelBeard'
  });
  const [versionData, setVersionData] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // Countdown timer state
  const [timeUntilStream, setTimeUntilStream] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false
  });
  
  // Load schedule data from JSON file
  useEffect(() => {
    fetch('/streamSchedule.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load schedule');
        }
        return response.json();
      })
      .then(data => {
        setScheduleData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Load version data
  useEffect(() => {
    fetch('/version.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load version data');
        }
        return response.json();
      })
      .then(data => {
        setVersionData(data);
      })
      .catch(err => {
        console.error('Failed to load version data:', err);
      });
  }, []);

  // Check Twitch live status
  useEffect(() => {
    const checkTwitchStatus = async () => {
      try {
        const response = await fetch('/api/twitch-status');
        const data = await response.json();
        setTwitchStatus({
          ...data,
          loading: false
        });
      } catch (err) {
        console.error('Failed to check Twitch status:', err);
        setTwitchStatus(prev => ({
          ...prev,
          loading: false
        }));
      }
    };

    // Check immediately
    checkTwitchStatus();

    // Then check every 60 seconds
    const interval = setInterval(checkTwitchStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  // Calculate time until next stream
  useEffect(() => {
    if (!scheduleData) return; // Don't run if schedule data isn't loaded yet
    
    const updateCountdown = () => {
      const nextStream = getNextStream();
      
      if (!nextStream) {
        setTimeUntilStream({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false });
        return;
      }

      const now = new Date();
      const { startTime } = parseStreamTime(nextStream.streamData.time, nextStream.day, scheduleData.month, scheduleData.year);
      
      if (!startTime) {
        setTimeUntilStream({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false });
        return;
      }

      const timeDiff = startTime.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        // Stream has started or is live
        setTimeUntilStream({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true });
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeUntilStream({ days, hours, minutes, seconds, isLive: false });
    };

    // Update immediately
    updateCountdown();
    
    // Update every second
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [scheduleData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.idea.trim()) {
      errors.idea = 'Please enter your stream idea';
    } else if (formData.idea.trim().length < 10) {
      errors.idea = 'Idea should be at least 10 characters';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Please enter your Twitch username';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Show loading state
    setSubmitStatus('loading');

    try {
      // Send to our API route
      const response = await fetch('/api/submit-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit idea');
      }

      // Show success message
      setSubmitStatus('success');
      
      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        setFormData({ idea: '', username: '' });
        setSubmitStatus(null);
        setShowModal(false);
      }, 2000);

    } catch (error) {
      console.error('Error submitting idea:', error);
      setSubmitStatus('error');
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 3000);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ idea: '', username: '' });
    setFormErrors({});
    setSubmitStatus(null);
  };

  const closeVersionModal = () => {
    setShowVersionModal(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading schedule...</div>
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
  
  const currentDate = new Date(scheduleData.year, scheduleData.month - 1, 1);
  const streamSchedule = scheduleData.streams;
  const categoryColors = scheduleData.categories;
  
  // Get the first day of the month and total days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create array of day numbers
  const days = [];
  
  // Add empty cells for days before the month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  // Get all days with events for mobile list view
  const daysWithEvents = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const streamData = streamSchedule[day.toString()];
    if (streamData) {
      daysWithEvents.push({
        day,
        streamData,
        categoryColor: categoryColors[streamData.category]
      });
    }
  }

  // Parse stream time and convert to Date object
  const parseStreamTime = (timeString, day, month, year) => {
    // Parse "8:30am - 9:00am" format (assuming EDT)
    const match = timeString.match(/(\d{1,2}):(\d{2})(am|pm)\s*-\s*(\d{1,2}):(\d{2})(am|pm)/);
    if (!match) return { startTime: null, endTime: null };
    
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
    
    // Create Date objects in EDT (Eastern Daylight Time, UTC-4) - FIXED VERSION
    // Use proper timezone handling by creating dates with explicit timezone offset
    const startTime = new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${startHour24.toString().padStart(2, '0')}:${startMin}:00-04:00`);
    const endTime = new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${endHour24.toString().padStart(2, '0')}:${endMin}:00-04:00`);
    
    return { startTime, endTime };
  };

  // Check if a stream has ended
  const isStreamEnded = (streamData, day, month, year) => {
    const { endTime } = parseStreamTime(streamData.time, day, month, year);
    if (!endTime) return false;
    
    const now = new Date();
    return now > endTime;
  };

  // Get user's timezone
  const getUserTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  // Convert EDT time to user's local timezone
  const convertTimeToUserTimezone = (timeString, day, month, year, includeTimezoneAbbr = false) => {
    // Parse "8:30am - 9:00am" format (assuming EDT)
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
    
    // Create Date objects in EDT (Eastern Daylight Time, UTC-4) - FIXED VERSION
    // Use proper timezone handling by creating dates with explicit timezone offset
    const edtStartTime = new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${startHour24.toString().padStart(2, '0')}:${startMin}:00-04:00`);
    const edtEndTime = new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${endHour24.toString().padStart(2, '0')}:${endMin}:00-04:00`);
    
    // Convert to user's timezone
    const userTimezone = getUserTimezone();
    
    // Format the converted times
    const formatTime = (date) => {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date).replace(/\s/g, '');
    };
    
    const startTimeLocal = formatTime(edtStartTime);
    const endTimeLocal = formatTime(edtEndTime);
    
    if (includeTimezoneAbbr) {
      // Get timezone abbreviation for user's timezone
      const timezoneAbbr = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        timeZoneName: 'short'
      }).formatToParts(edtStartTime).find(part => part.type === 'timeZoneName')?.value || '';
      
      return `${startTimeLocal} - ${endTimeLocal} ${timezoneAbbr}`;
    } else {
      return `${startTimeLocal} - ${endTimeLocal}`;
    }
  };

  // Find the next upcoming stream based on current date and time
  const getNextStream = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = today.getDate();

    // If we're after the schedule month/year, no upcoming streams
    if (currentYear > scheduleData.year || 
        (currentYear === scheduleData.year && currentMonth > scheduleData.month)) {
      return null;
    }

    // If we're in the same month and year as the schedule
    if (currentYear === scheduleData.year && currentMonth === scheduleData.month) {
      // Check today's stream first
      const todayStream = streamSchedule[currentDay.toString()];
      if (todayStream && !isStreamEnded(todayStream, currentDay, currentMonth, currentYear)) {
        return {
          day: currentDay,
          streamData: todayStream,
          categoryColor: categoryColors[todayStream.category]
        };
      }
      
      // Find the next stream after today
      for (let day = currentDay + 1; day <= daysInMonth; day++) {
        const streamData = streamSchedule[day.toString()];
        if (streamData) {
          return {
            day,
            streamData,
            categoryColor: categoryColors[streamData.category]
          };
        }
      }
    } else {
      // We're before the schedule month, return the first stream
      for (let day = 1; day <= daysInMonth; day++) {
        const streamData = streamSchedule[day.toString()];
        if (streamData) {
          return {
            day,
            streamData,
            categoryColor: categoryColors[streamData.category]
          };
        }
      }
    }
    
    // No upcoming streams found
    return null;
  };

  const nextStream = getNextStream();

  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className="retro-container p-6 retro-glow mb-4">
            <h1 className="retro-title text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 leading-tight">
              ITSFLANNELBEARD'S<br />
              31 DAYS OF STREAMS<br />
              SCHEDULE
            </h1>
            <p className="retro-text text-retro-muted text-sm sm:text-base md:text-lg font-mono">
              {monthNames[month].toUpperCase()} {year}
            </p>
            <p className="retro-text text-retro-muted text-xs sm:text-sm font-mono mt-2">
              All times shown in your timezone: {getUserTimezone()}
            </p>
          </div>
          
        </div>

        {/* Stream Status Card - Shows live status if live, otherwise shows next stream */}
        {nextStream && (
          <>
            {/* Twitch Live Banner - Show when live */}
            {twitchStatus.isLive && !twitchStatus.loading && (
              <div className="mb-6 retro-container p-6 retro-glow bg-red-50 border-4 border-red-500">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full font-bold text-lg mb-3 animate-pulse">
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                    LIVE NOW
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {twitchStatus.title || 'Streaming Now!'}
                  </h2>
                  {twitchStatus.gameName && (
                    <p className="text-lg md:text-xl text-gray-700 mb-2">
                      Playing: <span className="font-semibold">{twitchStatus.gameName}</span>
                    </p>
                  )}
                  <p className="text-md md:text-lg text-gray-600 mb-4">
                    👁️ {twitchStatus.viewerCount?.toLocaleString() || 0} viewers watching
                  </p>
                  
                  {/* Buttons */}
                  <div className="flex gap-3 justify-center flex-wrap mb-4">
                    <a
                      href={`https://www.twitch.tv/${twitchStatus.channelName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      🎮 Watch on Twitch
                    </a>
                    <a
                      href={`https://www.twitch.tv/${twitchStatus.channelName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      ❤️ Follow
                    </a>
                  </div>
                </div>

                {/* Embedded Twitch Player */}
                <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://player.twitch.tv/?channel=${twitchStatus.channelName}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&muted=false`}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    title="Twitch Stream"
                  ></iframe>
                </div>
              </div>
            )}

            {/* Next Stream Card - Show when not live (or while loading Twitch status) */}
            {(!twitchStatus.isLive || twitchStatus.loading) && (
              <div className="mb-6 retro-container p-6 retro-glow bg-purple-50 border-2 border-purple-400">
                <div className="text-center">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    Next Stream
                  </h2>
                  <p className="text-lg md:text-xl text-gray-800 mb-2">
                    <span className="font-semibold">{nextStream.streamData.subject}</span>
                  </p>
                  <p className="text-md md:text-lg text-gray-600 mb-3">
                    {nextStream.streamData.category} • {convertTimeToUserTimezone(nextStream.streamData.time, nextStream.day, scheduleData.month, scheduleData.year)}
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    October {nextStream.day}, 2025
                  </p>
                  
                  {/* Countdown Timer */}
                  {timeUntilStream.isLive ? (
                    <div className={`mb-4 p-4 countdown-timer live`}>
                      <div className="text-center relative z-10">
                        <div className="text-xl font-bold countdown-label live mb-2">LIVE NOW!</div>
                        <div className="text-sm countdown-time-label">Stream is currently live</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 countdown-timer">
                      <div className="text-center relative z-10">
                        <div className="text-sm font-semibold countdown-label mb-3">Stream starts in:</div>
                        <div className="flex justify-center space-x-3">
                          {timeUntilStream.days > 0 && (
                            <div className="flex flex-col items-center">
                              <div className="countdown-time-box px-3 py-2 text-lg">{timeUntilStream.days}</div>
                              <div className="countdown-time-label mt-1">days</div>
                            </div>
                          )}
                          <div className="flex flex-col items-center">
                            <div className="countdown-time-box px-3 py-2 text-lg">{timeUntilStream.hours.toString().padStart(2, '0')}</div>
                            <div className="countdown-time-label mt-1">hours</div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="countdown-time-box px-3 py-2 text-lg">{timeUntilStream.minutes.toString().padStart(2, '0')}</div>
                            <div className="countdown-time-label mt-1">min</div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="countdown-time-box px-3 py-2 text-lg">{timeUntilStream.seconds.toString().padStart(2, '0')}</div>
                            <div className="countdown-time-label mt-1">sec</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <a
                    href={`https://www.twitch.tv/${twitchStatus.channelName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    ❤️ Follow on Twitch
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* Suggest Idea Button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
          >
            💡 Suggest a Stream Idea
          </button>
        </div>
        
        {/* Mobile List View - Show on small screens */}
        <div className="block md:hidden">
          <div className="retro-container p-4 retro-glow">
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
              Upcoming Streams
            </h2>
            {daysWithEvents.length > 0 ? (
              <div className="space-y-3">
                {daysWithEvents.map(({ day, streamData, categoryColor }) => {
                  // Check if this is a past stream (either past day or stream has ended)
                  const today = new Date();
                  const currentYear = today.getFullYear();
                  const currentMonth = today.getMonth() + 1;
                  const currentDay = today.getDate();
                  const isPastStream = currentYear === scheduleData.year && 
                                     currentMonth === scheduleData.month && 
                                     (day < currentDay || (day === currentDay && isStreamEnded(streamData, day, currentMonth, currentYear)));
                  
                  // Check if this is the next streaming day
                  const isNextStream = nextStream && nextStream.day === day;
                  
                  return (
                    <div
                      key={day}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 relative ${
                        isNextStream ? 'next-stream-glow' : ''
                      } ${
                        isPastStream ? 'opacity-60' : 'hover:shadow-lg cursor-pointer active:scale-95 touch-manipulation'
                      }`}
                      style={categoryColor ? {
                        backgroundColor: categoryColor.bg === 'bg-green-100' ? '#dcfce7' : 
                                       categoryColor.bg === 'bg-purple-100' ? '#f3e8ff' :
                                       categoryColor.bg === 'bg-pink-100' ? '#fce7f3' :
                                       categoryColor.bg === 'bg-blue-100' ? '#dbeafe' :
                                       categoryColor.bg === 'bg-orange-100' ? '#fed7aa' : '#f9fafb',
                        borderColor: categoryColor.border === 'border-green-400' ? '#4ade80' :
                                    categoryColor.border === 'border-purple-400' ? '#a855f7' :
                                    categoryColor.border === 'border-pink-400' ? '#f472b6' :
                                    categoryColor.border === 'border-blue-400' ? '#60a5fa' :
                                    categoryColor.border === 'border-orange-400' ? '#fb923c' : '#e5e7eb'
                      } : {
                        backgroundColor: '#f9fafb',
                        borderColor: '#e5e7eb'
                      }}
                    >
                      {/* 8-bit X overlay for past streams */}
                      {isPastStream && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <div className="relative" style={{ width: '60px', height: '60px' }}>
                            {/* Pixelated X made with individual pixel blocks */}
                            <div style={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(6, 1fr)',
                              gridTemplateRows: 'repeat(6, 1fr)',
                              gap: '0px'
                            }}>
                              {/* Pixel blocks for the X shape */}
                              {Array.from({ length: 36 }, (_, i) => {
                                const row = Math.floor(i / 6);
                                const col = i % 6;
                                const isX = (row === col) || (row + col === 5);
                                const isBorder = (row === col - 1) || (row === col + 1) || 
                                               (row + col === 4) || (row + col === 6);
                                
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      backgroundColor: isX ? '#ff0000' : isBorder ? '#cc0000' : 'transparent',
                                      imageRendering: 'pixelated',
                                      width: '10px',
                                      height: '10px'
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-bold text-gray-800">
                          Day {day}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          {convertTimeToUserTimezone(streamData.time, day, scheduleData.month, scheduleData.year)}
                        </div>
                      </div>
                      <div 
                        className="text-sm font-semibold mb-2"
                        style={{
                          color: categoryColor ? 
                            (categoryColor.text === 'text-purple-800' ? '#6b21a8' :
                             categoryColor.text === 'text-pink-800' ? '#9d174d' :
                             categoryColor.text === 'text-orange-800' ? '#9a3412' :
                             categoryColor.text === 'text-green-800' ? '#166534' :
                             categoryColor.text === 'text-blue-800' ? '#1e40af' : '#1f2937') : '#1f2937'
                        }}
                      >
                        {streamData.category}
                      </div>
                      <div className="text-base font-bold text-gray-800 leading-tight">
                        {streamData.subject}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">No streams scheduled for this month</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Calendar Grid - Show on medium screens and up */}
        <div className="hidden md:block overflow-x-auto">
          <div className="retro-container p-4 md:p-6 retro-glow min-w-80">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div
                  key={day}
                  className="text-center font-bold text-gray-700 py-2 text-sm"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const streamData = day ? streamSchedule[day.toString()] : null;
                const categoryColor = streamData ? categoryColors[streamData.category] : null;
                
                // Check if this is a past stream (either past day or stream has ended)
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth() + 1;
                const currentDay = today.getDate();
                const isPastStream = currentYear === scheduleData.year && 
                                   currentMonth === scheduleData.month && 
                                   (day < currentDay || (day === currentDay && streamData && isStreamEnded(streamData, day, currentMonth, currentYear)));
                
                // Check if this is the next streaming day
                const isNextStream = nextStream && nextStream.day === day;
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-32 lg:min-h-44 p-2 md:p-3 rounded-lg border-2 transition-all duration-200 relative
                      ${isNextStream ? 'next-stream-glow' : ''}
                      ${day 
                        ? streamData
                          ? categoryColor 
                            ? isPastStream 
                              ? '' 
                              : `hover:shadow-lg cursor-pointer hover:scale-105 active:scale-95`
                            : isPastStream
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-gray-50 border-gray-200 hover:border-purple-400 hover:shadow-md cursor-pointer active:scale-95'
                          : isPastStream
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-gray-50 border-gray-200 hover:border-purple-400 hover:shadow-md cursor-pointer active:scale-95'
                        : 'bg-transparent border-transparent'
                      }
                      ${isPastStream ? 'opacity-60' : ''}
                    `}
                    style={day && streamData && categoryColor ? {
                      backgroundColor: categoryColor.bg === 'bg-green-100' ? '#dcfce7' : 
                                     categoryColor.bg === 'bg-purple-100' ? '#f3e8ff' :
                                     categoryColor.bg === 'bg-pink-100' ? '#fce7f3' :
                                     categoryColor.bg === 'bg-blue-100' ? '#dbeafe' :
                                     categoryColor.bg === 'bg-orange-100' ? '#fed7aa' : '#f9fafb',
                      borderColor: categoryColor.border === 'border-green-400' ? '#4ade80' :
                                  categoryColor.border === 'border-purple-400' ? '#a855f7' :
                                  categoryColor.border === 'border-pink-400' ? '#f472b6' :
                                  categoryColor.border === 'border-blue-400' ? '#60a5fa' :
                                  categoryColor.border === 'border-orange-400' ? '#fb923c' : '#e5e7eb'
                    } : {}}
                  >
                    {/* 8-bit X overlay for past streams */}
                    {isPastStream && streamData && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="relative" style={{ width: '80px', height: '80px' }}>
                          {/* Pixelated X made with individual pixel blocks */}
                          <div style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gridTemplateRows: 'repeat(8, 1fr)',
                            gap: '0px'
                          }}>
                            {/* Pixel blocks for the X shape */}
                            {Array.from({ length: 64 }, (_, i) => {
                              const row = Math.floor(i / 8);
                              const col = i % 8;
                              const isX = (row === col) || (row + col === 7);
                              const isBorder = (row === col - 1) || (row === col + 1) || 
                                             (row + col === 6) || (row + col === 8);
                              
                              return (
                                <div
                                  key={i}
                                  style={{
                                    backgroundColor: isX ? '#ff0000' : isBorder ? '#cc0000' : 'transparent',
                                    imageRendering: 'pixelated',
                                    width: '10px',
                                    height: '10px'
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {day && (
                      <div className="flex flex-col h-full">
                        {/* Day Number */}
                        <div className="font-bold text-gray-800 text-sm md:text-base lg:text-lg mb-2 border-b border-gray-300 pb-1 flex-shrink-0">
                          {day}
                        </div>
                        
                        {streamData && (
                          <div className="flex flex-col justify-start flex-grow">
                            {/* Category */}
                            <div 
                              className="text-xs font-semibold leading-tight mb-1"
                              style={{
                                color: categoryColor ? 
                                  (categoryColor.text === 'text-purple-800' ? '#6b21a8' :
                                   categoryColor.text === 'text-pink-800' ? '#9d174d' :
                                   categoryColor.text === 'text-orange-800' ? '#9a3412' :
                                   categoryColor.text === 'text-green-800' ? '#166534' :
                                   categoryColor.text === 'text-blue-800' ? '#1e40af' : '#1f2937') : '#1f2937'
                              }}
                            >
                              <div className="h-8 md:h-10 lg:h-12 overflow-hidden">
                                {streamData.category}
                              </div>
                            </div>
                            
                            {/* Subject */}
                            <div className="text-xs font-bold text-gray-800 leading-tight mb-1">
                              <div className="h-8 md:h-10 lg:h-12 overflow-hidden">
                                {streamData.subject}
                              </div>
                            </div>
                            
                            {/* Time */}
                            <div className="text-xs text-gray-600 leading-tight">
                              <div className="h-8 md:h-10 lg:h-12 overflow-hidden">
                                {convertTimeToUserTimezone(streamData.time, day, scheduleData.month, scheduleData.year)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Version Display */}
      {versionData && (
        <div className="text-center mt-8 mb-4">
          <button
            onClick={() => setShowVersionModal(true)}
            className="text-gray-400 hover:text-gray-300 text-sm italic transition-colors duration-200 cursor-pointer"
          >
            {versionData.currentVersion}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeModal}
          ></div>
          
          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
              
              {/* Modal Header */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                💡 Suggest a Stream Idea
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Have an idea for a stream? Let me know!
              </p>

              {submitStatus === 'success' ? (
                // Success Message
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-green-600 mb-2">
                    Idea Submitted!
                  </h3>
                  <p className="text-gray-600">
                    Thanks for your suggestion!
                  </p>
                </div>
              ) : submitStatus === 'loading' ? (
                // Loading State
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Submitting...
                  </h3>
                  <p className="text-gray-600">
                    Sending your idea to Discord
                  </p>
                </div>
              ) : submitStatus === 'error' ? (
                // Error Message
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">❌</div>
                  <h3 className="text-xl font-bold text-red-600 mb-2">
                    Submission Failed
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Something went wrong. Please try again.
                  </p>
                  <button
                    onClick={() => setSubmitStatus(null)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                // Form
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Idea Field */}
                  <div>
                    <label htmlFor="idea" className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Stream Idea *
                    </label>
                    <textarea
                      id="idea"
                      name="idea"
                      value={formData.idea}
                      onChange={handleInputChange}
                      rows="4"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-gray-500 text-gray-900 ${
                        formErrors.idea ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Example: Play through Hollow Knight or Build a weather app with React"
                    ></textarea>
                    {formErrors.idea && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.idea}</p>
                    )}
                  </div>

                  {/* Username Field */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Twitch Username *
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 text-gray-900 ${
                        formErrors.username ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your_username"
                    />
                    {formErrors.username && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                    >
                      Submit Idea
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version Modal */}
      {showVersionModal && versionData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeVersionModal}
          ></div>
          
          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 transform transition-all">
              {/* Close Button */}
              <button
                onClick={closeVersionModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
              
              {/* Modal Header */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Release Notes
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Current version: {versionData.currentVersion}
              </p>

              {/* Release Notes */}
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {versionData.releaseNotes.map((release, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {release.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {release.date}
                      </span>
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {release.changes.map((change, changeIndex) => (
                        <li key={changeIndex} className="text-sm text-gray-600">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={closeVersionModal}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}