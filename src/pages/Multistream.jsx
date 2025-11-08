import React, { useEffect, useState } from 'react';
import '../App.css';

const channels = [
  { name: 'jaeell', displayName: 'jaeell', donationUrl: 'https://www.extra-life.org/participants/556533' },
  { name: 'hanlapeno', displayName: 'hanlapeno', donationUrl: 'https://www.extra-life.org/participants/561915' },
  { name: 'russkiace', displayName: 'russkiace', donationUrl: 'https://www.extra-life.org/participants/556407' },
  { name: 'bigduckkief', displayName: 'bigduckkief', donationUrl: 'https://www.extra-life.org/participants/Kiefer-Delorme' },
];

export default function Multistream() {
  const [parentDomain, setParentDomain] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side
    setIsClient(true);
    // Set the parent domain for Twitch embed
    // Twitch requires the parent parameter to match the domain hosting the embed
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setParentDomain(hostname || 'localhost');
    }
  }, []);

  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <div className="retro-container p-6 retro-glow mb-4">
            <h1 className="retro-title text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 leading-tight">
              TRACTION REC EXTRA LIFE
            </h1>
            <p className="retro-text text-retro-muted text-sm sm:text-base">
              <a 
                href="https://www.extra-life.org/teams/72119" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-retro-cyan hover:text-retro-accent underline transition-colors duration-200"
              >
                https://www.extra-life.org/teams/72119
              </a>
            </p>
          </div>
        </div>

        {/* Stream Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {channels.map((channel) => (
            <div
              key={channel.name}
              className="retro-container retro-glow overflow-hidden"
            >
              {/* Channel Header */}
              <div className="bg-retro-surface border-b-2 border-retro-border p-3 sm:p-4 flex items-center justify-between">
                <h2 className="retro-title text-sm sm:text-base md:text-lg text-retro-cyan">
                  {channel.displayName}
                </h2>
                <a
                  href={channel.donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="retro-text text-retro-cyan hover:text-retro-accent underline transition-colors duration-200 text-xs sm:text-sm"
                >
                  Donate
                </a>
              </div>

              {/* Twitch Embed */}
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                {isClient && parentDomain ? (
                  <iframe
                    src={`https://player.twitch.tv/?channel=${channel.name}&parent=${parentDomain}&muted=false`}
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full border-0"
                    title={`${channel.displayName} Stream`}
                    allow="autoplay; fullscreen"
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full border-0 bg-retro-surface flex items-center justify-center">
                    <p className="retro-text text-retro-muted">Loading stream...</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

