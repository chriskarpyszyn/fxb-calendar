const { getViewerGoals } = require('./redis-helper');

module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const channelName = req.query.channelName || 'itsflannelbeard';
    
    const goals = await getViewerGoals(channelName);
    
    return res.status(200).json(goals);
  } catch (error) {
    console.error('Error fetching viewer goals:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch viewer goals',
      details: error.message 
    });
  }
};

