import React from 'react';
import { Link } from 'react-router-dom';
import './../App.css';

export default function Landing() {
  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <div className="retro-container p-6 retro-glow mb-4">
            <h1 className="retro-title text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 leading-tight">
              ITSFLANNELBEARD'S<br />
              STREAM SCHEDULE
            </h1>
            <p className="retro-text text-retro-muted text-sm sm:text-base">
              Choose an option below to get started
            </p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Monthly Calendar Card */}
          <Link
            to="/calendar"
            className="block retro-container p-6 retro-glow hover:shadow-glow transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">📅</div>
              <h2 className="retro-title text-lg font-bold text-retro-cyan mb-2">
                Monthly Calendar
              </h2>
              <p className="retro-text text-retro-muted text-sm">
                View the full 31-day stream schedule
              </p>
            </div>
          </Link>

          {/* 24 Hour Stream Card */}
          <Link
            to="/24hour-schedule"
            className="block retro-container p-6 retro-glow hover:shadow-glow transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">⏰</div>
              <h2 className="retro-title text-lg font-bold text-retro-cyan mb-2">
                24 Hour Stream
              </h2>
              <p className="retro-text text-retro-muted text-sm">
                View the Extra Life 24-hour schedule
              </p>
            </div>
          </Link>

          {/* Stream Survey Card */}
          <Link
            to="/survey"
            className="block retro-container p-6 retro-glow hover:shadow-glow transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h2 className="retro-title text-lg font-bold text-retro-cyan mb-2">
                Stream Survey
              </h2>
              <p className="retro-text text-retro-muted text-sm">
                Tell us what you want to see more of!
              </p>
            </div>
          </Link>
        </div>

        {/* Channels Listing Card */}
        <div className="mt-6 text-center">
          <Link
            to="/channels"
            className="inline-block retro-container p-6 retro-glow hover:shadow-glow transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">📺</div>
              <h2 className="retro-title text-lg font-bold text-retro-cyan mb-2">
                All Channel Schedules
              </h2>
              <p className="retro-text text-retro-muted text-sm">
                Browse schedules from all channels
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
