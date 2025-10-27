import { useState, useEffect } from 'react';

export default function useTwitchStatus() {
  const [twitchStatus, setTwitchStatus] = useState({
    isLive: false,
    loading: true,
    channelName: 'itsFlannelBeard'
  });

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

    // Then poll every 30 seconds
    const interval = setInterval(checkTwitchStatus, 30000);

    // Handle page visibility changes for immediate check when user returns
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkTwitchStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return twitchStatus;
}
