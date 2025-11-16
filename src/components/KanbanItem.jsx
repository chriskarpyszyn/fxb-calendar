import React from 'react';

export default function KanbanItem({ item, isEditable, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDragStart = (e) => {
    if (!isEditable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  return (
    <div
      draggable={isEditable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`retro-card p-3 mb-2 border border-retro-cyan/30 hover:border-retro-cyan transition-all duration-200 ${
        isEditable ? 'cursor-move' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-retro-text mb-1 break-words">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-retro-muted mb-2 break-words">
              {item.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-retro-muted">
            {item.createdAt && (
              <span>Created: {formatDate(item.createdAt)}</span>
            )}
            {item.finishedAt && (
              <span className="text-green-400">
                Finished: {formatDate(item.finishedAt)}
              </span>
            )}
          </div>
        </div>
        {isEditable && onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            className="flex-shrink-0 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-all duration-200 hover:scale-105 active:scale-95"
            title="Delete item"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

