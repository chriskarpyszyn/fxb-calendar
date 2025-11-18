# Current Task Widget - Implementation Plan

## Overview
A stream overlay widget that displays the current task from the "In Progress" column of the kanban board.

## Widget Specifications

### Visual Design
- **Size**: 500x100px
- **Position**: Top-center of stream overlay
- **Background**: Semi-transparent dark with cyan glow
- **Font**: JetBrains Mono (monospace, retro theme)
- **Animation**: Slide-in on change, pulse glow effect

### Display Elements
```
┌──────────────────────────────────────────────────┐
│  CURRENT TASK                         [CATEGORY] │
│  ───────────────────────────────────────────────│
│  Task Title Here                                 │
│  Brief description or progress...                │
└──────────────────────────────────────────────────┘
```

---

## Features

### Core Features
1. **Auto-fetch** current "In Progress" kanban items
2. **Rotation**: If multiple tasks in progress, rotate every 8 seconds
3. **Category badge**: Show category with color coding
4. **Empty state**: Show "No tasks in progress" message
5. **Live updates**: Poll API every 30 seconds for changes

### Advanced Features (Future)
- **Checklist progress**: Show "3/5 subtasks complete" if item has checklist
- **Time tracking**: Show elapsed time on task
- **Priority indicator**: Highlight high-priority tasks
- **Animations**: Smooth transitions between tasks

---

## Data Flow

### API Endpoint
**GET** `/api/admin?action=kanban`

Returns kanban board structure:
```json
{
  "ideas": [],
  "bugs": [],
  "features": [],
  "inProgress": [
    {
      "id": "1234567890",
      "title": "Implement viewer goals widget",
      "description": "Create overlay widget for sub/follow goals",
      "category": "features",
      "finishedAt": null
    }
  ],
  "done": []
}
```

### Filter Logic
```javascript
// Get only items in "In Progress" column
const currentTasks = kanbanData.inProgress || [];

// If multiple tasks, rotate through them
const currentIndex = Math.floor(Date.now() / 8000) % currentTasks.length;
const displayTask = currentTasks[currentIndex];
```

---

## Component Structure

### File: `src/components/CurrentTaskWidget.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import './CurrentTaskWidget.css';

const CurrentTaskWidget = ({ channelName }) => {
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch kanban data
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/admin?action=kanban');
        const data = await response.json();
        setTasks(data.inProgress || []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        setLoading(false);
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  // Rotation logic
  useEffect(() => {
    if (tasks.length <= 1) return;

    const rotationInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tasks.length);
    }, 8000); // Rotate every 8 seconds

    return () => clearInterval(rotationInterval);
  }, [tasks.length]);

  // Render logic
  const currentTask = tasks[currentIndex];

  if (loading) {
    return <div className="current-task-widget loading">Loading...</div>;
  }

  if (!currentTask) {
    return (
      <div className="current-task-widget empty">
        <div className="task-header">NO ACTIVE TASKS</div>
        <div className="task-description">Take a break or grab a new task!</div>
      </div>
    );
  }

  return (
    <div className="current-task-widget">
      <div className="task-header">
        <span className="task-label">CURRENT TASK</span>
        <span className={`task-category ${currentTask.category}`}>
          {currentTask.category.toUpperCase()}
        </span>
      </div>
      <div className="task-title">{currentTask.title}</div>
      {currentTask.description && (
        <div className="task-description">
          {currentTask.description.substring(0, 60)}
          {currentTask.description.length > 60 ? '...' : ''}
        </div>
      )}
      {tasks.length > 1 && (
        <div className="task-indicator">
          {currentIndex + 1} / {tasks.length}
        </div>
      )}
    </div>
  );
};

export default CurrentTaskWidget;
```

---

## Styling

### File: `src/components/CurrentTaskWidget.css`

```css
.current-task-widget {
  width: 500px;
  height: 100px;
  background: rgba(15, 23, 42, 0.9); /* slate-900 with opacity */
  border: 2px solid #22d3ee; /* cyan-400 */
  border-radius: 8px;
  padding: 12px 16px;
  font-family: 'JetBrains Mono', monospace;
  color: #f8fafc; /* slate-50 */
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
  animation: slideIn 0.5s ease-out;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.current-task-widget.loading,
.current-task-widget.empty {
  justify-content: center;
  align-items: center;
  text-align: center;
  opacity: 0.6;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #22d3ee; /* cyan-400 */
  margin-bottom: 4px;
}

.task-category {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: bold;
}

.task-category.features {
  background: #3b82f6; /* blue-500 */
  color: white;
}

.task-category.bugs {
  background: #ef4444; /* red-500 */
  color: white;
}

.task-category.ideas {
  background: #a855f7; /* purple-500 */
  color: white;
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc; /* slate-50 */
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-description {
  font-size: 12px;
  color: #cbd5e1; /* slate-300 */
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-indicator {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 10px;
  color: #64748b; /* slate-500 */
}

/* Glow animation */
.current-task-widget {
  animation: pulse-glow 3s infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(34, 211, 238, 0.6);
  }
}
```

---

## Route Setup

### File: `src/App.js`

Add route:
```jsx
import CurrentTaskWidget from './components/CurrentTaskWidget';

// In Routes section:
<Route
  path="/widget-current-task/:channelName"
  element={<CurrentTaskWidget />}
/>
```

---

## API Considerations

### Current API Limitations
The `/api/admin?action=kanban` endpoint currently requires admin authentication.

### Solution Options

#### Option 1: Public Read-Only Endpoint (Recommended)
Create new endpoint `/api/kanban-public?action=get-in-progress`

**Pros**:
- No auth required for widgets
- Lightweight (only returns in-progress items)
- Secure (read-only)

**Implementation**:
```javascript
// api/kanban-public.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = getRedisClient();
  const items = await client.get('kanban:items');
  const kanbanData = items ? JSON.parse(items) : { inProgress: [] };

  res.json({ inProgress: kanbanData.inProgress || [] });
}
```

#### Option 2: Use Existing Endpoint with Public Token
Add a read-only public token for widget access.

---

## OBS Integration

### Browser Source Settings
```
URL: http://localhost:3000/widget-current-task/yourchannelname
Width: 500
Height: 100
FPS: 30
Custom CSS: body { margin: 0; background: transparent; overflow: hidden; }
```

### Positioning
- **X**: 710 (centered for 1920px width)
- **Y**: 20 (top margin)
- **Layer**: Above game capture, below alerts

---

## Testing Checklist

- [ ] Widget displays when task exists in "In Progress"
- [ ] Empty state shows when no tasks in progress
- [ ] Rotation works with multiple tasks (8s interval)
- [ ] Category badge colors correct
- [ ] Text truncation works for long titles/descriptions
- [ ] API polling works (30s refresh)
- [ ] Glow animation smooth
- [ ] Transparent background in OBS
- [ ] No console errors
- [ ] Performance acceptable (low CPU usage)

---

## Future Enhancements

1. **Subtask Progress**: Show "3/5 completed" if task has checklist
2. **Time Tracking**: Show elapsed time on current task
3. **Transitions**: Fade/slide animations between task rotations
4. **Priority Highlighting**: Different border colors for high-priority tasks
5. **Event Integration**: Flash/highlight when task is updated
6. **Admin Controls**: Skip to next task via Twitch command
7. **Voice TTS**: Announce new task when it moves to "In Progress"

---

## Related Documentation
- `STREAM_OVERLAY_LAYOUT.md` - Overall overlay layout design
- `WIDGET_SETUP.md` - General widget setup guide
- `src/components/KanbanBoard.jsx` - Existing kanban implementation
