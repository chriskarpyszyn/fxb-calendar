import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function TimerOverlay() {
  const { channelName } = useParams();
  const normalizedChannel = channelName?.toLowerCase().trim() || 'itsflannelbeard';
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isWaitingForStart, setIsWaitingForStart] = useState(false);

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

  // Calculate and update timer
  useEffect(() => {
    if (!scheduleData || !scheduleData.startDate || !scheduleData.startTime) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      try {
        // Parse start date and time (format: "HH:MM" in 24-hour format)
        const [startHour, startMinute] = scheduleData.startTime.split(':').map(Number);
        if (isNaN(startHour) || isNaN(startMinute)) {
          return null;
        }
        
        // Create date string in ISO format
        const startDateStr = `${scheduleData.startDate}T${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
        const startDateTime = new Date(startDateStr);
        
        if (isNaN(startDateTime.getTime())) {
          return null;
        }

        const now = new Date();
        
        // Check if we're waiting for the stream to start
        if (now < startDateTime) {
          // Count down to start time
          setIsWaitingForStart(true);
          setIsCelebrating(false);
          
          const diffMs = startDateTime.getTime() - now.getTime();
          
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

          return {
            hours,
            minutes,
            seconds,
            totalMs: diffMs
          };
        }

        // Stream has started, count down from start time + 24 hours
        setIsWaitingForStart(false);
        
        // Add 24 hours to start time
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 24);

        // Calculate remaining time
        const diffMs = endDateTime.getTime() - now.getTime();

        if (diffMs <= 0) {
          // Timer has reached zero
          setIsCelebrating(true);
          return {
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalMs: 0
          };
        }

        setIsCelebrating(false);
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        return {
          hours,
          minutes,
          seconds,
          totalMs: diffMs
        };
      } catch (error) {
        console.error('Error calculating time remaining:', error);
        return null;
      }
    };

    // Calculate immediately
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduleData]);

  // Format time as HH:MM:SS
  const formatTime = (time) => {
    if (!time) return '00:00:00';
    const { hours, minutes, seconds } = time;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-transparent p-4">
        <div className="text-white text-sm font-mono">Loading timer...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-transparent p-4">
        <div className="text-red-400 text-sm font-mono">Error: {error}</div>
      </div>
    );
  }

  if (!scheduleData || !scheduleData.startDate || !scheduleData.startTime) {
    return (
      <div className="bg-transparent p-4">
        <div className="text-gray-300 text-sm font-mono">No schedule start time available</div>
      </div>
    );
  }

  if (isCelebrating) {
    return (
      <div className="bg-transparent p-4 font-mono">
        <div className="celebration-container">
          <div className="celebration-text celebration-glow">
            WE DID IT!
          </div>
          <div className="celebration-subtitle">
            24 HOUR STREAM COMPLETE
          </div>
        </div>
        <style>{`
          .celebration-container {
            text-align: center;
            animation: celebrationPulse 1s ease-in-out infinite;
          }
          
          .celebration-text {
            font-size: 3rem;
            font-weight: 900;
            color: #22d3ee;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            margin-bottom: 0.5rem;
            animation: celebrationGlow 2s ease-in-out infinite alternate;
          }
          
          .celebration-subtitle {
            font-size: 1rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          
          @keyframes celebrationPulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes celebrationGlow {
            0% {
              text-shadow: 0 0 10px #22d3ee, 0 0 20px #22d3ee, 0 0 30px #22d3ee;
            }
            100% {
              text-shadow: 0 0 20px #22d3ee, 0 0 30px #22d3ee, 0 0 40px #22d3ee, 0 0 50px #22d3ee;
            }
          }
        `}</style>
      </div>
    );
  }

  const timeString = formatTime(timeRemaining);
  const labelText = isWaitingForStart ? '24 HOUR STREAM STARTS IN' : '24 HOUR COUNTDOWN';

  return (
    <div className="bg-transparent p-4 font-mono">
      <div className="timer-container">
        <div className="timer-label">{labelText}</div>
        <div className="timer-display">
          {timeString}
        </div>
      </div>
      <style>{`
        .timer-container {
          text-align: center;
        }
        
        .timer-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }
        
        .timer-display {
          font-size: 2.5rem;
          font-weight: 700;
          color: #22d3ee;
          text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
          letter-spacing: 0.1em;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}

