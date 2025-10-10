import React, { useState, useEffect } from 'react';

export default function IdeasList() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch ideas from API
  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/get-ideas');
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
    }
  };

  // Fetch ideas on mount and set up auto-refresh
  useEffect(() => {
    fetchIdeas();
    
    // Set up auto-refresh every 5 minutes (300 seconds)
    const interval = setInterval(fetchIdeas, 300000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Format timestamp to human-readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Toggle drawer expansion
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Get ideas to display (first 5 or all)
  const displayedIdeas = showAll ? ideas : ideas.slice(0, 5);
  const hasMoreIdeas = ideas.length > 5;

  return (
    <div className="mb-6">
      {/* Collapsible Header */}
      <div 
        className="retro-container p-4 retro-glow cursor-pointer transition-all duration-300 hover:shadow-glow"
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <h3 className="retro-title text-lg font-bold text-retro-cyan">
            VIEW SUBMITTED IDEAS ({ideas.length})
          </h3>
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
                      <p className="text-lg font-bold text-retro-text mb-2 leading-tight">
                        {idea.idea}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-retro-muted flex-wrap">
                        <span className="font-mono">@{idea.username}</span>
                        <span>•</span>
                        <span>{formatTimestamp(idea.timestamp)}</span>
                        <span>•</span>
                        <span>👍 {idea.votes} votes</span>
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
