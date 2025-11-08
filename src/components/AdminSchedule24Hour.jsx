import React, { useState, useEffect, useCallback } from 'react';

export default function AdminSchedule24Hour({ channelName, onLogout }) {
  const normalizedChannel = channelName?.toLowerCase().trim() || 'itsflannelbeard';
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSlot, setEditingSlot] = useState(null);
  const [deletingSlotIndex, setDeletingSlotIndex] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Category search input state (for form instances)
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    hour: '',
    category: '',
    activity: '',
    description: ''
  });
  
  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    bg: '',
    border: '',
    text: '',
    dot: ''
  });
  
  const [metadataForm, setMetadataForm] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });

  // Helper to get auth token (admin or channel-specific)
  const getAuthToken = useCallback(() => {
    // Try admin token first
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) return adminToken;
    
    // Try channel-specific token
    const channelToken = localStorage.getItem(`channelToken_${normalizedChannel}`);
    return channelToken;
  }, [normalizedChannel]);

  // Fetch schedule from API
  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch(`/api/admin?action=get-24hour-schedule&channelName=${encodeURIComponent(normalizedChannel)}`, {
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
          startTime: '',
          endTime: '',
          timeSlots: [],
          categories: {}
        });
        setMetadataForm({
          startDate: data.schedule?.startDate || '',
          endDate: data.schedule?.endDate || '',
          startTime: data.schedule?.startTime || '',
          endTime: data.schedule?.endTime || ''
        });
        setError('');
      } else {
        if (response.status === 401) {
          // Clear both admin and channel tokens
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          localStorage.removeItem(`channelToken_${normalizedChannel}`);
          localStorage.removeItem(`channelExpiresAt_${normalizedChannel}`);
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
  }, [onLogout, normalizedChannel, getAuthToken]);

  // Add new slot
  const addSlot = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        onLogout();
        return;
      }
      
      // Auto-generate time from hour
      const generatedTime = calculateHourTime(
        parseInt(formData.hour),
        scheduleData.startDate,
        scheduleData.startTime
      );
      
      const response = await fetch('/api/admin?action=add-24hour-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'add-24hour-slot',
          channelName: normalizedChannel,
          hour: parseInt(formData.hour),
          time: generatedTime,
          category: formData.category,
          activity: formData.activity,
          description: formData.description
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          hour: '',
          category: '',
          activity: '',
          description: ''
        });
        setCategorySearchInput('');
        setShowCategoryDropdown(false);
        setShowAddForm(false);
        await fetchSchedule();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          localStorage.removeItem(`channelToken_${normalizedChannel}`);
          localStorage.removeItem(`channelExpiresAt_${normalizedChannel}`);
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
      const token = getAuthToken();
      
      if (!token) {
        onLogout();
        return;
      }
      
      // Auto-generate time from hour
      const hour = editingSlot.hour !== undefined ? parseInt(editingSlot.hour) : undefined;
      const generatedTime = hour !== undefined
        ? calculateHourTime(hour, scheduleData.startDate, scheduleData.startTime)
        : editingSlot.time;
      
      const response = await fetch('/api/admin?action=update-24hour-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update-24hour-slot',
          channelName: normalizedChannel,
          slotIndex,
          hour: hour,
          time: generatedTime,
          category: editingSlot.category,
          activity: editingSlot.activity,
          description: editingSlot.description
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditingSlot(null);
        setCategorySearchInput('');
        setShowCategoryDropdown(false);
        await fetchSchedule();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          localStorage.removeItem(`channelToken_${normalizedChannel}`);
          localStorage.removeItem(`channelExpiresAt_${normalizedChannel}`);
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
      const token = getAuthToken();
      
      if (!token) {
        onLogout();
        return;
      }
      
      const response = await fetch('/api/admin?action=delete-24hour-slot', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          action: 'delete-24hour-slot', 
          channelName: normalizedChannel,
          slotIndex 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchSchedule();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          localStorage.removeItem(`channelToken_${normalizedChannel}`);
          localStorage.removeItem(`channelExpiresAt_${normalizedChannel}`);
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
      const token = getAuthToken();
      
      if (!token) {
        onLogout();
        return;
      }
      
      const response = await fetch('/api/admin?action=update-24hour-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update-24hour-metadata',
          channelName: normalizedChannel,
          startDate: metadataForm.startDate,
          endDate: metadataForm.endDate,
          startTime: metadataForm.startTime,
          endTime: metadataForm.endTime
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
          localStorage.removeItem(`channelToken_${normalizedChannel}`);
          localStorage.removeItem(`channelExpiresAt_${normalizedChannel}`);
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

  // Generate category colors from category name
  const generateCategoryColors = (categoryName) => {
    const colors = ['purple', 'blue', 'green', 'orange', 'pink', 'cyan', 'yellow', 'red', 'indigo', 'teal', 'amber', 'rose'];
    
    // Simple hash function to consistently map category name to color index
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = ((hash << 5) - hash) + categoryName.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    const color = colors[colorIndex];
    
    return {
      bg: `bg-${color}-100`,
      border: `border-${color}-400`,
      text: `text-${color}-800`,
      dot: `bg-${color}-500`
    };
  };

  // Add new category
  const addCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Category name is required');
      return;
    }
    
    const colors = generateCategoryColors(newCategoryName);
    
    const updatedCategories = {
      ...scheduleData.categories,
      [newCategoryName]: colors
    };
    
    setScheduleData({ ...scheduleData, categories: updatedCategories });
    setNewCategoryName('');
    setCategoryForm({ bg: '', border: '', text: '', dot: '' });
  };

  // Update category
  const updateCategory = (categoryName) => {
    const category = scheduleData.categories[categoryName];
    if (!category) return;
    
    const updatedCategories = {
      ...scheduleData.categories,
      [categoryName]: {
        bg: categoryForm.bg || category.bg,
        border: categoryForm.border || category.border,
        text: categoryForm.text || category.text,
        dot: categoryForm.dot || category.dot
      }
    };
    
    setScheduleData({ ...scheduleData, categories: updatedCategories });
    setEditingCategory(null);
    setCategoryForm({ bg: '', border: '', text: '', dot: '' });
  };

  // Delete category
  const deleteCategory = (categoryName) => {
    if (!window.confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
      return;
    }
    
    const updatedCategories = { ...scheduleData.categories };
    delete updatedCategories[categoryName];
    setScheduleData({ ...scheduleData, categories: updatedCategories });
  };

  // Save categories
  const saveCategories = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        onLogout();
        return;
      }
      
      const response = await fetch('/api/admin?action=update-24hour-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update-24hour-categories',
          channelName: normalizedChannel,
          categories: scheduleData.categories
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCategoryEditor(false);
        setEditingCategory(null);
        await fetchSchedule();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminExpiresAt');
          localStorage.removeItem(`channelToken_${normalizedChannel}`);
          localStorage.removeItem(`channelExpiresAt_${normalizedChannel}`);
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
    // Check admin token first
    const adminExpiresAt = localStorage.getItem('adminExpiresAt');
    if (adminExpiresAt && Date.now() > parseInt(adminExpiresAt)) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminExpiresAt');
    }
    
    // Check channel token
    const channelExpiresAt = localStorage.getItem(`channelExpiresAt_${normalizedChannel}`);
    if (channelExpiresAt && Date.now() > parseInt(channelExpiresAt)) {
      localStorage.removeItem(`channelToken_${normalizedChannel}`);
      localStorage.removeItem(`channelExpiresAt_${normalizedChannel}`);
    }
    
    // If no valid token, logout
    if (!getAuthToken()) {
      onLogout();
      return;
    }

    fetchSchedule();
  }, [onLogout, fetchSchedule, normalizedChannel, getAuthToken]);

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

  // Create and save category on the fly
  const createCategoryOnTheFly = async (categoryName) => {
    if (!categoryName.trim()) return;
    
    // Check if category already exists
    const availableCategories = getAvailableCategories();
    if (availableCategories.includes(categoryName)) {
      return; // Category already exists
    }
    
    // Generate colors for the new category
    const colors = generateCategoryColors(categoryName);
    
    // Add to local state
    const updatedCategories = {
      ...scheduleData.categories,
      [categoryName]: colors
    };
    
    setScheduleData({ ...scheduleData, categories: updatedCategories });
    
    // Save to backend
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch('/api/admin?action=update-24hour-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update-24hour-categories',
          channelName: normalizedChannel,
          categories: updatedCategories
        })
      });
      
      const data = await response.json();
      if (!data.success && response.status !== 401) {
        console.error('Failed to save new category:', data.error);
      }
    } catch (err) {
      console.error('Error saving new category:', err);
    }
  };

  // Get slot for a specific hour
  const getSlotForHour = (hour) => {
    if (!scheduleData?.timeSlots) return null;
    return scheduleData.timeSlots.find(slot => slot.hour === hour) || null;
  };

  // Get slot index for a specific hour
  const getSlotIndexForHour = (hour) => {
    if (!scheduleData?.timeSlots) return -1;
    return scheduleData.timeSlots.findIndex(slot => slot.hour === hour);
  };

  // Calculate actual time for each hour based on start date/time
  const calculateHourTime = (hour, startDate, startTime) => {
    if (!startDate || !startTime) {
      return `Hour ${hour}`;
    }

    try {
      // Parse start date and time
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      // Calculate the start time for this hour slot (hour offset from start)
      const slotStartTime = new Date(startDateTime);
      slotStartTime.setHours(slotStartTime.getHours() + hour);

      // Calculate the end time for this hour slot (one hour later)
      const slotEndTime = new Date(slotStartTime);
      slotEndTime.setHours(slotEndTime.getHours() + 1);

      // Format times in 12-hour format with am/pm
      const formatTime = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minutesStr = minutes.toString().padStart(2, '0');
        return `${hours}:${minutesStr}${period}`;
      };

      return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
    } catch (error) {
      console.error('Error calculating hour time:', error);
      return `Hour ${hour}`;
    }
  };

  // Handle hour click - edit existing or add new
  const handleHourClick = (hour) => {
    const existingSlot = getSlotForHour(hour);
    if (existingSlot) {
      const slotIndex = getSlotIndexForHour(hour);
      setEditingSlot({ ...existingSlot, index: slotIndex });
    } else {
      // Create new slot for this hour
      setFormData({
        hour: hour.toString(),
        category: '',
        activity: '',
        description: ''
      });
      setCategorySearchInput('');
      setShowCategoryDropdown(false);
      setShowAddForm(true);
    }
  };

  return (
    <div className="retro-container p-3 retro-glow">
      <div className="flex items-center justify-between mb-3">
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
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-2"></div>
          <p className="retro-text text-retro-muted">Loading schedule...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4 bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-3">
          <div className="text-6xl mb-2">⚠️</div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Schedule</h3>
          <p className="text-red-300 mb-2">{error}</p>
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
          <div className="retro-card p-3 mb-3">
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
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={metadataForm.startDate}
                    onChange={(e) => setMetadataForm({ ...metadataForm, startDate: e.target.value })}
                    className="px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                    placeholder="Start Date"
                  />
                  <input
                    type="time"
                    value={metadataForm.startTime}
                    onChange={(e) => setMetadataForm({ ...metadataForm, startTime: e.target.value })}
                    className="px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                    placeholder="Start Time"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={metadataForm.endDate}
                    onChange={(e) => setMetadataForm({ ...metadataForm, endDate: e.target.value })}
                    className="px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                    placeholder="End Date"
                  />
                  <input
                    type="time"
                    value={metadataForm.endTime}
                    onChange={(e) => setMetadataForm({ ...metadataForm, endTime: e.target.value })}
                    className="px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                    placeholder="End Time"
                  />
                </div>
              </div>
            ) : (
              <div className="text-retro-muted">
                <p><strong>Start:</strong> {scheduleData.startDate || 'Not set'} {scheduleData.startTime ? `at ${scheduleData.startTime}` : ''}</p>
                <p><strong>End:</strong> {scheduleData.endDate || 'Not set'} {scheduleData.endTime ? `at ${scheduleData.endTime}` : ''}</p>
              </div>
            )}
          </div>

          {/* Categories Section */}
          <div className="retro-card p-3 mb-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-retro-text">Categories</h3>
              <button
                onClick={() => {
                  if (showCategoryEditor) {
                    saveCategories();
                  } else {
                    setShowCategoryEditor(true);
                  }
                }}
                className="px-3 py-1 bg-retro-cyan text-retro-bg font-semibold rounded hover:bg-retro-cyan/80 transition-all duration-200"
              >
                {showCategoryEditor ? 'Save All' : 'Edit'}
              </button>
            </div>
            {showCategoryEditor ? (
              <div className="space-y-2">
                {/* Add New Category */}
                <div className="border-2 border-retro-cyan rounded p-3">
                  <h4 className="text-md font-bold text-retro-text mb-3">Add New Category</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category Name"
                      className="flex-1 px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addCategory();
                        }
                      }}
                    />
                    <button
                      onClick={addCategory}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-all duration-200"
                    >
                      Add Category
                    </button>
                  </div>
                  <p className="text-xs text-retro-muted mt-2">Colors will be automatically generated from the category name</p>
                </div>

                {/* Existing Categories */}
                <div className="space-y-3">
                  {Object.keys(scheduleData.categories || {}).map(cat => (
                    <div key={cat} className="border border-gray-600 rounded p-3">
                      {editingCategory === cat ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-retro-text">{cat}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateCategory(cat)}
                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategory(null);
                                  setCategoryForm({ bg: '', border: '', text: '', dot: '' });
                                }}
                                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={categoryForm.bg || scheduleData.categories[cat].bg}
                              onChange={(e) => setCategoryForm({ ...categoryForm, bg: e.target.value })}
                              placeholder="bg"
                              className="px-2 py-1 bg-retro-bg border border-retro-cyan rounded text-retro-text text-sm"
                            />
                            <input
                              type="text"
                              value={categoryForm.border || scheduleData.categories[cat].border}
                              onChange={(e) => setCategoryForm({ ...categoryForm, border: e.target.value })}
                              placeholder="border"
                              className="px-2 py-1 bg-retro-bg border border-retro-cyan rounded text-retro-text text-sm"
                            />
                            <input
                              type="text"
                              value={categoryForm.text || scheduleData.categories[cat].text}
                              onChange={(e) => setCategoryForm({ ...categoryForm, text: e.target.value })}
                              placeholder="text"
                              className="px-2 py-1 bg-retro-bg border border-retro-cyan rounded text-retro-text text-sm"
                            />
                            <input
                              type="text"
                              value={categoryForm.dot || scheduleData.categories[cat].dot}
                              onChange={(e) => setCategoryForm({ ...categoryForm, dot: e.target.value })}
                              placeholder="dot"
                              className="px-2 py-1 bg-retro-bg border border-retro-cyan rounded text-retro-text text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-retro-text">{cat}</span>
                            <span className="text-xs text-retro-muted">
                              {scheduleData.categories[cat].bg} • {scheduleData.categories[cat].text}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setCategoryForm({
                                  bg: scheduleData.categories[cat].bg,
                                  border: scheduleData.categories[cat].border,
                                  text: scheduleData.categories[cat].text,
                                  dot: scheduleData.categories[cat].dot
                                });
                              }}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteCategory(cat)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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

          {/* 24-Hour Schedule Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-retro-text">
                24-Hour Schedule ({scheduleData.timeSlots?.length || 0} slots filled)
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingSlot(null);
                  setFormData({
                    hour: '',
                    category: '',
                    activity: '',
                    description: ''
                  });
                  setCategorySearchInput('');
                  setShowCategoryDropdown(false);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Clear Selection
              </button>
            </div>

            {/* Hour Grid - Show all 24 hours in vertical flow */}
            <div className="flex flex-col gap-0.5">
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i;
                const slot = getSlotForHour(hour);
                const slotIndex = getSlotIndexForHour(hour);
                const isEditing = editingSlot !== null && editingSlot.index === slotIndex;
                const isInAddForm = showAddForm && parseInt(formData.hour) === hour;
                const calculatedTime = calculateHourTime(hour, scheduleData.startDate, scheduleData.startTime);
                
                return (
                  <div key={hour} className="retro-card p-1.5">
                    {isEditing || isInAddForm ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-retro-text">Hour {hour} ({calculatedTime})</span>
                          <button
                            onClick={() => {
                              setEditingSlot(null);
                              setShowAddForm(false);
                              setFormData({
                                hour: '',
                                category: '',
                                activity: '',
                                description: ''
                              });
                              setCategorySearchInput('');
                              setShowCategoryDropdown(false);
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Cancel
                          </button>
                        </div>
                        {(isEditing || isInAddForm) && (
                          <div className="space-y-2">
                            {/* Searchable/Creatable Category Input */}
                            <div className="relative">
                              <input
                                type="text"
                                value={categorySearchInput !== '' 
                                  ? categorySearchInput
                                  : (isEditing ? (editingSlot.category || '') : (formData.category || ''))
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCategorySearchInput(value);
                                  setShowCategoryDropdown(true);
                                  
                                  // Check if it matches an existing category exactly
                                  const availableCategories = getAvailableCategories();
                                  const exactMatch = availableCategories.find(cat => 
                                    cat.toLowerCase() === value.toLowerCase()
                                  );
                                  
                                  if (exactMatch) {
                                    if (isEditing) {
                                      setEditingSlot({ ...editingSlot, category: exactMatch });
                                    } else {
                                      setFormData({ ...formData, category: exactMatch });
                                    }
                                    setCategorySearchInput('');
                                  } else {
                                    // Clear category if no exact match
                                    if (isEditing) {
                                      setEditingSlot({ ...editingSlot, category: '' });
                                    } else {
                                      setFormData({ ...formData, category: '' });
                                    }
                                  }
                                }}
                                onFocus={() => {
                                  const currentCategory = isEditing ? editingSlot.category : formData.category;
                                  setCategorySearchInput(currentCategory || '');
                                  setShowCategoryDropdown(true);
                                }}
                                onBlur={() => {
                                  // Delay to allow click on dropdown items
                                  setTimeout(() => {
                                    setShowCategoryDropdown(false);
                                    const currentCategory = isEditing ? editingSlot.category : formData.category;
                                    setCategorySearchInput(currentCategory || '');
                                  }, 200);
                                }}
                                placeholder="Type to search or create category"
                                className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                              />
                              {showCategoryDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-retro-bg border-2 border-retro-cyan rounded shadow-lg max-h-60 overflow-y-auto">
                                  {(() => {
                                    const searchValue = categorySearchInput.toLowerCase();
                                    const availableCategories = getAvailableCategories();
                                    const filteredCategories = availableCategories.filter(cat =>
                                      cat.toLowerCase().includes(searchValue)
                                    );
                                    const currentCategory = isEditing ? editingSlot.category : formData.category;
                                    const hasExactMatch = availableCategories.some(cat =>
                                      cat.toLowerCase() === searchValue.toLowerCase()
                                    );
                                    const canCreateNew = searchValue && 
                                      !hasExactMatch && 
                                      searchValue.trim().length > 0;
                                    
                                    return (
                                      <>
                                        {filteredCategories.length > 0 ? (
                                          filteredCategories.map(cat => (
                                            <div
                                              key={cat}
                                              onClick={() => {
                                                if (isEditing) {
                                                  setEditingSlot({ ...editingSlot, category: cat });
                                                } else {
                                                  setFormData({ ...formData, category: cat });
                                                }
                                                setCategorySearchInput('');
                                                setShowCategoryDropdown(false);
                                              }}
                                              className={`px-3 py-2 cursor-pointer hover:bg-retro-cyan/20 ${
                                                currentCategory === cat ? 'bg-retro-cyan/30' : ''
                                              }`}
                                            >
                                              {cat}
                                            </div>
                                          ))
                                        ) : searchValue && !hasExactMatch ? (
                                          <div className="px-3 py-2 text-retro-muted text-sm">
                                            No matching categories
                                          </div>
                                        ) : null}
                                        {canCreateNew && (
                                          <div
                                            onClick={async () => {
                                              const newCategory = categorySearchInput.trim();
                                              await createCategoryOnTheFly(newCategory);
                                              if (isEditing) {
                                                setEditingSlot({ ...editingSlot, category: newCategory });
                                              } else {
                                                setFormData({ ...formData, category: newCategory });
                                              }
                                              setCategorySearchInput('');
                                              setShowCategoryDropdown(false);
                                            }}
                                            className="px-3 py-2 cursor-pointer hover:bg-green-600/20 border-t-2 border-retro-cyan bg-green-600/10"
                                          >
                                            <span className="text-green-400">+</span> Create new category: "{categorySearchInput.trim()}"
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                            <input
                              type="text"
                              value={isEditing ? editingSlot.activity : formData.activity}
                              onChange={(e) => {
                                if (isEditing) {
                                  setEditingSlot({ ...editingSlot, activity: e.target.value });
                                } else {
                                  setFormData({ ...formData, activity: e.target.value });
                                }
                              }}
                              placeholder="Activity"
                              className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                            />
                            <textarea
                              value={isEditing ? editingSlot.description : formData.description}
                              onChange={(e) => {
                                if (isEditing) {
                                  setEditingSlot({ ...editingSlot, description: e.target.value });
                                } else {
                                  setFormData({ ...formData, description: e.target.value });
                                }
                              }}
                              placeholder="Description"
                              className="w-full px-3 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (isEditing) {
                                    updateSlot(slotIndex);
                                  } else {
                                    addSlot();
                                  }
                                }}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-all duration-200"
                              >
                                Save
                              </button>
                              {slot && (
                                <button
                                  onClick={() => deleteSlot(slotIndex)}
                                  disabled={deletingSlotIndex === slotIndex}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-all duration-200 disabled:opacity-50"
                                >
                                  {deletingSlotIndex === slotIndex ? 'Deleting...' : 'Delete'}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleHourClick(hour)}
                        className="cursor-pointer hover:bg-retro-bg/20 transition-all duration-200 rounded p-0.5"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-retro-text">Hour {hour} ({calculatedTime})</span>
                          {slot ? (
                            <span className="text-xs text-green-400">✓ Filled</span>
                          ) : (
                            <span className="text-xs text-retro-muted">Empty</span>
                          )}
                        </div>
                        {slot ? (
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-retro-text">{slot.time}</div>
                            <div className="text-xs text-retro-muted">{slot.category}</div>
                            <div className="text-sm font-bold text-retro-text">{slot.activity}</div>
                            {slot.description && (
                              <div className="text-xs text-retro-muted">{slot.description}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-0.5 text-retro-muted">
                            <div className="text-base mb-0">+</div>
                            <div className="text-xs">Click to add</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

