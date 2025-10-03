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
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null
  
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // TODO: In Milestone 5, this will send to Discord
    console.log('Form submitted:', formData);
    
    // Show success message
    setSubmitStatus('success');
    
    // Reset form after 2 seconds and close modal
    setTimeout(() => {
      setFormData({ idea: '', username: '' });
      setSubmitStatus(null);
      setShowModal(false);
    }, 2000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
            itsFlannelBeard's<br />
            31 Days of Streams Schedule
          </h1>
          <p className="text-purple-200 text-sm sm:text-base md:text-lg">
            {monthNames[month]} {year}
          </p>
          
          {/* Suggest Idea Button */}
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
          >
            💡 Suggest a Stream Idea
          </button>
        </div>
        
        {/* Mobile List View - Show on small screens */}
        <div className="block md:hidden">
          <div className="bg-white rounded-lg shadow-2xl p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
              Upcoming Streams
            </h2>
            {daysWithEvents.length > 0 ? (
              <div className="space-y-3">
                {daysWithEvents.map(({ day, streamData, categoryColor }) => (
                  <div
                    key={day}
                    className="p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg cursor-pointer active:scale-95 touch-manipulation"
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-lg font-bold text-gray-800">
                        Day {day}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {streamData.time}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold mb-2 ${categoryColor ? categoryColor.text : 'text-gray-800'}`}>
                      {streamData.category}
                    </div>
                    <div className="text-base font-bold text-gray-800 leading-tight">
                      {streamData.subject}
                    </div>
                  </div>
                ))}
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
          <div className="bg-white rounded-lg shadow-2xl p-4 md:p-6 min-w-80">
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
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-32 lg:min-h-44 p-2 md:p-3 rounded-lg border-2 transition-all duration-200
                      ${day 
                        ? streamData
                          ? categoryColor 
                            ? `hover:shadow-lg cursor-pointer hover:scale-105 active:scale-95`
                            : 'bg-gray-50 border-gray-200 hover:border-purple-400 hover:shadow-md cursor-pointer active:scale-95'
                          : 'bg-gray-50 border-gray-200 hover:border-purple-400 hover:shadow-md cursor-pointer active:scale-95'
                        : 'bg-transparent border-transparent'
                      }
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
                    {day && (
                      <div className="flex flex-col h-full">
                        {/* Day Number */}
                        <div className="font-bold text-gray-800 text-sm md:text-base lg:text-lg mb-2 border-b border-gray-300 pb-1 flex-shrink-0">
                          {day}
                        </div>
                        
                        {streamData && (
                          <div className="flex flex-col justify-start flex-grow">
                            {/* Category */}
                            <div className={`text-xs font-semibold leading-tight mb-1 ${categoryColor ? categoryColor.text : 'text-gray-800'}`}>
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
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
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
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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