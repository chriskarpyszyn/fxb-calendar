import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

export default function ChannelsList() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/get-channels');
      const data = await response.json();
      
      if (data.success) {
        setChannels(data.channels || []);
        setError('');
      } else {
        setError(data.error || 'Failed to load channels');
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
      setError('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-retro-bg retro-grid scanline flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-4"></div>
          <p className="retro-text text-retro-muted">Loading channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <div className="retro-container p-6 retro-glow mb-4">
            <h1 className="retro-title text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 leading-tight">
              24 HOUR STREAM<br />
              SCHEDULES
            </h1>
            <p className="retro-text text-retro-muted text-sm sm:text-base">
              Select a channel to view their schedule
            </p>
          </div>
          <Link
            to="/"
            className="inline-block retro-button hover:scale-105 active:scale-95"
          >
            ← Back to Home
          </Link>
        </div>

        {error && (
          <div className="retro-container p-4 retro-glow mb-4 bg-red-900/20 border-2 border-red-500">
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchChannels}
              className="mt-2 retro-button hover:scale-105 active:scale-95"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Channels Grid */}
        {channels.length === 0 && !error ? (
          <div className="retro-container p-8 retro-glow text-center">
            <p className="retro-text text-retro-muted text-lg mb-4">
              No channels found. Be the first to create a schedule!
            </p>
            <Link
              to="/schedule/new/admin"
              className="inline-block retro-button hover:scale-105 active:scale-95"
            >
              Create New Schedule
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {channels.map((channel) => (
              <Link
                key={channel.channelName}
                to={`/schedule/${channel.channelName}`}
                className="block retro-container p-6 retro-glow hover:shadow-glow transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">📺</div>
                  <h2 className="retro-title text-lg font-bold text-retro-cyan mb-2">
                    {channel.channelName}
                  </h2>
                  {channel.date && (
                    <p className="retro-text text-retro-muted text-sm mb-2">
                      {channel.date}
                    </p>
                  )}
                  <p className="retro-text text-retro-muted text-xs">
                    {channel.slotCount} {channel.slotCount === 1 ? 'slot' : 'slots'} filled
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create New Schedule Link */}
        <div className="text-center mt-8">
          <div className="retro-container p-4 retro-glow inline-block">
            <p className="retro-text text-retro-muted text-sm mb-3">
              Want to create your own schedule?
            </p>
            <Link
              to="/schedule/new/admin"
              className="inline-block retro-button hover:scale-105 active:scale-95"
            >
              Create New Schedule
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

