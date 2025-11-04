import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ChannelLogin from '../components/ChannelLogin';
import AdminSchedule24Hour from '../components/AdminSchedule24Hour';

export default function ChannelScheduleAdmin() {
  const { channelName } = useParams();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sessionToken, setSessionToken] = useState(null);
  const normalizedChannel = channelName?.toLowerCase().trim();

  // Check if user is already authenticated
  useEffect(() => {
    if (!normalizedChannel) {
      setCheckingAuth(false);
      return;
    }

    const checkAuth = () => {
      const token = localStorage.getItem(`channelToken_${normalizedChannel}`);
      const expiresAt = localStorage.getItem(`channelExpiresAt_${normalizedChannel}`);
      
      if (!token || !expiresAt) {
        setIsAuthenticated(false);
        setCheckingAuth(false);
        return;
      }

      // Check if token has expired
      if (Date.now() > parseInt(expiresAt)) {
        localStorage.removeItem(`channelToken_${normalizedChannel}`);
        localStorage.removeItem(`channelExpiresAt_${normalizedChannel}`);
        setIsAuthenticated(false);
        setCheckingAuth(false);
        return;
      }

      setIsAuthenticated(true);
      setSessionToken(token);
      setCheckingAuth(false);
    };

    checkAuth();
  }, [normalizedChannel]);

  const handleLogin = (chanName, token) => {
    setIsAuthenticated(true);
    setSessionToken(token);
    localStorage.setItem('currentChannel', chanName);
  };

  const handleLogout = () => {
    if (normalizedChannel) {
      localStorage.removeItem(`channelToken_${normalizedChannel}`);
      localStorage.removeItem(`channelExpiresAt_${normalizedChannel}`);
    }
    localStorage.removeItem('currentChannel');
    setIsAuthenticated(false);
    setSessionToken(null);
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-retro-bg retro-grid scanline flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-4"></div>
          <p className="retro-text text-retro-muted">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    if (!normalizedChannel || normalizedChannel === 'new') {
      // If no channel name or "new", redirect to channels list or show error
      return (
        <div className="min-h-screen bg-retro-bg retro-grid scanline flex items-center justify-center p-4">
          <div className="retro-container p-8 retro-glow max-w-md w-full text-center">
            <h1 className="retro-title text-2xl font-bold text-retro-cyan mb-4">
              Invalid Channel
            </h1>
            <p className="retro-text text-retro-muted mb-4">
              Please specify a valid channel name in the URL.
            </p>
            <Link
              to="/channels"
              className="inline-block retro-button hover:scale-105 active:scale-95"
            >
              Browse Channels
            </Link>
          </div>
        </div>
      );
    }
    
    return (
      <ChannelLogin 
        channelName={normalizedChannel} 
        onLogin={handleLogin}
        onRegister={handleLogin}
      />
    );
  }

  // Show admin dashboard if authenticated
  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/schedule/${normalizedChannel}`)}
            className="retro-button hover:scale-105 active:scale-95"
          >
            ← View Schedule
          </button>
          <button
            onClick={handleLogout}
            className="retro-button hover:scale-105 active:scale-95 bg-red-600 hover:bg-red-700"
          >
            Logout
          </button>
        </div>
        <AdminSchedule24Hour 
          channelName={normalizedChannel}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}

