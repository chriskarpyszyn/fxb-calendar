import React, { useState, useEffect } from 'react';
import KanbanColumn from './KanbanColumn';

const COLUMNS = ['Ideas', 'Bugs', 'Features', 'In Progress', 'Done'];

export default function KanbanBoard({ isEditable }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin?action=kanban');
      const data = await response.json();
      
      if (data.success) {
        setItems(data.items || []);
      } else {
        setError(data.error || 'Failed to load items');
      }
    } catch (err) {
      console.error('Error fetching kanban items:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const getItemsForColumn = (columnName) => {
    return items.filter(item => item.column === columnName);
  };

  const handleItemDrop = async (itemId, targetColumn, targetOrder, sourceColumn) => {
    if (!isEditable) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const isSameColumn = sourceColumn === targetColumn;
    const isReordering = isSameColumn && targetOrder !== undefined;

    // Optimistic update
    let updatedItems = [...items];
    
    if (isReordering) {
      // Reordering within same column
      const columnItems = updatedItems
        .filter(i => i.column === targetColumn)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Find current position
      const currentIndex = columnItems.findIndex(i => i.id === itemId);
      if (currentIndex === -1) return;
      
      // Remove the dragged item
      const [removedItem] = columnItems.splice(currentIndex, 1);
      
      // Calculate new index (adjust if dragging down)
      let newIndex = targetOrder;
      if (currentIndex < targetOrder) {
        newIndex = targetOrder - 1;
      }
      
      // Clamp to valid range
      newIndex = Math.max(0, Math.min(newIndex, columnItems.length));
      
      // Insert at new position
      columnItems.splice(newIndex, 0, removedItem);
      
      // Reassign orders sequentially
      columnItems.forEach((colItem, idx) => {
        const fullItem = updatedItems.find(i => i.id === colItem.id);
        if (fullItem) {
          fullItem.order = idx;
        }
      });
    } else {
      // Moving between columns
      updatedItems = updatedItems.map(i => {
        if (i.id === itemId) {
          const newItem = {
            ...i,
            column: targetColumn
          };
          // Set finishedAt if moving to Done, clear if moving away
          if (targetColumn === 'Done') {
            newItem.finishedAt = new Date().toISOString();
          } else {
            newItem.finishedAt = null;
          }
          return newItem;
        }
        return i;
      });
    }
    
    setItems(updatedItems);

    try {
      const token = localStorage.getItem('adminToken');
      
      let requestBody = {
        action: 'kanban',
        id: itemId
      };

      if (isReordering) {
        // For reordering, send the new order position
        // The API will handle reordering other items
        const columnItems = updatedItems
          .filter(i => i.column === targetColumn)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        const movedItem = columnItems.find(i => i.id === itemId);
        requestBody.order = movedItem ? movedItem.order : targetOrder;
      } else {
        // Moving to different column
        const targetColumnItems = updatedItems.filter(i => i.column === targetColumn && i.id !== itemId);
        const maxOrder = targetColumnItems.length > 0 
          ? Math.max(...targetColumnItems.map(i => i.order || 0))
          : -1;
        requestBody.column = targetColumn;
        requestBody.order = targetOrder !== undefined ? targetOrder : maxOrder + 1;
      }

      const response = await fetch('/api/admin?action=kanban', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update item');
      }

      // Refresh to get correct ordering
      await fetchItems();
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Failed to move item. Please try again.');
      // Revert optimistic update
      await fetchItems();
    }
  };

  const handleItemDelete = async (itemId) => {
    if (!isEditable) return;
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin?action=kanban', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'kanban', id: itemId })
      });

      const data = await response.json();
      if (data.success) {
        setItems(items.filter(item => item.id !== itemId));
      } else {
        throw new Error(data.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleItemAdd = async (title, description, column) => {
    if (!isEditable) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin?action=kanban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'kanban',
          title,
          description,
          column
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchItems();
      } else {
        throw new Error(data.error || 'Failed to add item');
      }
    } catch (err) {
      console.error('Error adding item:', err);
      throw err;
    }
  };

  const handleItemEdit = async (itemId, title, description) => {
    if (!isEditable) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin?action=kanban', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'kanban',
          id: itemId,
          title,
          description
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchItems();
      } else {
        throw new Error(data.error || 'Failed to update item');
      }
    } catch (err) {
      console.error('Error updating item:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-4"></div>
        <p className="retro-text text-retro-muted">Loading kanban board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-900/20 border-2 border-red-500 rounded-lg p-4">
        <p className="text-red-300 mb-2">{error}</p>
        <button
          onClick={fetchItems}
          className="retro-button hover:scale-105 active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {COLUMNS.map((columnName) => (
        <KanbanColumn
          key={columnName}
          columnName={columnName}
          items={getItemsForColumn(columnName)}
          isEditable={isEditable}
          onItemDrop={handleItemDrop}
          onItemDelete={handleItemDelete}
          onItemAdd={handleItemAdd}
          onItemEdit={handleItemEdit}
        />
      ))}
    </div>
  );
}

