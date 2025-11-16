import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSchedule24Hour from './AdminSchedule24Hour';

export default function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [expandedVoters, setExpandedVoters] = useState(new Set());
  const [resettingVotes, setResettingVotes] = useState(false);
  const [activeTab, setActiveTab] = useState('ideas'); // 'ideas', 'surveys', 'schedule', 'channels', 'widgets', 'kanban'
  
  // Survey results state
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyError, setSurveyError] = useState('');
  const [surveyView, setSurveyView] = useState('aggregate'); // 'aggregate' or 'detailed'
  const [ipFilter, setIpFilter] = useState('');
  const [deletingSurveyId, setDeletingSurveyId] = useState(null);
  
  // Channel management state
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelPassword, setNewChannelPassword] = useState('');
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [resettingPasswordFor, setResettingPasswordFor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [deletingChannel, setDeletingChannel] = useState(null);

  // Widget timer state
  const [timerState, setTimerState] = useState(null);
  const [timerLoading, setTimerLoading] = useState(false);
  const [timerError, setTimerError] = useState('');
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [updatingTimer, setUpdatingTimer] = useState(false);

  // Fetch ideas from API
  const fetchIdeas = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch('/api/admin?action=get-ideas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIdeas(data.ideas || []);
        setError('');
      } else {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        setError(data.error || 'Failed to load ideas');
      }
    } catch (err) {
      console.error('Error fetching ideas:', err);
      setError('Failed to load ideas');
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  // Delete an idea
  const deleteIdea = async (ideaId) => {
    if (!window.confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(ideaId);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=delete-idea', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'delete-idea', ideaId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the idea from local state
        setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
      } else {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to delete idea');
      }
    } catch (err) {
      console.error('Error deleting idea:', err);
      alert('Failed to delete idea');
    } finally {
      setDeletingId(null);
    }
  };

  // Reset all votes
  const resetVotes = async () => {
    if (!window.confirm('Are you sure you want to reset ALL votes? This action cannot be undone.')) {
      return;
    }

    try {
      setResettingVotes(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=reset-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'reset-votes' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh ideas to show updated vote counts
        await fetchIdeas();
        alert(`Successfully reset votes for ${data.resetCount} ideas`);
      } else {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to reset votes');
      }
    } catch (err) {
      console.error('Error resetting votes:', err);
      alert('Failed to reset votes');
    } finally {
      setResettingVotes(false);
    }
  };

  // Toggle voter list expansion
  const toggleVoters = (ideaId) => {
    const newExpanded = new Set(expandedVoters);
    if (newExpanded.has(ideaId)) {
      newExpanded.delete(ideaId);
    } else {
      newExpanded.add(ideaId);
    }
    setExpandedVoters(newExpanded);
  };

  // Format timestamp to human-readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Format vote timestamp
  const formatVoteTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Fetch survey responses from API
  const fetchSurveys = useCallback(async () => {
    try {
      setSurveyLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch('/api/admin?action=get-surveys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSurveyResponses(data.responses || []);
        setSurveyError('');
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        setSurveyError(data.error || 'Failed to load survey responses');
      }
    } catch (err) {
      console.error('Error fetching survey responses:', err);
      setSurveyError('Failed to load survey responses');
    } finally {
      setSurveyLoading(false);
    }
  }, [onLogout]);

  // Calculate aggregate statistics for survey responses
  const calculateSurveyStats = () => {
    const categoryCounts = {};
    let totalResponses = surveyResponses.length;
    let totalWithOther = 0;
    const otherTexts = [];

    surveyResponses.forEach(response => {
      response.categories.forEach(category => {
        if (category === 'Other') {
          totalWithOther++;
          if (response.otherText) {
            otherTexts.push(response.otherText);
          }
        } else {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });
    });

    // Sort categories by count (descending)
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1]);

    return { categoryCounts, sortedCategories, totalResponses, totalWithOther, otherTexts };
  };

  // Delete a survey response
  const deleteSurvey = async (surveyId) => {
    if (!window.confirm('Are you sure you want to delete this survey response? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingSurveyId(surveyId);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=delete-survey', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'delete-survey', surveyId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the survey response from local state
        setSurveyResponses(prev => prev.filter(response => response.id !== surveyId));
      } else {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to delete survey response');
      }
    } catch (err) {
      console.error('Error deleting survey response:', err);
      alert('Failed to delete survey response');
    } finally {
      setDeletingSurveyId(null);
    }
  };

  // Filter survey responses by IP
  const filteredSurveyResponses = surveyResponses.filter(response => {
    if (!ipFilter) return true;
    return response.ip.toLowerCase().includes(ipFilter.toLowerCase());
  });

  // Fetch channels from API
  const fetchChannels = useCallback(async () => {
    try {
      setChannelsLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch('/api/admin?action=list-channels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setChannels(data.channels || []);
        setChannelsError('');
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        setChannelsError(data.error || 'Failed to load channels');
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
      setChannelsError('Failed to load channels');
    } finally {
      setChannelsLoading(false);
    }
  }, [onLogout]);

  // Create new channel
  const createChannel = async () => {
    if (!newChannelName.trim() || !newChannelPassword.trim()) {
      alert('Channel name and password are required');
      return;
    }

    try {
      setCreatingChannel(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=create-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'create-channel',
          channelName: newChannelName.trim().toLowerCase(),
          password: newChannelPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewChannelName('');
        setNewChannelPassword('');
        setShowCreateChannel(false);
        await fetchChannels();
        alert(`Channel "${data.channelName}" created successfully!`);
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to create channel');
      }
    } catch (err) {
      console.error('Error creating channel:', err);
      alert('Failed to create channel');
    } finally {
      setCreatingChannel(false);
    }
  };

  // Update channel password
  const updateChannelPassword = async (channelName) => {
    if (!newPassword.trim()) {
      alert('Password is required');
      return;
    }

    try {
      setResettingPasswordFor(channelName);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=update-channel-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update-channel-password',
          channelName: channelName,
          password: newPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewPassword('');
        setResettingPasswordFor(null);
        await fetchChannels();
        alert(`Password updated for "${channelName}"`);
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to update password');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      alert('Failed to update password');
    } finally {
      setResettingPasswordFor(null);
    }
  };

  // Delete channel
  const deleteChannel = async (channelName) => {
    if (!window.confirm(`Are you sure you want to delete channel "${channelName}"? This will delete all schedule data and cannot be undone.`)) {
      return;
    }

    try {
      setDeletingChannel(channelName);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=delete-channel', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'delete-channel',
          channelName: channelName
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchChannels();
        alert(`Channel "${channelName}" deleted successfully`);
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to delete channel');
      }
    } catch (err) {
      console.error('Error deleting channel:', err);
      alert('Failed to delete channel');
    } finally {
      setDeletingChannel(null);
    }
  };

  // Fetch widget timer state
  const fetchTimerState = useCallback(async () => {
    try {
      setTimerLoading(true);
      setTimerError('');
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch('/api/admin?action=get-widget-timer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTimerState(data);
        // Update input fields with current duration
        if (data.duration) {
          const totalMinutes = Math.floor(data.duration / (60 * 1000));
          setTimerHours(Math.floor(totalMinutes / 60));
          setTimerMinutes(totalMinutes % 60);
        }
        setTimerError('');
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        setTimerError(data.error || 'Failed to load timer state');
      }
    } catch (err) {
      console.error('Error fetching timer state:', err);
      setTimerError('Failed to load timer state');
    } finally {
      setTimerLoading(false);
    }
  }, [onLogout]);

  // Set timer duration
  const setTimer = async (startImmediately = false) => {
    if (timerHours < 0 || timerMinutes < 0) {
      setTimerError('Hours and minutes must be non-negative');
      return;
    }

    if (timerHours === 0 && timerMinutes === 0) {
      setTimerError('Duration must be greater than 0');
      return;
    }

    try {
      setUpdatingTimer(true);
      setTimerError('');
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=set-widget-timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'set-widget-timer',
          hours: timerHours,
          minutes: timerMinutes,
          startImmediately: startImmediately
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTimerState();
        if (startImmediately) {
          alert('Timer set and started successfully');
        } else {
          alert('Timer set successfully');
        }
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        setTimerError(data.error || 'Failed to set timer');
      }
    } catch (err) {
      console.error('Error setting timer:', err);
      setTimerError('Failed to set timer');
    } finally {
      setUpdatingTimer(false);
    }
  };

  // Update timer (start/stop/pause/resume/adjust)
  const updateTimer = async (action, adjustMinutes = null) => {
    try {
      setUpdatingTimer(true);
      setTimerError('');
      const token = localStorage.getItem('adminToken');
      
      const body = { action };
      if (adjustMinutes !== null) {
        body.adjustMinutes = adjustMinutes;
      }
      
      const response = await fetch('/api/admin?action=update-widget-timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTimerState();
        const messages = {
          start: 'Timer started',
          stop: 'Timer stopped',
          pause: 'Timer paused',
          resume: 'Timer resumed',
          adjust: `Timer adjusted by ${adjustMinutes > 0 ? '+' : ''}${adjustMinutes} minutes`
        };
        alert(messages[action] || 'Timer updated');
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        setTimerError(data.error || 'Failed to update timer');
      }
    } catch (err) {
      console.error('Error updating timer:', err);
      setTimerError('Failed to update timer');
    } finally {
      setUpdatingTimer(false);
    }
  };

  // Format milliseconds to HH:MM:SS
  const formatTime = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if session is still valid
  useEffect(() => {
    const expiresAt = localStorage.getItem('adminExpiresAt');
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminExpiresAt');
      onLogout();
      return;
    }

    fetchIdeas();
    fetchSurveys();
    if (activeTab === 'channels') {
      fetchChannels();
    }
    
    let interval = null;
    if (activeTab === 'widgets') {
      fetchTimerState();
      // Set up interval to refresh timer state every second when on widgets tab
      interval = setInterval(() => {
        fetchTimerState();
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [onLogout, fetchIdeas, fetchSurveys, fetchChannels, fetchTimerState, activeTab]);

  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-2">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="retro-container p-3 retro-glow mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="retro-title text-2xl font-bold text-retro-cyan mb-2">
                ADMIN DASHBOARD
              </h1>
              <p className="retro-text text-retro-muted">
                Manage submitted stream ideas and schedules
              </p>
            </div>
            <div className="flex gap-3">
              {activeTab === 'ideas' && (
                <button
                  onClick={resetVotes}
                  disabled={resettingVotes}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingVotes ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Resetting...
                    </div>
                  ) : (
                    'RESET VOTES'
                  )}
                </button>
              )}
              <button
                onClick={onLogout}
                className="retro-button hover:scale-105 active:scale-95"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="retro-container p-2 retro-glow mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('ideas')}
              className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                activeTab === 'ideas'
                  ? 'bg-retro-cyan text-retro-bg'
                  : 'bg-retro-bg text-retro-cyan border border-retro-cyan hover:bg-retro-cyan hover:text-retro-bg'
              }`}
            >
              Ideas
            </button>
            <button
              onClick={() => setActiveTab('surveys')}
              className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                activeTab === 'surveys'
                  ? 'bg-retro-cyan text-retro-bg'
                  : 'bg-retro-bg text-retro-cyan border border-retro-cyan hover:bg-retro-cyan hover:text-retro-bg'
              }`}
            >
              Surveys
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                activeTab === 'schedule'
                  ? 'bg-retro-cyan text-retro-bg'
                  : 'bg-retro-bg text-retro-cyan border border-retro-cyan hover:bg-retro-cyan hover:text-retro-bg'
              }`}
            >
              24-Hour Schedule
            </button>
            <button
              onClick={() => {
                setActiveTab('channels');
                fetchChannels();
              }}
              className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                activeTab === 'channels'
                  ? 'bg-retro-cyan text-retro-bg'
                  : 'bg-retro-bg text-retro-cyan border border-retro-cyan hover:bg-retro-cyan hover:text-retro-bg'
              }`}
            >
              Channels
            </button>
            <button
              onClick={() => {
                setActiveTab('widgets');
                fetchTimerState();
              }}
              className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                activeTab === 'widgets'
                  ? 'bg-retro-cyan text-retro-bg'
                  : 'bg-retro-bg text-retro-cyan border border-retro-cyan hover:bg-retro-cyan hover:text-retro-bg'
              }`}
            >
              Widgets
            </button>
            <button
              onClick={() => navigate('/kanban')}
              className="px-4 py-2 rounded font-semibold transition-all duration-200 bg-retro-bg text-retro-cyan border border-retro-cyan hover:bg-retro-cyan hover:text-retro-bg"
            >
              Kanban
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'channels' && (
          <div className="retro-container p-3 retro-glow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="retro-title text-xl font-bold text-retro-cyan">
                CHANNEL MANAGEMENT
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchChannels}
                  disabled={channelsLoading}
                  className="px-3 py-1 bg-retro-cyan text-retro-bg font-semibold rounded hover:bg-retro-cyan/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {channelsLoading ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={() => setShowCreateChannel(!showCreateChannel)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-all duration-200"
                >
                  {showCreateChannel ? 'Cancel' : '+ Create Channel'}
                </button>
              </div>
            </div>

            {channelsError && (
              <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-3 mb-3">
                <p className="text-red-300">{channelsError}</p>
              </div>
            )}

            {/* Create Channel Form */}
            {showCreateChannel && (
              <div className="retro-card p-4 mb-3 border-2 border-retro-cyan">
                <h3 className="text-lg font-bold text-retro-text mb-3">Create New Channel</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-retro-text text-sm font-semibold mb-1">
                      Channel Name (Twitch username)
                    </label>
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="e.g., itsflannelbeard"
                      className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                      disabled={creatingChannel}
                    />
                  </div>
                  <div>
                    <label className="block text-retro-text text-sm font-semibold mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newChannelPassword}
                      onChange={(e) => setNewChannelPassword(e.target.value)}
                      placeholder="Set password for this channel"
                      className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                      disabled={creatingChannel}
                    />
                  </div>
                  <button
                    onClick={createChannel}
                    disabled={creatingChannel || !newChannelName.trim() || !newChannelPassword.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingChannel ? 'Creating...' : 'Create Channel'}
                  </button>
                </div>
              </div>
            )}

            {channelsLoading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-2"></div>
                <p className="retro-text text-retro-muted">Loading channels...</p>
              </div>
            )}

            {!channelsLoading && channels.length === 0 && (
              <div className="text-center py-8">
                <p className="retro-text text-retro-muted text-lg mb-4">
                  No channels found.
                </p>
                <p className="retro-text text-retro-muted text-sm">
                  Create your first channel to get started.
                </p>
              </div>
            )}

            {!channelsLoading && channels.length > 0 && (
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div key={channel.channelName} className="retro-card p-4 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-retro-text">
                            {channel.channelName}
                          </h3>
                          {channel.hasPassword && (
                            <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                              Has Password
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-retro-muted space-y-1">
                          {channel.date && (
                            <p>Schedule Date: {channel.date}</p>
                          )}
                          <p>Slots Filled: {channel.slotCount}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {resettingPasswordFor === channel.channelName ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="New password"
                              className="px-2 py-1 bg-retro-bg border border-retro-cyan rounded text-retro-text text-sm"
                            />
                            <button
                              onClick={() => updateChannelPassword(channel.channelName)}
                              disabled={!newPassword.trim()}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setResettingPasswordFor(null);
                                setNewPassword('');
                              }}
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setResettingPasswordFor(channel.channelName)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-all duration-200"
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => deleteChannel(channel.channelName)}
                              disabled={deletingChannel === channel.channelName}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-all duration-200 disabled:opacity-50"
                            >
                              {deletingChannel === channel.channelName ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'widgets' && (
          <div className="retro-container p-3 retro-glow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="retro-title text-xl font-bold text-retro-cyan">
                WIDGET MANAGEMENT
              </h2>
              <button
                onClick={fetchTimerState}
                disabled={timerLoading}
                className="px-3 py-1 bg-retro-cyan text-retro-bg font-semibold rounded hover:bg-retro-cyan/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {timerLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {timerError && (
              <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-3 mb-3">
                <p className="text-red-300">{timerError}</p>
              </div>
            )}

            {/* Stream Timer Widget */}
            <div className="retro-card p-4 border-2 border-retro-cyan mb-4">
              <h3 className="text-lg font-bold text-retro-text mb-4">Stream Timer Widget</h3>
              
              {/* Current Timer Display */}
              {timerState && timerState.duration > 0 && (
                <div className="mb-4 p-3 bg-retro-surface rounded">
                  <div className="text-sm text-retro-muted mb-1">Current Timer:</div>
                  <div className="text-3xl font-mono font-bold text-retro-cyan">
                    {formatTime(timerState.remainingTime)}
                  </div>
                  <div className="text-xs text-retro-muted mt-1">
                    Status: {timerState.isRunning ? 'Running' : 'Paused/Stopped'}
                  </div>
                </div>
              )}

              {/* Set Duration */}
              <div className="mb-4">
                <h4 className="text-md font-semibold text-retro-text mb-2">Set Duration</h4>
                <div className="flex gap-3 items-center">
                  <div>
                    <label className="block text-retro-text text-sm font-semibold mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={timerHours}
                      onChange={(e) => setTimerHours(parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                      disabled={updatingTimer}
                    />
                  </div>
                  <div>
                    <label className="block text-retro-text text-sm font-semibold mb-1">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                      disabled={updatingTimer}
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-6">
                    <button
                      onClick={() => setTimer(false)}
                      disabled={updatingTimer || (timerHours === 0 && timerMinutes === 0)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Duration
                    </button>
                    <button
                      onClick={() => setTimer(true)}
                      disabled={updatingTimer || (timerHours === 0 && timerMinutes === 0)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set & Start
                    </button>
                  </div>
                </div>
              </div>

              {/* Timer Controls */}
              {timerState && timerState.duration > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-retro-text mb-2">Timer Controls</h4>
                  <div className="flex flex-wrap gap-2">
                    {timerState.isRunning ? (
                      <>
                        <button
                          onClick={() => updateTimer('pause')}
                          disabled={updatingTimer}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => updateTimer('stop')}
                          disabled={updatingTimer}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Stop
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => updateTimer('start')}
                          disabled={updatingTimer}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Start
                        </button>
                        {timerState.pausedAt !== null && (
                          <button
                            onClick={() => updateTimer('resume')}
                            disabled={updatingTimer}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Resume
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Adjust Time */}
              {timerState && timerState.duration > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-retro-text mb-2">Adjust Time</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateTimer('adjust', 10)}
                      disabled={updatingTimer}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +10 min
                    </button>
                    <button
                      onClick={() => updateTimer('adjust', 30)}
                      disabled={updatingTimer}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +30 min
                    </button>
                    <button
                      onClick={() => updateTimer('adjust', 60)}
                      disabled={updatingTimer}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +1 hour
                    </button>
                    <button
                      onClick={() => updateTimer('adjust', -10)}
                      disabled={updatingTimer}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -10 min
                    </button>
                    <button
                      onClick={() => updateTimer('adjust', -30)}
                      disabled={updatingTimer}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -30 min
                    </button>
                  </div>
                </div>
              )}

              {/* Widget URL */}
              <div className="mt-4 p-3 bg-retro-surface rounded">
                <div className="text-sm text-retro-muted mb-1">Widget URL for OBS:</div>
                <div className="text-xs font-mono text-retro-text break-all">
                  {window.location.origin}/widget-timer
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="retro-container p-3 retro-glow">
            <p className="text-retro-muted mb-3">
              Note: To manage a specific channel's schedule, navigate to /schedule/:channelName/admin
            </p>
            <AdminSchedule24Hour channelName="itsflannelbeard" onLogout={onLogout} />
          </div>
        )}

        {activeTab === 'ideas' && (
          <>
            {/* Stats */}
            <div className="retro-container p-3 retro-glow mb-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-retro-cyan">{ideas.length}</div>
                  <div className="text-sm text-retro-muted">Total Ideas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-retro-cyan">
                    {ideas.filter(idea => idea.status === 'pending').length}
                  </div>
                  <div className="text-sm text-retro-muted">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-retro-cyan">
                    {ideas.reduce((sum, idea) => sum + (idea.votes || 0), 0)}
                  </div>
                  <div className="text-sm text-retro-muted">Total Votes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-retro-cyan">
                    {ideas.reduce((sum, idea) => sum + ((idea.voters && idea.voters.length) || 0), 0)}
                  </div>
                  <div className="text-sm text-retro-muted">Unique Voters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-retro-cyan">
                    {ideas.length > 0 ? Math.round(ideas.reduce((sum, idea) => sum + (idea.votes || 0), 0) / ideas.length * 10) / 10 : 0}
                  </div>
                  <div className="text-sm text-retro-muted">Avg Votes/Idea</div>
                </div>
              </div>
            </div>
        <div className="retro-container p-3 retro-glow">
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-2"></div>
              <p className="retro-text text-retro-muted">Loading ideas...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-4 bg-red-900/20 border-2 border-red-500 rounded-lg p-4">
              <div className="text-6xl mb-2">⚠️</div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Ideas</h3>
              <p className="text-red-300 mb-2">{error}</p>
              <button 
                onClick={fetchIdeas} 
                className="retro-button hover:scale-105 active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && ideas.length === 0 && (
            <div className="text-center py-6">
              <h3 className="text-2xl font-bold text-retro-text mb-2">
                No Ideas Found
              </h3>
              <p className="text-retro-muted">
                No ideas have been submitted yet.
              </p>
            </div>
          )}

          {!loading && !error && ideas.length > 0 && (
            <div className="space-y-2">
              {ideas.map((idea) => (
                <div 
                  key={idea.id} 
                  className="retro-card p-3 hover:shadow-glow transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <p className="text-lg font-bold text-retro-text mb-1 leading-tight">
                        {idea.idea}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-retro-muted flex-wrap mb-2">
                        <span className="font-mono">@{idea.username}</span>
                        <span>•</span>
                        <span>{formatTimestamp(idea.timestamp)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          👍 {idea.votes || 0} votes
                          {idea.voters && idea.voters.length > 0 && (
                            <span className="text-xs">
                              ({idea.voters.length} voters)
                            </span>
                          )}
                        </span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          idea.status === 'pending' 
                            ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-500' 
                            : 'bg-green-900/20 text-green-300 border border-green-500'
                        }`}>
                          {idea.status || 'pending'}
                        </span>
                      </div>
                      
                      {/* Voter Details */}
                      {idea.voters && idea.voters.length > 0 && (
                        <div className="mb-3">
                          <button
                            onClick={() => toggleVoters(idea.id)}
                            className="text-sm text-retro-cyan hover:text-retro-cyan/80 transition-colors duration-200 flex items-center gap-1"
                          >
                            {expandedVoters.has(idea.id) ? '▼' : '▶'} 
                            View {idea.voters.length} voter{idea.voters.length !== 1 ? 's' : ''}
                            {idea.lastVoteAt && (
                              <span className="text-retro-muted">
                                (last vote: {formatVoteTime(idea.lastVoteAt)})
                              </span>
                            )}
                          </button>
                          
                          {expandedVoters.has(idea.id) && (
                            <div className="mt-2 ml-4 space-y-1 max-h-32 overflow-y-auto">
                              {idea.voters.map((voter, index) => (
                                <div key={index} className="text-xs text-retro-muted flex items-center justify-between bg-retro-bg/20 p-2 rounded">
                                  <span className="font-mono">@{voter.username}</span>
                                  <div className="flex items-center gap-2">
                                    <span>{voter.pointsSpent} pts</span>
                                    <span>•</span>
                                    <span>{formatVoteTime(voter.votedAt)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteIdea(idea.id)}
                      disabled={deletingId === idea.id}
                      className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === idea.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Deleting...
                        </div>
                      ) : (
                        'DELETE'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}

        {activeTab === 'surveys' && (
          <>
            {/* Survey Results Section */}
            <div className="retro-container p-3 retro-glow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="retro-title text-xl font-bold text-retro-cyan">
              SURVEY RESULTS
            </h2>
            <button
              onClick={fetchSurveys}
              disabled={surveyLoading}
              className="px-3 py-1 bg-retro-cyan text-retro-bg font-semibold rounded hover:bg-retro-cyan/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {surveyLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* View Toggle */}
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setSurveyView('aggregate')}
              className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                surveyView === 'aggregate'
                  ? 'bg-retro-cyan text-retro-bg'
                  : 'bg-retro-bg text-retro-cyan border border-retro-cyan hover:bg-retro-cyan hover:text-retro-bg'
              }`}
            >
              Aggregate View
            </button>
            <button
              onClick={() => setSurveyView('detailed')}
              className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                surveyView === 'detailed'
                  ? 'bg-retro-cyan text-retro-bg'
                  : 'bg-retro-bg text-retro-cyan border border-retro-cyan hover:bg-retro-cyan hover:text-retro-bg'
              }`}
            >
              Detailed View
            </button>
          </div>

          {surveyLoading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-2"></div>
              <p className="retro-text text-retro-muted">Loading survey responses...</p>
            </div>
          )}

          {surveyError && (
            <div className="text-center py-4 bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-3">
              <div className="text-6xl mb-2">⚠️</div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Survey Results</h3>
              <p className="text-red-300 mb-2">{surveyError}</p>
              <button 
                onClick={fetchSurveys} 
                className="retro-button hover:scale-105 active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}

          {!surveyLoading && !surveyError && (
            <>
              {surveyView === 'aggregate' ? (
                <div>
                  {surveyResponses.length === 0 ? (
                    <div className="text-center py-6">
                      <h3 className="text-2xl font-bold text-retro-text mb-2">
                        No Survey Responses Yet
                      </h3>
                      <p className="text-retro-muted">
                        No one has submitted a survey response yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <div className="text-center mb-2">
                          <div className="text-3xl font-bold text-retro-cyan">{surveyResponses.length}</div>
                          <div className="text-sm text-retro-muted">Total Responses</div>
                        </div>
                      </div>

                      {(() => {
                        const stats = calculateSurveyStats();
                        return (
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-retro-text mb-2">Category Votes</h3>
                            {stats.sortedCategories.length > 0 ? (
                              <div className="space-y-1">
                                {stats.sortedCategories.map(([category, count]) => (
                                  <div key={category} className="retro-card p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-semibold text-retro-text">{category}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-retro-cyan">{count}</span>
                                        <span className="text-sm text-retro-muted">votes</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-retro-muted">No category votes yet</p>
                            )}

                            {stats.totalWithOther > 0 && (
                              <div className="mt-2 retro-card p-3">
                                <div className="mb-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-semibold text-retro-text">Other</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl font-bold text-retro-cyan">{stats.totalWithOther}</span>
                                      <span className="text-sm text-retro-muted">votes</span>
                                    </div>
                                  </div>
                                </div>
                                {stats.otherTexts.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm font-semibold text-retro-muted mb-2">Other Suggestions:</p>
                                    {stats.otherTexts.map((text, index) => (
                                      <div key={index} className="text-sm text-retro-text bg-retro-bg/20 p-2 rounded">
                                        "{text}"
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              ) : (
                <div>
                  {/* Detailed View */}
                  {filteredSurveyResponses.length === 0 ? (
                    <div className="text-center py-6">
                      <h3 className="text-2xl font-bold text-retro-text mb-2">
                        {ipFilter ? 'No Matching Responses' : 'No Survey Responses Yet'}
                      </h3>
                      <p className="text-retro-muted">
                        {ipFilter ? 'Try a different IP filter.' : 'No one has submitted a survey response yet.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* IP Filter */}
                      <div className="mb-3">
                        <input
                          type="text"
                          value={ipFilter}
                          onChange={(e) => setIpFilter(e.target.value)}
                          placeholder="Filter by IP address..."
                          className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text placeholder-retro-muted focus:outline-none focus:ring-2 focus:ring-retro-cyan"
                        />
                      </div>

                      <div className="space-y-2">
                        {filteredSurveyResponses.map((response) => (
                          <div 
                            key={response.id} 
                            className="retro-card p-3 hover:shadow-glow transition-all duration-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-grow">
                                <div className="flex items-center gap-4 text-sm text-retro-muted flex-wrap mb-2">
                                  <span className="font-mono">IP: {response.ip}</span>
                                  <span>•</span>
                                  <span>{formatTimestamp(response.timestamp)}</span>
                                  <span>•</span>
                                  <span>ID: {response.id.slice(-8)}</span>
                                </div>
                                
                                <div className="mb-2">
                                  <span className="text-sm font-semibold text-retro-muted mb-1 block">Selected Categories:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {response.categories.map((category, index) => (
                                      <span
                                        key={index}
                                        className="px-3 py-1 bg-retro-cyan text-retro-bg rounded text-sm font-semibold"
                                      >
                                        {category}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {response.otherText && (
                                  <div className="mt-2">
                                    <span className="text-sm font-semibold text-retro-muted mb-1 block">Other:</span>
                                    <p className="text-retro-text bg-retro-bg/20 p-2 rounded">
                                      "{response.otherText}"
                                    </p>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => deleteSurvey(response.id)}
                                disabled={deletingSurveyId === response.id}
                                className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingSurveyId === response.id ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    Deleting...
                                  </div>
                                ) : (
                                  'DELETE'
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
