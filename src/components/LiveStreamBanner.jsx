import React from 'react';

export default function LiveStreamBanner({ twitchStatus }) {
  // Only show the banner when live and not loading
  if (!twitchStatus.isLive || twitchStatus.loading) {
    return null;
  }

  return (
    <div className="mb-6 retro-container p-6 retro-glow bg-red-50 border-4 border-red-500">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full font-bold text-lg mb-3 animate-pulse">
          <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
          LIVE NOW
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {twitchStatus.title || 'Streaming Now!'}
        </h2>
        {twitchStatus.gameName && (
          <p className="text-lg md:text-xl text-gray-700 mb-2">
            Playing: <span className="font-semibold">{twitchStatus.gameName}</span>
          </p>
        )}
        <p className="text-md md:text-lg text-gray-600 mb-4">
          👁️ {twitchStatus.viewerCount?.toLocaleString() || 0} viewers watching
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3 justify-center flex-wrap mb-4">
          <a
            href={`https://www.twitch.tv/${twitchStatus.channelName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            🎮 Watch on Twitch
          </a>
          <a
            href={`https://www.twitch.tv/${twitchStatus.channelName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            ❤️ Follow
          </a>
        </div>
      </div>

      {/* Embedded Twitch Player */}
      <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://player.twitch.tv/?channel=${twitchStatus.channelName}&parent=fxb-calendar.vercel.app&muted=false`}
          className="absolute top-0 left-0 w-full h-full"
          allowFullScreen
          title="Twitch Stream"
        ></iframe>
      </div>
    </div>
  );
}
