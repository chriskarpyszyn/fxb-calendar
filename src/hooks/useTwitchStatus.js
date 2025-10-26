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
        console.log('useTwitchStatus - Fetching Twitch status...');
        const response = await fetch('/api/twitch-status');
        const data = await response.json();
        console.log('useTwitchStatus - Received data:', data);
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

  return twitchStatus;
}
