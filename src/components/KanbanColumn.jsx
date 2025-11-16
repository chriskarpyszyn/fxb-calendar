import React, { useState } from 'react';
import KanbanItem from './KanbanItem';

export default function KanbanColumn({ 
  columnName, 
  items, 
  isEditable, 
  onItemDrop, 
  onItemDelete,
  onItemAdd,
  onItemEdit
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragOver = (e) => {
    if (!isEditable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Find which item element we're hovering over
    const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
    const elements = e.currentTarget.querySelectorAll('[data-item-id]');
    const y = e.clientY;
    
    let targetIndex = sortedItems.length;
    
    // Check each item element to see if we're above its midpoint
    elements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (y < midpoint && idx < targetIndex) {
        targetIndex = idx;
      }
    });
    
    setDragOverIndex(targetIndex);
  };

  const handleDragLeave = (e) => {
    if (!isEditable) return;
    // Only clear if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e) => {
    if (!isEditable) return;
    e.preventDefault();
    setDragOverIndex(null);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const itemId = dragData.id || e.dataTransfer.getData('text/plain');
      const sourceColumn = dragData.column;
      const sourceOrder = dragData.order || 0;
      
      if (itemId && onItemDrop) {
        const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
        let targetOrder = sortedItems.length;
        
        // If dropping in same column, calculate position
        if (sourceColumn === columnName && dragOverIndex !== null) {
          targetOrder = dragOverIndex;
          // Adjust if dragging down (need to account for removed item)
          if (sourceOrder < targetOrder) {
            targetOrder = targetOrder - 1;
          }
        }
        
        onItemDrop(itemId, columnName, targetOrder, sourceColumn);
      }
    } catch (err) {
      // Fallback to simple drop
      const itemId = e.dataTransfer.getData('text/plain');
      if (itemId && onItemDrop) {
        onItemDrop(itemId, columnName);
      }
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || isAdding) return;

    setIsAdding(true);
    try {
      await onItemAdd(newTitle.trim(), newDescription.trim(), columnName);
      setNewTitle('');
      setNewDescription('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="flex-1 min-w-0">
      <div className="retro-container p-3 retro-glow mb-3">
        <h2 className="retro-title text-lg font-bold text-retro-cyan mb-2">
          {columnName}
        </h2>
        <div className="text-sm text-retro-muted">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="min-h-[400px] space-y-2"
      >
        {sortedItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {dragOverIndex === index && isEditable && (
              <div className="h-2 bg-retro-cyan border-2 border-dashed border-retro-cyan rounded mb-2" />
            )}
            <div data-item-id={item.id}>
              <KanbanItem
                item={item}
                isEditable={isEditable}
                onDelete={onItemDelete}
                onEdit={onItemEdit}
              />
            </div>
          </React.Fragment>
        ))}
        {dragOverIndex === sortedItems.length && isEditable && (
          <div className="h-2 bg-retro-cyan border-2 border-dashed border-retro-cyan rounded mb-2" />
        )}

        {isEditable && (
          <div>
            {showAddForm ? (
              <div className="retro-card p-3 border-2 border-retro-cyan">
                <form onSubmit={handleAddItem}>
                  <div className="mb-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Title *"
                      className="w-full px-2 py-1 bg-retro-bg border border-retro-cyan rounded text-retro-text text-sm mb-2"
                      required
                      autoFocus
                    />
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows="3"
                      className="w-full px-2 py-1 bg-retro-bg border border-retro-cyan rounded text-retro-text text-sm resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!newTitle.trim() || isAdding}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAdding ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewTitle('');
                        setNewDescription('');
                      }}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full px-3 py-2 bg-retro-bg border-2 border-dashed border-retro-cyan/50 hover:border-retro-cyan text-retro-cyan rounded transition-all duration-200 text-sm font-semibold"
              >
                + Add Item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

