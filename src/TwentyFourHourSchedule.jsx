import React, { useState, useEffect } from 'react';
import './App.css';

export default function TwentyFourHourSchedule() {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load schedule data from JSON file
  useEffect(() => {
    fetch('/24hourSchedule.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load 24-hour schedule');
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

  // Get user's timezone
  const getUserTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  // Convert time to user's local timezone
  const convertTimeToUserTimezone = (timeString) => {
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
    
    const estStartTime = new Date(`${year}-${month.toString().padStart(2, '0')}-${actualDay.toString().padStart(2, '0')}T${startHour24.toString().padStart(2, '0')}:${startMin}:00-05:00`);
    const estEndTime = new Date(`${year}-${month.toString().padStart(2, '0')}-${actualDay.toString().padStart(2, '0')}T${endHour24.toString().padStart(2, '0')}:${endMin}:00-05:00`);
    
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
    
    const startTimeLocal = formatTime(estStartTime);
    const endTimeLocal = formatTime(estEndTime);
    
    return `${startTimeLocal} - ${endTimeLocal}`;
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
              EXTRA LIFE 24 HOUR<br />
              STREAM SCHEDULE
            </h1>
            <p className="retro-text text-retro-muted text-sm sm:text-base md:text-lg font-mono">
              {scheduleData.date}
            </p>
            <p className="retro-text text-retro-muted text-xs sm:text-sm font-mono mt-2">
              All times shown in your timezone: {getUserTimezone()}
            </p>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="retro-container p-4 md:p-6 retro-glow">
          <div className="space-y-3">
            {scheduleData.timeSlots.map((slot, index) => {
              const categoryColor = scheduleData.categories[slot.category];
              const isNewDay = slot.hour === 0; // Midnight marks new day
              const isSixHourMark = slot.hour % 6 === 0; // Every 6 hours
              
              return (
                <div key={index}>
                  {/* Day separator at midnight */}
                  {isNewDay && (
                    <div className="text-center my-6">
                      <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm">
                        FRIDAY NOVEMBER 7TH
                      </div>
                    </div>
                  )}
                  
                  {/* 6-hour separator */}
                  {isSixHourMark && !isNewDay && (
                    <div className="border-t border-gray-400 my-4"></div>
                  )}
                  
                  {/* Time slot */}
                  <div
                    className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
                      categoryColor ? `${categoryColor.bg} ${categoryColor.border}` : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-start">
                      {/* Time Column - 3 columns */}
                      <div className="col-span-3">
                        <div className="text-lg font-bold text-gray-800">
                          {convertTimeToUserTimezone(slot.time)}
                        </div>
                      </div>
                      
                      {/* Category Column - 3 columns */}
                      <div className="col-span-3">
                        <div 
                          className={`text-sm font-semibold ${
                            categoryColor ? categoryColor.text : 'text-gray-800'
                          }`}
                        >
                          {slot.category}
                        </div>
                      </div>
                      
                      {/* Activity/Subject Column - 6 columns */}
                      <div className="col-span-6">
                        <div className="text-base font-bold text-gray-800 mb-1">
                          {slot.activity}
                        </div>
                        <div className="text-sm text-gray-600">
                          {slot.description}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
