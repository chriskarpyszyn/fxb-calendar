import { useState, useEffect, useRef } from 'react';

export default function useTwitchStatus() {
  const [twitchStatus, setTwitchStatus] = useState({
    isLive: false,
    loading: true,
    channelName: 'itsFlannelBeard'
  });
  
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

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

    const connectSSE = () => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/twitch-events');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === 'connected' || data.type === 'heartbeat' || data.type === 'timeout') {
            // Ignore system messages
            return;
          } else {
            // Regular status update
            setTwitchStatus(prev => ({
              ...data,
              loading: false
            }));
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        
        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, 5000);
      };

      // Handle connection close (timeout)
      eventSource.addEventListener('close', () => {
        // Reconnect immediately for seamless experience
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, 1000);
      });
    };

    // Get initial status
    checkTwitchStatus();
    
    // Connect to SSE
    connectSSE();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkTwitchStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return twitchStatus;
}
