import React, { useState, useEffect } from 'react';
import useTwitchStatus from '../hooks/useTwitchStatus';

export default function IdeasList() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('votes'); // 'votes', 'recent', 'newest', 'oldest'
  const { isLive } = useTwitchStatus();

  // Format timestamp to human-readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Fetch ideas from API
  const fetchIdeas = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch('/api/data?type=ideas');
      const data = await response.json();
      
      if (data.success) {
        setIdeas(data.ideas || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load ideas');
      }
    } catch (err) {
      console.error('Error fetching ideas:', err);
      setError('Failed to load ideas');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch ideas on mount and set up auto-refresh
  useEffect(() => {
    fetchIdeas();
    
    // Set up auto-refresh based on stream status
    const interval = setInterval(() => {
      if (isLive) {
        // Refresh every 15 seconds when live
        fetchIdeas(true);
      } else {
        // Refresh every 5 minutes when offline
        fetchIdeas(true);
      }
    }, isLive ? 15000 : 300000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [isLive]);

  // Format idea ID for display (show last 6 digits)
  const formatIdeaId = (id) => {
    if (!id) return '';
    const idStr = id.toString();
    return idStr.length > 6 ? idStr.slice(-6) : idStr;
  };

  // Toggle drawer expansion
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Sort ideas based on current sort option
  const sortIdeas = (ideasList) => {
    const sorted = [...ideasList];
    
    switch (sortBy) {
      case 'votes':
        return sorted.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      case 'recent':
        return sorted.sort((a, b) => {
          const aTime = a.lastVoteAt ? new Date(a.lastVoteAt) : new Date(0);
          const bTime = b.lastVoteAt ? new Date(b.lastVoteAt) : new Date(0);
          return bTime - aTime;
        });
      case 'newest':
        return sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      default:
        return sorted;
    }
  };

  // Get ideas to display (first 5 or all)
  const sortedIdeas = sortIdeas(ideas);
  const displayedIdeas = showAll ? sortedIdeas : sortedIdeas.slice(0, 5);
  const hasMoreIdeas = ideas.length > 5;

  return (
    <div className="mb-6">
      {/* Collapsible Header */}
      <div 
        className="retro-container p-4 retro-glow cursor-pointer transition-all duration-300 hover:shadow-glow"
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="retro-title text-lg font-bold text-retro-cyan">
              VIEW SUBMITTED IDEAS ({ideas.length})
            </h3>
            {isLive && (
              <div className="flex items-center gap-2">
                <div className="animate-pulse">
                  <span className="text-red-500 text-sm">🔴</span>
                </div>
                <span className="text-xs text-retro-muted">Live Updates</span>
              </div>
            )}
            {isRefreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-retro-cyan border-t-transparent"></div>
            )}
          </div>
          <div 
            className={`text-retro-cyan transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`}
          >
            ▼
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="retro-container p-4 retro-glow mt-2">
          {/* Sort Options */}
          {!loading && !error && ideas.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 justify-center">
              <span className="text-sm text-retro-muted mr-2">Sort by:</span>
              {[
                { key: 'votes', label: 'Most Votes', icon: '👍' },
                { key: 'recent', label: 'Recent Votes', icon: '🕒' },
                { key: 'newest', label: 'Newest Ideas', icon: '🆕' },
                { key: 'oldest', label: 'Oldest Ideas', icon: '📅' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-all duration-200 ${
                    sortBy === key
                      ? 'bg-retro-cyan text-retro-bg'
                      : 'bg-retro-bg text-retro-cyan border border-retro-cyan hover:bg-retro-cyan hover:text-retro-bg'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 
                            border-4 border-retro-cyan border-t-transparent mb-4">
              </div>
              <p className="retro-text text-retro-muted">Loading ideas...</p>
            </div>
          )}

          {/* Error State */}
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

          {/* Empty State */}
          {!loading && !error && ideas.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-2xl font-bold text-retro-text mb-2">
                No Ideas Yet
              </h3>
              <p className="text-retro-muted">
                Be the first to suggest a stream idea!
              </p>
            </div>
          )}

          {/* Ideas Display */}
          {!loading && !error && ideas.length > 0 && (
            <div className="space-y-4">
              {displayedIdeas.map((idea) => (
                <div 
                  key={idea.id} 
                  className="retro-card p-4 hover:shadow-glow transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-retro-cyan text-retro-bg px-2 py-1 rounded font-mono text-sm font-bold">
                          #{formatIdeaId(idea.id)}
                        </span>
                        <span className="text-lg font-bold text-retro-text leading-tight">
                          {idea.idea}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-retro-muted flex-wrap">
                        <span className="font-mono">@{idea.username}</span>
                        <span>•</span>
                        <span>{formatTimestamp(idea.timestamp)}</span>
                        <span>•</span>
                        <span>👍 {idea.votes || 0} votes</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* View More/Less Button */}
              {hasMoreIdeas && (
                <button 
                  onClick={() => setShowAll(!showAll)}
                  className="w-full retro-button hover:scale-105 active:scale-95 mt-4"
                >
                  {showAll ? 'Show Less' : `View ${ideas.length - 5} More Ideas`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
