import React, { useState, useEffect } from 'react';
import KanbanBoard from '../components/KanbanBoard';
import '../App.css';

export default function Kanban() {
  const [isEditable, setIsEditable] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      const expiresAt = localStorage.getItem('adminExpiresAt');
      
      if (!token || !expiresAt) {
        setIsEditable(false);
        setCheckingAuth(false);
        return;
      }

      // Check if token has expired
      if (Date.now() > parseInt(expiresAt)) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminExpiresAt');
        setIsEditable(false);
        setCheckingAuth(false);
        return;
      }

      setIsEditable(true);
      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-retro-bg retro-grid scanline flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-4"></div>
          <p className="retro-text text-retro-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <div className="retro-container p-6 retro-glow mb-4">
            <h1 className="retro-title text-lg sm:text-xl md:text-2xl lg:text-3xl mb-2 leading-tight">
              TYPING STARS KANBAN BOARD
            </h1>
            <p className="retro-text text-retro-muted text-sm sm:text-base">
              {isEditable ? (
                <span className="text-green-400">Edit Mode Enabled</span>
              ) : (
                <span>Read-Only View</span>
              )}
            </p>
          </div>
        </div>

        {/* Kanban Board */}
        <KanbanBoard isEditable={isEditable} />
      </div>
    </div>
  );
}

