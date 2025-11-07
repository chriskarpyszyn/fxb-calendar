import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './../App.css';

export default function WidgetLanding() {
  const { channelName } = useParams();
  const [selectedChannel, setSelectedChannel] = useState(channelName?.toLowerCase().trim() || 'itsflannelbeard');
  const [allChannels, setAllChannels] = useState([]);
  const [copiedUrl, setCopiedUrl] = useState(null);

  // Load all channels
  useEffect(() => {
    fetch('/api/get-channels')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setAllChannels(data.channels || []);
        }
      })
      .catch(err => {
        console.error('Error fetching channels:', err);
      });
  }, []);

  const baseUrl = window.location.origin;

  const widgets = [
    {
      name: 'Schedule Overlay',
      description: 'Shows current and upcoming schedule slots',
      behavior: 'Displays the current activity and next 1-2 upcoming slots. Automatically rotates between cards every 8 seconds.',
      size: 'Recommended: 400px × 150px',
      route: `/widget/${selectedChannel}`,
      icon: '📅',
      color: 'text-blue-400'
    },
    {
      name: '24-Hour Timer',
      description: 'Countdown timer from stream start time',
      behavior: 'Before stream starts: shows "24 HOUR STREAM STARTS IN" countdown. After start: switches to "24 HOUR COUNTDOWN" timer. Shows celebration when complete.',
      size: 'Recommended: 400px × 200px',
      route: `/timer/${selectedChannel}`,
      icon: '⏱️',
      color: 'text-cyan-400'
    },
    {
      name: 'Stream Timer',
      description: 'Controllable countdown timer managed from admin portal',
      behavior: 'Set duration, start/stop/pause, and adjust time during stream. Managed through admin dashboard.',
      size: 'Recommended: 400px × 200px',
      route: '/widget-timer',
      icon: '⏰',
      color: 'text-yellow-400'
    }
  ];

  const copyToClipboard = (url, widgetName) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(widgetName);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <div className="retro-container p-6 retro-glow mb-4">
            <h1 className="retro-title text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 leading-tight">
              OBS WIDGETS
            </h1>
            <p className="retro-text text-retro-muted text-sm sm:text-base">
              Copy widget URLs for use in OBS Browser Source
            </p>
          </div>
        </div>

        {/* Channel Selection */}
        {allChannels.length > 0 && (
          <div className="mb-6 retro-container p-4 retro-glow">
            <label className="block text-retro-cyan font-bold text-sm mb-2">
              Select Channel:
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full bg-retro-surface border-2 border-retro-cyan text-retro-text font-mono px-4 py-2 focus:outline-none focus:border-retro-cyan focus:ring-2 focus:ring-retro-cyan/50"
            >
              {allChannels.map((channel) => (
                <option key={channel.channelName} value={channel.channelName.toLowerCase()}>
                  {channel.channelName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Widget Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {widgets.map((widget) => {
            const fullUrl = `${baseUrl}${widget.route}`;
            const isCopied = copiedUrl === widget.name;

            return (
              <div
                key={widget.name}
                className="retro-container p-6 retro-glow hover:shadow-glow transition-all duration-200"
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">{widget.icon}</div>
                  <h2 className={`retro-title text-lg font-bold ${widget.color} mb-2`}>
                    {widget.name}
                  </h2>
                  <p className="retro-text text-retro-muted text-sm mb-2">
                    {widget.description}
                  </p>
                  {widget.behavior && (
                    <p className="retro-text text-retro-muted text-xs italic mb-2">
                      {widget.behavior}
                    </p>
                  )}
                  {widget.size && (
                    <p className="retro-text text-retro-cyan text-xs font-semibold mb-4">
                      📐 OBS Size: {widget.size}
                    </p>
                  )}
                </div>

                {/* URL Display and Copy */}
                <div className="space-y-3">
                  <div className="bg-retro-surface border-2 border-retro-border p-3 rounded">
                    <div className="text-xs text-retro-muted mb-1">Widget URL:</div>
                    <div className="text-xs font-mono text-retro-text break-all">
                      {fullUrl}
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(fullUrl, widget.name)}
                    className="w-full retro-button hover:scale-105 active:scale-95"
                  >
                    {isCopied ? '✓ Copied!' : 'Copy URL'}
                  </button>

                  <Link
                    to={widget.route}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-retro-cyan hover:text-retro-cyan/80 text-sm font-mono underline"
                  >
                    Preview Widget →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="retro-container p-6 retro-glow">
          <h3 className="retro-title text-lg font-bold text-retro-cyan mb-4">
            How to Use in OBS:
          </h3>
          <ol className="space-y-3 text-retro-text text-sm font-mono">
            <li className="flex items-start">
              <span className="text-retro-cyan mr-2">1.</span>
              <span>Copy the widget URL using the "Copy URL" button above</span>
            </li>
            <li className="flex items-start">
              <span className="text-retro-cyan mr-2">2.</span>
              <span>In OBS, add a new "Browser Source"</span>
            </li>
            <li className="flex items-start">
              <span className="text-retro-cyan mr-2">3.</span>
              <span>Paste the URL into the "URL" field</span>
            </li>
            <li className="flex items-start">
              <span className="text-retro-cyan mr-2">4.</span>
              <span>Set width and height (see recommended size on each widget card above)</span>
            </li>
            <li className="flex items-start">
              <span className="text-retro-cyan mr-2">5.</span>
              <span>Check "Shutdown source when not visible" and "Refresh browser when scene becomes active"</span>
            </li>
            <li className="flex items-start">
              <span className="text-retro-cyan mr-2">6.</span>
              <span>Position and resize the widget as needed in your scene</span>
            </li>
          </ol>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-block retro-button hover:scale-105 active:scale-95"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

