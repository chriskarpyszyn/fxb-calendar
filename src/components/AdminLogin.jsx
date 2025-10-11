import React, { useState } from 'react';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.success) {
        // Store session token in localStorage
        localStorage.setItem('adminToken', data.sessionToken);
        localStorage.setItem('adminExpiresAt', data.expiresAt.toString());
        onLogin();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline flex items-center justify-center p-4">
      <div className="retro-container p-8 retro-glow max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="retro-title text-2xl font-bold text-retro-cyan mb-2">
            ADMIN ACCESS
          </h1>
          <p className="retro-text text-retro-muted">
            Enter password to access admin panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-retro-text mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border-2 border-retro-cyan rounded-lg focus:ring-2 focus:ring-retro-cyan focus:border-transparent bg-retro-bg text-retro-text placeholder-retro-muted"
              placeholder="Enter admin password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full retro-button hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-retro-cyan border-t-transparent mr-2"></div>
                Authenticating...
              </div>
            ) : (
              'LOGIN'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
