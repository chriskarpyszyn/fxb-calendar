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
      <div className="min-h-screen bg-retro-bg retro-grid scanline flex items-center justify-center">
        <div className="retro-container p-8 retro-glow">
          <div className="retro-title text-lg retro-flicker">LOADING SCHEDULE...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-retro-bg retro-grid scanline flex items-center justify-center">
        <div className="retro-container p-8 retro-glow">
          <div className="retro-title text-lg text-retro-pink">ERROR: {error}</div>
        </div>
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
        </div>
        
        {/* Mobile List View - Show on small screens */}
        <div className="block md:hidden">
          <div className="retro-container p-4 retro-glow">
            <h2 className="retro-title text-base mb-4 text-center">
              UPCOMING STREAMS
            </h2>
            {daysWithEvents.length > 0 ? (
              <div className="space-y-3">
                {daysWithEvents.map(({ day, streamData, categoryColor }) => (
                  <div
                    key={day}
                    className="retro-card p-4 cursor-pointer active:scale-95 touch-manipulation"
                    style={categoryColor ? {
                      backgroundColor: categoryColor.bg === 'bg-green-100' ? '#1a2e1a' : 
                                     categoryColor.bg === 'bg-purple-100' ? '#2e1a2e' :
                                     categoryColor.bg === 'bg-pink-100' ? '#2e1a2a' :
                                     categoryColor.bg === 'bg-blue-100' ? '#1a2a2e' :
                                     categoryColor.bg === 'bg-orange-100' ? '#2e2a1a' : '#1a1a2e',
                      borderColor: categoryColor.border === 'border-green-400' ? '#34d399' :
                                  categoryColor.border === 'border-purple-400' ? '#a78bfa' :
                                  categoryColor.border === 'border-pink-400' ? '#f472b6' :
                                  categoryColor.border === 'border-blue-400' ? '#60a5fa' :
                                  categoryColor.border === 'border-orange-400' ? '#fb923c' : '#2d3748'
                    } : {
                      backgroundColor: '#1a1a2e',
                      borderColor: '#2d3748'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="retro-text text-lg font-bold text-retro-cyan">
                        DAY {day}
                      </div>
                      <div className="retro-text text-sm text-retro-muted font-mono">
                        {streamData.time}
                      </div>
                    </div>
                    <div className={`retro-text text-sm font-semibold mb-2 ${categoryColor ? categoryColor.text : 'text-retro-text'}`}>
                      {streamData.category.toUpperCase()}
                    </div>
                    <div className="retro-text text-base font-bold leading-tight">
                      {streamData.subject.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="retro-text text-lg text-retro-muted">NO STREAMS SCHEDULED FOR THIS MONTH</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Calendar Grid - Show on medium screens and up */}
        <div className="hidden md:block overflow-x-auto">
          <div className="retro-container p-4 md:p-6 min-w-80 retro-glow">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div
                  key={day}
                  className="text-center font-bold text-retro-cyan py-2 text-sm font-pixel"
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
                      min-h-32 lg:min-h-44 p-2 md:p-3 retro-card transition-all duration-200
                      ${day 
                        ? streamData
                          ? categoryColor 
                            ? `cursor-pointer hover:scale-105 active:scale-95`
                            : 'cursor-pointer active:scale-95'
                          : 'cursor-pointer active:scale-95'
                        : 'bg-transparent border-transparent'
                      }
                    `}
                    style={day && streamData && categoryColor ? {
                      backgroundColor: categoryColor.bg === 'bg-green-100' ? '#1a2e1a' : 
                                     categoryColor.bg === 'bg-purple-100' ? '#2e1a2e' :
                                     categoryColor.bg === 'bg-pink-100' ? '#2e1a2a' :
                                     categoryColor.bg === 'bg-blue-100' ? '#1a2a2e' :
                                     categoryColor.bg === 'bg-orange-100' ? '#2e2a1a' : '#1a1a2e',
                      borderColor: categoryColor.border === 'border-green-400' ? '#34d399' :
                                  categoryColor.border === 'border-purple-400' ? '#a78bfa' :
                                  categoryColor.border === 'border-pink-400' ? '#f472b6' :
                                  categoryColor.border === 'border-blue-400' ? '#60a5fa' :
                                  categoryColor.border === 'border-orange-400' ? '#fb923c' : '#2d3748'
                    } : day ? {
                      backgroundColor: '#1a1a2e',
                      borderColor: '#2d3748'
                    } : {}}
                  >
                    {day && (
                      <div className="flex flex-col h-full">
                        {/* Day Number */}
                        <div className="retro-text font-bold text-retro-cyan text-sm md:text-base lg:text-lg mb-2 border-b border-retro-border pb-1 flex-shrink-0 font-pixel">
                          {day}
                        </div>
                        
                        {streamData && (
                          <div className="flex flex-col justify-start flex-grow">
                            {/* Category */}
                            <div className={`retro-text text-xs font-semibold leading-tight mb-1 ${categoryColor ? categoryColor.text : 'text-retro-text'}`}>
                              <div className="h-8 md:h-10 lg:h-12 overflow-hidden">
                                {streamData.category.toUpperCase()}
                              </div>
                            </div>
                            
                            {/* Subject */}
                            <div className="retro-text text-xs font-bold leading-tight mb-1">
                              <div className="h-8 md:h-10 lg:h-12 overflow-hidden">
                                {streamData.subject.toUpperCase()}
                              </div>
                            </div>
                            
                            {/* Time */}
                            <div className="retro-text text-xs text-retro-muted leading-tight font-mono">
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
    </div>
  );
}