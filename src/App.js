import React, { useState, useEffect } from 'react';

export default function StreamCalendar() {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto overflow-x-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
            itsFlannelBeard's<br />
            31 Days of Streams Schedule
          </h1>
          <p className="text-purple-200 text-sm sm:text-base md:text-lg">
            {monthNames[month]} {year}
          </p>
        </div>
        
        {/* Calendar Container */}
        <div className="bg-white rounded-lg shadow-2xl p-2 sm:p-4 md:p-6 min-w-80">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
            {dayNames.map(day => (
              <div
                key={day}
                className="text-center font-bold text-gray-700 py-1 sm:py-2 text-xs sm:text-sm"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {days.map((day, index) => {
              const streamData = day ? streamSchedule[day.toString()] : null;
              const categoryColor = streamData ? categoryColors[streamData.category] : null;
              
              
              return (
                <div
                  key={index}
                    className={`
                    min-h-16 sm:min-h-24 md:min-h-32 lg:min-h-44 p-1 sm:p-2 md:p-3 rounded-lg border-2 transition-all duration-200
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
                      <div className="font-bold text-gray-800 text-xs sm:text-sm md:text-base lg:text-lg mb-1 sm:mb-2 border-b border-gray-300 pb-1 flex-shrink-0">
                        {day}
                      </div>
                      
                      {streamData && (
                        <div className="flex flex-col justify-start flex-grow">
                          {/* Category - Responsive height */}
                          <div className={`text-xs font-semibold leading-tight mb-1 sm:mb-2 ${categoryColor ? categoryColor.text : 'text-gray-800'}`}>
                            <div className="h-6 sm:h-8 md:h-10 lg:h-12 overflow-hidden break-words">
                              {streamData.category}
                            </div>
                          </div>
                          
                          {/* Subject - Responsive height */}
                          <div className="text-xs font-bold text-gray-800 leading-tight mb-1 sm:mb-2">
                            <div className="h-6 sm:h-8 md:h-10 lg:h-12 overflow-hidden break-words">
                              {streamData.subject}
                            </div>
                          </div>
                          
                          {/* Time - Responsive height */}
                          <div className="text-xs text-gray-600 leading-tight">
                            <div className="h-6 sm:h-8 md:h-10 lg:h-12 overflow-hidden break-words">
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
  );
}