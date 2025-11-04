import React, { useState } from 'react';

export default function ChannelLogin({ channelName, onLogin, onRegister }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const action = isRegistering ? 'register' : 'login';
      const response = await fetch('/api/channel-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action,
          channelName: channelName.toLowerCase().trim(),
          password 
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store channel session token in localStorage
        localStorage.setItem(`channelToken_${data.channelName}`, data.sessionToken);
        localStorage.setItem(`channelExpiresAt_${data.channelName}`, data.expiresAt.toString());
        localStorage.setItem('currentChannel', data.channelName);
        onLogin(data.channelName, data.sessionToken);
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
            {isRegistering ? 'CREATE SCHEDULE' : 'CHANNEL ACCESS'}
          </h1>
          <p className="retro-text text-retro-muted mb-2">
            Channel: <span className="font-bold">{channelName}</span>
          </p>
          <p className="retro-text text-retro-muted text-sm">
            {isRegistering 
              ? 'Create a password to manage your schedule'
              : 'Enter password to manage schedule'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-retro-text text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-retro-bg border-2 border-retro-cyan rounded-lg text-retro-text focus:outline-none focus:border-retro-cyan focus:ring-2 focus:ring-retro-cyan/50"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full retro-button hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Create Schedule' : 'Login')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setPassword('');
              }}
              className="text-retro-cyan hover:text-retro-cyan/80 text-sm underline"
            >
              {isRegistering 
                ? 'Already have an account? Login' 
                : "Don't have an account? Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

