// migrate-schedule.js
// Run this once to migrate existing itsFlannelBeard data to the new structure

const { createClient } = require('redis');

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    console.warn('Could not load .env.local:', error.message);
  }
}

async function migrateSchedule() {
  if (!process.env.REDIS_URL) {
    console.error('REDIS_URL environment variable is not set');
    process.exit(1);
  }

  const redis = createClient({
    url: process.env.REDIS_URL
  });

  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await redis.connect();

  try {
    const channelName = 'itsflannelbeard';
    
    console.log('Starting migration for', channelName);
    
    // Check if migration already done
    const migrated = await redis.get(`24hour:schedule:${channelName}:date`);
    if (migrated) {
      console.log('Migration already completed! Data exists at new location.');
      return;
    }
    
    // Migrate metadata
    const date = await redis.get('24hour:schedule:date') || '';
    const startDate = await redis.get('24hour:schedule:startDate') || '';
    const endDate = await redis.get('24hour:schedule:endDate') || '';
    const startTime = await redis.get('24hour:schedule:startTime') || '';
    const endTime = await redis.get('24hour:schedule:endTime') || '';
    const categoriesJson = await redis.get('24hour:schedule:categories') || '{}';
    
    if (date || startDate) {
      await redis.set(`24hour:schedule:${channelName}:date`, date);
      await redis.set(`24hour:schedule:${channelName}:startDate`, startDate);
      await redis.set(`24hour:schedule:${channelName}:endDate`, endDate);
      await redis.set(`24hour:schedule:${channelName}:startTime`, startTime);
      await redis.set(`24hour:schedule:${channelName}:endTime`, endTime);
      await redis.set(`24hour:schedule:${channelName}:categories`, categoriesJson);
      console.log('✓ Migrated metadata');
    }
    
    // Migrate slots
    const oldSlotIndices = await redis.lRange('24hour:schedule:slots', 0, -1);
    if (oldSlotIndices.length > 0) {
      const newSlotIndices = [];
      
      for (let i = 0; i < oldSlotIndices.length; i++) {
        const oldIndex = oldSlotIndices[i];
        const newIndex = i.toString();
        
        // Copy slot data
        const hour = await redis.get(`24hour:schedule:slot:${oldIndex}:hour`) || '';
        const time = await redis.get(`24hour:schedule:slot:${oldIndex}:time`) || '';
        const category = await redis.get(`24hour:schedule:slot:${oldIndex}:category`) || '';
        const activity = await redis.get(`24hour:schedule:slot:${oldIndex}:activity`) || '';
        const description = await redis.get(`24hour:schedule:slot:${oldIndex}:description`) || '';
        
        if (hour !== '') {
          await redis.set(`24hour:schedule:${channelName}:slot:${newIndex}:hour`, hour);
          await redis.set(`24hour:schedule:${channelName}:slot:${newIndex}:time`, time);
          await redis.set(`24hour:schedule:${channelName}:slot:${newIndex}:category`, category);
          await redis.set(`24hour:schedule:${channelName}:slot:${newIndex}:activity`, activity);
          await redis.set(`24hour:schedule:${channelName}:slot:${newIndex}:description`, description || '');
          newSlotIndices.push(newIndex);
        }
      }
      
      // Create new slots list
      if (newSlotIndices.length > 0) {
        await redis.rPush(`24hour:schedule:${channelName}:slots`, ...newSlotIndices);
        console.log(`✓ Migrated ${newSlotIndices.length} slots`);
      }
    }
    
    // Add to channels set
    await redis.sAdd('24hour:channels', channelName);
    console.log('✓ Added to channels list');
    
    console.log('\n✅ Migration complete!');
    console.log(`Your schedule is now available at /schedule/${channelName}`);
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await redis.disconnect();
  }
}

migrateSchedule();

