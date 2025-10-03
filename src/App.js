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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Stream Schedule
          </h1>
          <p className="text-purple-200 text-lg">
            {monthNames[month]} {year}
          </p>
        </div>
        
        {/* Calendar Container */}
        <div className="bg-white rounded-lg shadow-2xl p-6">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map(day => (
              <div
                key={day}
                className="text-center font-bold text-gray-700 py-2"
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
                    min-h-44 p-3 rounded-lg border-2 transition-all duration-200
                    ${day 
                      ? streamData
                        ? `${categoryColor.bg} ${categoryColor.border} hover:shadow-lg cursor-pointer hover:scale-105`
                        : 'bg-gray-50 border-gray-200 hover:border-purple-400 hover:shadow-md cursor-pointer'
                      : 'bg-transparent border-transparent'
                    }
                  `}
                >
                  {day && (
                    <div className="flex flex-col h-full">
                      {/* Day Number */}
                      <div className="font-bold text-gray-800 text-lg mb-2 border-b border-gray-300 pb-1 flex-shrink-0">
                        {day}
                      </div>
                      
                      {streamData && (
                        <div className="flex flex-col justify-start flex-grow">
                          {/* Category - Fixed height for up to 3 lines */}
                          <div className={`text-xs font-semibold ${categoryColor.text} leading-tight mb-2`}>
                            <div className="h-12 overflow-hidden break-words">
                              {streamData.category}
                            </div>
                          </div>
                          
                          {/* Subject - Fixed height for up to 3 lines */}
                          <div className="text-xs font-bold text-gray-800 leading-tight mb-2">
                            <div className="h-12 overflow-hidden break-words">
                              {streamData.subject}
                            </div>
                          </div>
                          
                          {/* Time - Fixed height for up to 3 lines */}
                          <div className="text-xs text-gray-600 leading-tight">
                            <div className="h-12 overflow-hidden break-words">
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
        
        {/* Legend */}
        <div className="mt-6 bg-white/10 backdrop-blur rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Stream Categories</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(categoryColors).map(([category, colors]) => (
              <div key={category} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
                <span className="text-purple-100 text-sm">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}