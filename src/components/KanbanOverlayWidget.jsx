import React, { useState, useEffect } from 'react';

export default function KanbanOverlayWidget() {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/admin?action=kanban');
        const data = await response.json();
        
        if (data.success) {
          // Filter to only "In Progress" items
          const inProgressItems = (data.items || [])
            .filter(item => item.column === 'In Progress')
            .sort((a, b) => (b.order || 0) - (a.order || 0)); // Most recent first
          
          setItems(inProgressItems);
        }
      } catch (err) {
        console.error('Error fetching kanban items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
    // Refresh every 30 seconds
    const interval = setInterval(fetchItems, 30000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through items every 10 seconds
  useEffect(() => {
    if (items.length <= 1) return;

    const rotationInterval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
    }, 10000); // Rotate every 10 seconds

    return () => clearInterval(rotationInterval);
  }, [items.length]);

  if (loading) {
    return (
      <div className="kanban-overlay-widget">
        <div className="kanban-loading">Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="kanban-overlay-widget">
        <div className="kanban-empty">No items in progress</div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div className="kanban-overlay-widget">
      <div className="kanban-header">
        <span className="kanban-label">WORKING ON</span>
      </div>
      <div className="kanban-card">
        <div className="kanban-title">{currentItem.title || 'Untitled'}</div>
        {currentItem.description && (
          <div className="kanban-description">{currentItem.description}</div>
        )}
      </div>
      {items.length > 1 && (
        <div className="kanban-indicator">
          {items.map((_, index) => (
            <span
              key={index}
              className={`kanban-dot ${index === currentIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      )}
      <style>{`
        .kanban-overlay-widget {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(244, 114, 182, 0.3);
          border-radius: 8px;
          padding: 0.75rem;
          min-width: 250px;
          max-width: 350px;
          font-family: 'JetBrains Mono', monospace;
        }

        .kanban-header {
          margin-bottom: 0.5rem;
        }

        .kanban-label {
          font-size: 0.625rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .kanban-card {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(244, 114, 182, 0.2);
          border-radius: 4px;
          padding: 0.75rem;
        }

        .kanban-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #f472b6;
          margin-bottom: 0.25rem;
          line-height: 1.3;
        }

        .kanban-description {
          font-size: 0.75rem;
          color: #e2e8f0;
          line-height: 1.4;
          opacity: 0.9;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .kanban-loading,
        .kanban-empty {
          font-size: 0.75rem;
          color: #94a3b8;
          text-align: center;
          padding: 0.5rem;
        }

        .kanban-indicator {
          display: flex;
          gap: 0.25rem;
          justify-content: center;
          margin-top: 0.5rem;
        }

        .kanban-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(244, 114, 182, 0.3);
          transition: all 0.3s ease;
        }

        .kanban-dot.active {
          background: #f472b6;
          width: 8px;
          box-shadow: 0 0 8px rgba(244, 114, 182, 0.6);
        }
      `}</style>
    </div>
  );
}

