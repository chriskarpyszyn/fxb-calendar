import React, { useState } from 'react';

export default function StreamCalendar() {
  const [currentDate] = useState(new Date(2025, 9, 1)); // October 2025 (month is 0-indexed)
  
  // Stream schedule data
  const streamSchedule = {
    1: {
      category: "Software and Game Development",
      subject: "Exploring SORA 2",
      time: "8:30am - 9:00am EST"
    },
    2: {
      category: "Software and Game Development",
      subject: "Integrating Menu into Game Scene",
      time: "7:00am - 9:00am EST"
    },
    3: {
      category: "Celeste",
      subject: "Can I finish Celeste today?",
      time: "5:00pm - 6:30pm EST"
    }
  };
  
  // Category colors (matching Twitch style)
  const categoryColors = {
    "Software and Game Development": {
      bg: "bg-purple-100",
      border: "border-purple-400",
      text: "text-purple-800",
      dot: "bg-purple-500"
    },
    "Celeste": {
      bg: "bg-pink-100",
      border: "border-pink-400",
      text: "text-pink-800",
      dot: "bg-pink-500"
    }
  };
  
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
              const streamData = day ? streamSchedule[day] : null;
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
      </div>
    </div>
  );
}