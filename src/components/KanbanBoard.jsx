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
      const response = await fetch('/api/kanban');
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

  const handleItemDrop = async (itemId, targetColumn) => {
    if (!isEditable) return;

    const item = items.find(i => i.id === itemId);
    if (!item || item.column === targetColumn) return;

    // Optimistic update
    const updatedItems = items.map(i => {
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
    setItems(updatedItems);

    try {
      const token = localStorage.getItem('adminToken');
      const targetColumnItems = updatedItems.filter(i => i.column === targetColumn && i.id !== itemId);
      const maxOrder = targetColumnItems.length > 0 
        ? Math.max(...targetColumnItems.map(i => i.order || 0))
        : -1;

      const response = await fetch('/api/kanban', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: itemId,
          column: targetColumn,
          order: maxOrder + 1
        })
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
      const response = await fetch('/api/kanban', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: itemId })
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
      const response = await fetch('/api/kanban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
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
        />
      ))}
    </div>
  );
}

