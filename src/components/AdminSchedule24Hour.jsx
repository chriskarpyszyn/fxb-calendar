import React, { useState, useEffect, useCallback } from 'react';

export default function AdminSchedule24Hour({ onLogout }) {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSlot, setEditingSlot] = useState(null);
  const [deletingSlotIndex, setDeletingSlotIndex] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    hour: '',
    time: '',
    category: '',
    activity: '',
    description: ''
  });
  
  const [metadataForm, setMetadataForm] = useState({
    date: '',
    startDate: '',
    endDate: ''
  });

  // Fetch schedule from API
  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch('/api/admin?action=get-24hour-schedule', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScheduleData(data.schedule || {
          date: '',
          startDate: '',
          endDate: '',
          timeSlots: [],
          categories: {}
        });
        setMetadataForm({
          date: data.schedule?.date || '',
          startDate: data.schedule?.startDate || '',
          endDate: data.schedule?.endDate || ''
        });
        setError('');
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        setError(data.error || 'Failed to load schedule');
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  // Add new slot
  const addSlot = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=add-24hour-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'add-24hour-slot',
          hour: parseInt(formData.hour),
          time: formData.time,
          category: formData.category,
          activity: formData.activity,
          description: formData.description
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          hour: '',
          time: '',
          category: '',
          activity: '',
          description: ''
        });
        setShowAddForm(false);
        await fetchSchedule();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to add slot');
      }
    } catch (err) {
      console.error('Error adding slot:', err);
      alert('Failed to add slot');
    }
  };

  // Update slot
  const updateSlot = async (slotIndex) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=update-24hour-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update-24hour-slot',
          slotIndex,
          hour: editingSlot.hour !== undefined ? parseInt(editingSlot.hour) : undefined,
          time: editingSlot.time,
          category: editingSlot.category,
          activity: editingSlot.activity,
          description: editingSlot.description
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditingSlot(null);
        await fetchSchedule();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to update slot');
      }
    } catch (err) {
      console.error('Error updating slot:', err);
      alert('Failed to update slot');
    }
  };

  // Delete slot
  const deleteSlot = async (slotIndex) => {
    if (!window.confirm('Are you sure you want to delete this slot? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingSlotIndex(slotIndex);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=delete-24hour-slot', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'delete-24hour-slot', slotIndex })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchSchedule();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to delete slot');
      }
    } catch (err) {
      console.error('Error deleting slot:', err);
      alert('Failed to delete slot');
    } finally {
      setDeletingSlotIndex(null);
    }
  };

  // Update metadata
  const updateMetadata = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=update-24hour-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update-24hour-metadata',
          date: metadataForm.date,
          startDate: metadataForm.startDate,
          endDate: metadataForm.endDate
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditingMetadata(false);
        await fetchSchedule();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to update metadata');
      }
    } catch (err) {
      console.error('Error updating metadata:', err);
      alert('Failed to update metadata');
    }
  };

  // Update categories
  const updateCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin?action=update-24hour-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update-24hour-categories',
          categories: scheduleData.categories
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCategoryEditor(false);
        await fetchSchedule();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          onLogout();
          return;
        }
        alert(data.error || 'Failed to update categories');
      }
    } catch (err) {
      console.error('Error updating categories:', err);
      alert('Failed to update categories');
    }
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

    fetchSchedule();
  }, [onLogout, fetchSchedule]);

  // Get unique categories from slots
  const getAvailableCategories = () => {
    const categories = new Set();
    if (scheduleData?.timeSlots) {
      scheduleData.timeSlots.forEach(slot => {
        if (slot.category) categories.add(slot.category);
      });
    }
    // Also include categories from the categories object
    if (scheduleData?.categories) {
      Object.keys(scheduleData.categories).forEach(cat => categories.add(cat));
    }
    return Array.from(categories);
  };

  return (
    <div className="retro-container p-6 retro-glow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="retro-title text-xl font-bold text-retro-cyan">
          24-HOUR SCHEDULE MANAGEMENT
        </h2>
        <button
          onClick={fetchSchedule}
          disabled={loading}
          className="px-3 py-1 bg-retro-cyan text-retro-bg font-semibold rounded hover:bg-retro-cyan/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-4"></div>
          <p className="retro-text text-retro-muted">Loading schedule...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 bg-red-900/20 border-2 border-red-500 rounded-lg p-6 mb-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Schedule</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button 
            onClick={fetchSchedule} 
            className="retro-button hover:scale-105 active:scale-95"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && scheduleData && (
        <>
          {/* Metadata Section */}
          <div className="retro-card p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-retro-text">Schedule Metadata</h3>
              <button
                onClick={() => {
                  if (editingMetadata) {
                    updateMetadata();
                  } else {
                    setEditingMetadata(true);
                  }
                }}
                className="px-3 py-1 bg-retro-cyan text-retro-bg font-semibold rounded hover:bg-retro-cyan/80 transition-all duration-200"
              >
                {editingMetadata ? 'Save' : 'Edit'}
              </button>
            </div>
            {editingMetadata ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={metadataForm.date}
                  onChange={(e) => setMetadataForm({ ...metadataForm, date: e.target.value })}
                  placeholder="Date (e.g., November 6-7, 2025)"
                  className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                />
                <input
                  type="date"
                  value={metadataForm.startDate}
                  onChange={(e) => setMetadataForm({ ...metadataForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                />
                <input
                  type="date"
                  value={metadataForm.endDate}
                  onChange={(e) => setMetadataForm({ ...metadataForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                />
              </div>
            ) : (
              <div className="text-retro-muted">
                <p><strong>Date:</strong> {scheduleData.date || 'Not set'}</p>
                <p><strong>Start Date:</strong> {scheduleData.startDate || 'Not set'}</p>
                <p><strong>End Date:</strong> {scheduleData.endDate || 'Not set'}</p>
              </div>
            )}
          </div>

          {/* Categories Section */}
          <div className="retro-card p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-retro-text">Categories</h3>
              <button
                onClick={() => {
                  if (showCategoryEditor) {
                    updateCategories();
                  } else {
                    setShowCategoryEditor(true);
                  }
                }}
                className="px-3 py-1 bg-retro-cyan text-retro-bg font-semibold rounded hover:bg-retro-cyan/80 transition-all duration-200"
              >
                {showCategoryEditor ? 'Save' : 'Edit'}
              </button>
            </div>
            {showCategoryEditor ? (
              <div className="space-y-2">
                <p className="text-sm text-retro-muted mb-2">Edit categories JSON format:</p>
                <textarea
                  value={JSON.stringify(scheduleData.categories || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setScheduleData({ ...scheduleData, categories: parsed });
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text font-mono text-sm"
                  rows={10}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.keys(scheduleData.categories || {}).map(cat => (
                  <span
                    key={cat}
                    className="px-3 py-1 bg-retro-cyan text-retro-bg rounded text-sm font-semibold"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Add Slot Form */}
          {showAddForm && (
            <div className="retro-card p-4 mb-6">
              <h3 className="text-lg font-bold text-retro-text mb-3">Add New Slot</h3>
              <div className="space-y-2">
                <input
                  type="number"
                  value={formData.hour}
                  onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                  placeholder="Hour (0-23)"
                  min="0"
                  max="23"
                  className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                />
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="Time (e.g., 11:00pm - 12:00am)"
                  className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                >
                  <option value="">Select Category</option>
                  {getAvailableCategories().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.activity}
                  onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                  placeholder="Activity"
                  className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                  className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={addSlot}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Add Slot
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({
                        hour: '',
                        time: '',
                        category: '',
                        activity: '',
                        description: ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Slots List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-retro-text">
                Time Slots ({scheduleData.timeSlots?.length || 0})
              </h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-retro-cyan text-retro-bg font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {showAddForm ? 'Cancel' : 'Add Slot'}
              </button>
            </div>

            {scheduleData.timeSlots && scheduleData.timeSlots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-retro-muted text-lg mb-4">No slots yet. Add your first slot!</p>
              </div>
            ) : (
              scheduleData.timeSlots.map((slot, index) => (
                <div key={index} className="retro-card p-4">
                  {editingSlot === index ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={editingSlot.hour}
                        onChange={(e) => setEditingSlot({ ...editingSlot, hour: e.target.value })}
                        placeholder="Hour (0-23)"
                        min="0"
                        max="23"
                        className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                      />
                      <input
                        type="text"
                        value={editingSlot.time}
                        onChange={(e) => setEditingSlot({ ...editingSlot, time: e.target.value })}
                        placeholder="Time"
                        className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                      />
                      <select
                        value={editingSlot.category}
                        onChange={(e) => setEditingSlot({ ...editingSlot, category: e.target.value })}
                        className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                      >
                        <option value="">Select Category</option>
                        {getAvailableCategories().map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editingSlot.activity}
                        onChange={(e) => setEditingSlot({ ...editingSlot, activity: e.target.value })}
                        placeholder="Activity"
                        className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                      />
                      <textarea
                        value={editingSlot.description}
                        onChange={(e) => setEditingSlot({ ...editingSlot, description: e.target.value })}
                        placeholder="Description"
                        className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateSlot(index)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSlot(null)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-2">
                            <div className="text-sm text-retro-muted">Hour</div>
                            <div className="font-bold text-retro-text">{slot.hour}</div>
                          </div>
                          <div className="col-span-3">
                            <div className="text-sm text-retro-muted">Time</div>
                            <div className="font-bold text-retro-text">{slot.time}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-sm text-retro-muted">Category</div>
                            <div className="font-semibold text-retro-text">{slot.category}</div>
                          </div>
                          <div className="col-span-5">
                            <div className="text-sm text-retro-muted">Activity</div>
                            <div className="font-bold text-retro-text">{slot.activity}</div>
                            {slot.description && (
                              <div className="text-sm text-retro-muted mt-1">{slot.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() => setEditingSlot({ ...slot, index })}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSlot(index)}
                          disabled={deletingSlotIndex === index}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingSlotIndex === index ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

