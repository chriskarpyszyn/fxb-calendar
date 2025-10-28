import React, { useState, useEffect, useCallback } from 'react';

export default function AdminDashboard({ onLogout }) {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [expandedVoters, setExpandedVoters] = useState(new Set());
  const [resettingVotes, setResettingVotes] = useState(false);

  // Fetch ideas from API
  const fetchIdeas = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch('/api/admin-get-ideas', {
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
      
      const response = await fetch('/api/admin-delete-idea', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ideaId })
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
      
      const response = await fetch('/api/admin-reset-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
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
  }, [onLogout, fetchIdeas]);

  return (
    <div className="min-h-screen bg-retro-bg retro-grid scanline p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="retro-container p-6 retro-glow mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="retro-title text-2xl font-bold text-retro-cyan mb-2">
                ADMIN DASHBOARD
              </h1>
              <p className="retro-text text-retro-muted">
                Manage submitted stream ideas
              </p>
            </div>
            <div className="flex gap-3">
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
              <button
                onClick={onLogout}
                className="retro-button hover:scale-105 active:scale-95"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="retro-container p-4 retro-glow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
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

        {/* Ideas List */}
        <div className="retro-container p-6 retro-glow">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-4"></div>
              <p className="retro-text text-retro-muted">Loading ideas...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8 bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Ideas</h3>
              <p className="text-red-300 mb-4">{error}</p>
              <button 
                onClick={fetchIdeas} 
                className="retro-button hover:scale-105 active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && ideas.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-2xl font-bold text-retro-text mb-2">
                No Ideas Found
              </h3>
              <p className="text-retro-muted">
                No ideas have been submitted yet.
              </p>
            </div>
          )}

          {!loading && !error && ideas.length > 0 && (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <div 
                  key={idea.id} 
                  className="retro-card p-4 hover:shadow-glow transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <p className="text-lg font-bold text-retro-text mb-2 leading-tight">
                        {idea.idea}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-retro-muted flex-wrap mb-3">
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
      </div>
    </div>
  );
}
