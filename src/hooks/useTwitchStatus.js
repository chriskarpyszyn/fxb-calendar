import { useState, useEffect } from 'react';

export default function useTwitchStatus(channelName = 'itsflannelbeard') {
  const normalizedChannel = channelName?.toLowerCase().trim() || 'itsflannelbeard';
  const [twitchStatus, setTwitchStatus] = useState({
    isLive: false,
    loading: true,
    channelName: normalizedChannel
  });

  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();
    
    const checkTwitchStatus = async () => {
      try {
        // Create new abort controller for this request
        abortController = new AbortController();
        
        const response = await fetch(`/api/twitch-status?channelName=${encodeURIComponent(normalizedChannel)}`, {
          signal: abortController.signal,
          cache: 'no-cache' // Force fresh requests
        });
        
        if (!mounted) return; // Don't update if unmounted
        
        const data = await response.json();
        console.log('Twitch Status:', data); // Debug log
        
        if (mounted) {
          setTwitchStatus({
            ...data,
            loading: false,
            channelName: normalizedChannel
          });
        }
      } catch (err) {
        // Ignore abort errors (expected on unmount)
        if (err.name === 'AbortError') {
          return;
        }
        
        console.error('Failed to check Twitch status:', err);
        
        if (mounted) {
          setTwitchStatus(prev => ({
            ...prev,
            loading: false,
            channelName: normalizedChannel
          }));
        }
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
      mounted = false;
      abortController.abort(); // Cancel any in-flight requests
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [normalizedChannel]);

  return twitchStatus;
}
