// Kanban Board API endpoint
// Handles GET (public read), POST (create), PUT (update), DELETE (delete) for kanban items

const { createClient } = require('redis');
const { verifySessionToken } = require('./admin-utils');

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

// Helper function to get Redis client
async function getRedisClient() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  const redis = createClient({
    url: process.env.REDIS_URL
  });

  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await redis.connect();
  return redis;
}

const REDIS_KEY = 'kanban:typing-stars:items';
const VALID_COLUMNS = ['Ideas', 'Bugs', 'Features', 'In Progress', 'Done'];

// Helper to verify admin token
function verifyAdminToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  return verifySessionToken(token);
}

// GET - Public read access
async function handleGet(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  let redis;
  
  try {
    redis = await getRedisClient();
    const itemsJson = await redis.get(REDIS_KEY);
    
    if (!itemsJson) {
      return res.status(200).json({
        success: true,
        items: []
      });
    }
    
    const items = JSON.parse(itemsJson);
    return res.status(200).json({
      success: true,
      items: items
    });
  } catch (error) {
    console.error('Error fetching kanban items:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  } finally {
    if (redis) {
      try {
        await redis.disconnect();
      } catch (err) {
        console.error('Error disconnecting from Redis:', err);
      }
    }
  }
}

// POST - Create new item (requires auth)
async function handlePost(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // Verify admin session token
  if (!verifyAdminToken(req)) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Invalid or expired session' 
    });
  }

  const { title, description, column } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ 
      success: false,
      error: 'Title is required' 
    });
  }

  if (!column || !VALID_COLUMNS.includes(column)) {
    return res.status(400).json({ 
      success: false,
      error: `Column must be one of: ${VALID_COLUMNS.join(', ')}`
    });
  }

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Get existing items
    const itemsJson = await redis.get(REDIS_KEY);
    const items = itemsJson ? JSON.parse(itemsJson) : [];
    
    // Find max order in the target column
    const columnItems = items.filter(item => item.column === column);
    const maxOrder = columnItems.length > 0 
      ? Math.max(...columnItems.map(item => item.order || 0))
      : -1;
    
    // Create new item
    const newItem = {
      id: `kanban-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description ? description.trim() : '',
      column: column,
      createdAt: new Date().toISOString(),
      finishedAt: column === 'Done' ? new Date().toISOString() : null,
      order: maxOrder + 1
    };
    
    items.push(newItem);
    
    // Save back to Redis
    await redis.set(REDIS_KEY, JSON.stringify(items));
    
    return res.status(200).json({
      success: true,
      item: newItem
    });
  } catch (error) {
    console.error('Error creating kanban item:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  } finally {
    if (redis) {
      try {
        await redis.disconnect();
      } catch (err) {
        console.error('Error disconnecting from Redis:', err);
      }
    }
  }
}

// PUT - Update item (requires auth)
async function handlePut(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // Verify admin session token
  if (!verifyAdminToken(req)) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Invalid or expired session' 
    });
  }

  const { id, title, description, column, order } = req.body;

  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Item ID is required' 
    });
  }

  if (column && !VALID_COLUMNS.includes(column)) {
    return res.status(400).json({ 
      success: false,
      error: `Column must be one of: ${VALID_COLUMNS.join(', ')}`
    });
  }

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Get existing items
    const itemsJson = await redis.get(REDIS_KEY);
    if (!itemsJson) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found' 
      });
    }
    
    const items = JSON.parse(itemsJson);
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found' 
      });
    }
    
    const item = items[itemIndex];
    const oldColumn = item.column;
    
    // Update item
    if (title !== undefined) item.title = title.trim();
    if (description !== undefined) item.description = description ? description.trim() : '';
    if (column !== undefined) {
      item.column = column;
      // Update finishedAt based on column
      if (column === 'Done' && !item.finishedAt) {
        item.finishedAt = new Date().toISOString();
      } else if (column !== 'Done' && item.finishedAt) {
        item.finishedAt = null;
      }
    }
    if (order !== undefined) item.order = order;
    
    // If column changed, reorder items in both old and new columns
    if (column && column !== oldColumn) {
      // Remove from old column ordering
      const oldColumnItems = items.filter(i => i.column === oldColumn && i.id !== id);
      oldColumnItems.forEach((oldItem, idx) => {
        oldItem.order = idx;
      });
      
      // Add to new column with proper ordering
      const newColumnItems = items.filter(i => i.column === column && i.id !== id);
      if (order !== undefined) {
        item.order = order;
      } else {
        const maxOrder = newColumnItems.length > 0 
          ? Math.max(...newColumnItems.map(i => i.order || 0))
          : -1;
        item.order = maxOrder + 1;
      }
    } else if (order !== undefined) {
      // Just reordering within same column
      const columnItems = items.filter(i => i.column === item.column && i.id !== id);
      columnItems.forEach((colItem, idx) => {
        if (idx >= order) {
          colItem.order = idx + 1;
        } else {
          colItem.order = idx;
        }
      });
    }
    
    // Save back to Redis
    await redis.set(REDIS_KEY, JSON.stringify(items));
    
    return res.status(200).json({
      success: true,
      item: item
    });
  } catch (error) {
    console.error('Error updating kanban item:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  } finally {
    if (redis) {
      try {
        await redis.disconnect();
      } catch (err) {
        console.error('Error disconnecting from Redis:', err);
      }
    }
  }
}

// DELETE - Delete item (requires auth)
async function handleDelete(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // Verify admin session token
  if (!verifyAdminToken(req)) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Invalid or expired session' 
    });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Item ID is required' 
    });
  }

  let redis;
  
  try {
    redis = await getRedisClient();
    
    // Get existing items
    const itemsJson = await redis.get(REDIS_KEY);
    if (!itemsJson) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found' 
      });
    }
    
    const items = JSON.parse(itemsJson);
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found' 
      });
    }
    
    // Remove item
    items.splice(itemIndex, 1);
    
    // Save back to Redis
    await redis.set(REDIS_KEY, JSON.stringify(items));
    
    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting kanban item:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  } finally {
    if (redis) {
      try {
        await redis.disconnect();
      } catch (err) {
        console.error('Error disconnecting from Redis:', err);
      }
    }
  }
}

// Main handler
module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return await handleGet(req, res);
    } else if (req.method === 'POST') {
      return await handlePost(req, res);
    } else if (req.method === 'PUT') {
      return await handlePut(req, res);
    } else if (req.method === 'DELETE') {
      return await handleDelete(req, res);
    } else {
      return res.status(405).json({ 
        success: false,
        error: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('Error in kanban API:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

