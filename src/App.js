import React, { useState, useEffect } from 'react';

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

  // Find the next upcoming stream based on current date
  const getNextStream = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = today.getDate();

    // If we're in the same month and year as the schedule
    if (currentYear === scheduleData.year && currentMonth === scheduleData.month) {
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
          </div>
          
          {/* Suggest Idea Button */}
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
          >
            💡 Suggest a Stream Idea
          </button>
        </div>

        {/* Twitch Live Banner */}
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

        {/* Offline - Show Next Stream */}
        {!twitchStatus.isLive && !twitchStatus.loading && nextStream && (
          <div className="mb-6 retro-container p-6 retro-glow bg-purple-50 border-2 border-purple-400">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Next Stream
              </h2>
              <p className="text-lg md:text-xl text-gray-800 mb-2">
                <span className="font-semibold">{nextStream.streamData.subject}</span>
              </p>
              <p className="text-md md:text-lg text-gray-600 mb-3">
                {nextStream.streamData.category} • {nextStream.streamData.time}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                October {nextStream.day}, 2025
              </p>
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
        
        {/* Mobile List View - Show on small screens */}
        <div className="block md:hidden">
          <div className="retro-container p-4 retro-glow">
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
              Upcoming Streams
            </h2>
            {daysWithEvents.length > 0 ? (
              <div className="space-y-3">
                {daysWithEvents.map(({ day, streamData, categoryColor }) => {
                  // Check if this is a past stream
                  const today = new Date();
                  const currentYear = today.getFullYear();
                  const currentMonth = today.getMonth() + 1;
                  const currentDay = today.getDate();
                  const isPastStream = currentYear === scheduleData.year && 
                                     currentMonth === scheduleData.month && 
                                     day < currentDay;
                  
                  return (
                    <div
                      key={day}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 relative ${
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
                          <div className="text-4xl font-bold text-red-500 opacity-80" 
                               style={{
                                 textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000',
                                 fontFamily: 'monospace',
                                 letterSpacing: '-0.1em'
                               }}>
                            ✕
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-bold text-gray-800">
                          Day {day}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          {streamData.time}
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
                
                // Check if this is a past stream
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth() + 1;
                const currentDay = today.getDate();
                const isPastStream = currentYear === scheduleData.year && 
                                   currentMonth === scheduleData.month && 
                                   day < currentDay;
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-32 lg:min-h-44 p-2 md:p-3 rounded-lg border-2 transition-all duration-200 relative
                      ${day 
                        ? streamData
                          ? categoryColor 
                            ? `hover:shadow-lg cursor-pointer hover:scale-105 active:scale-95`
                            : 'bg-gray-50 border-gray-200 hover:border-purple-400 hover:shadow-md cursor-pointer active:scale-95'
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
                        <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-red-500 opacity-80" 
                             style={{
                               textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000',
                               fontFamily: 'monospace',
                               letterSpacing: '-0.1em'
                             }}>
                          ✕
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
                                {streamData.time}
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
    </div>
  );
}