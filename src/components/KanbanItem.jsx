import React, { useState } from 'react';

export default function KanbanItem({ item, isEditable, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description || '');
  const [isSaving, setIsSaving] = useState(false);

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
    if (!isEditable || isEditing) {
      e.preventDefault();
      return;
    }
    // Store item data for drag
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      column: item.column,
      order: item.order || 0
    }));
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onEdit(item.id, editTitle.trim(), editDescription.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="retro-card p-3 mb-2 border-2 border-retro-cyan">
        <form onSubmit={handleSaveEdit}>
          <div className="mb-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title *"
              className="w-full px-2 py-1 bg-retro-bg border border-retro-cyan rounded text-retro-text text-sm mb-2"
              required
              autoFocus
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              rows="3"
              className="w-full px-2 py-1 bg-retro-bg border border-retro-cyan rounded text-retro-text text-sm resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!editTitle.trim() || isSaving}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      draggable={isEditable && !isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`retro-card p-3 mb-2 border border-retro-cyan/30 hover:border-retro-cyan transition-all duration-200 ${
        isEditable && !isEditing ? 'cursor-move' : 'cursor-default'
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
        {isEditable && (
          <div className="flex gap-1 flex-shrink-0">
            {onEdit && (
              <button
                onClick={handleEditClick}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-all duration-200 hover:scale-105 active:scale-95"
                title="Edit item"
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-all duration-200 hover:scale-105 active:scale-95"
                title="Delete item"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

