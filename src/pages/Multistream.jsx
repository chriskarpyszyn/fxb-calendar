import React, { useEffect, useState } from 'react';
import '../App.css';

const channels = [
  { name: 'jaeell', displayName: 'jaeell' },
  { name: 'hanlapeno', displayName: 'hanlapeno' },
  { name: 'russkiace', displayName: 'russkiace' },
  { name: 'bigduckkief', displayName: 'bigduckkief' },
];

export default function Multistream() {
  const [parentDomain, setParentDomain] = useState('localhost');

  useEffect(() => {
    // Set the parent domain for Twitch embed
    // Twitch requires the parent parameter to match the domain hosting the embed
    const hostname = window.location.hostname;
    setParentDomain(hostname || 'localhost');
  }, []);

  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <div className="retro-container p-6 retro-glow mb-4">
            <h1 className="retro-title text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 leading-tight">
              MULTISTREAM VIEWER
            </h1>
            <p className="retro-text text-retro-muted text-sm sm:text-base">
              Watch all streams simultaneously
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
              <div className="bg-retro-surface border-b-2 border-retro-border p-3 sm:p-4">
                <h2 className="retro-title text-sm sm:text-base md:text-lg text-retro-cyan">
                  {channel.displayName}
                </h2>
              </div>

              {/* Twitch Embed */}
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://player.twitch.tv/?channel=${channel.name}&parent=${parentDomain}&muted=false`}
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full border-0"
                  title={`${channel.displayName} Stream`}
                  allow="autoplay; fullscreen"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <div className="retro-container p-4 retro-glow">
            <p className="retro-text text-retro-muted text-xs sm:text-sm">
              All streams are embedded from Twitch. Make sure to enable autoplay if prompted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

