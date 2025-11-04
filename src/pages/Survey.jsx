import React from 'react';
import { Link } from 'react-router-dom';
import CategorySurvey from '../components/CategorySurvey';

export default function Survey() {
  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="retro-container p-6 retro-glow mb-4">
            <h1 className="retro-title text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 leading-tight">
              STREAM CATEGORY SURVEY
            </h1>
            <p className="retro-text text-retro-muted text-sm sm:text-base">
              Help us understand what you want to see more of!
            </p>
          </div>
          <Link
            to="/calendar"
            className="inline-block retro-button hover:scale-105 active:scale-95"
          >
            ← Back to Calendar
          </Link>
        </div>

        {/* Survey Component */}
        <CategorySurvey />
      </div>
    </div>
  );
}
