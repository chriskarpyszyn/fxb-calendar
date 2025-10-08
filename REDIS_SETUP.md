# Redis Setup Guide

## Issues Fixed

The Redis connection issues have been resolved by:

1. **Fixed import/export syntax**: Changed from ES6 `import/export` to CommonJS `require/module.exports` for Node.js compatibility
2. **Improved environment variable loading**: Added proper error handling for `.env.local` loading
3. **Enhanced error handling**: Added Redis client error listeners and better debugging information
4. **Added validation**: Check for `REDIS_URL` environment variable before attempting connection

## Setup Instructions

### 1. Create Environment File

Create a `.env.local` file in the project root with:

```bash
# Redis connection URL
REDIS_URL=your_redis_connection_string_here

# Discord webhook URL (optional)
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here

# Node environment
NODE_ENV=development
```

### 2. Get Redis Connection String

#### Option A: Local Redis
If running Redis locally:
```bash
REDIS_URL=redis://localhost:6379
```

#### Option B: Redis Cloud
1. Sign up at [Redis Cloud](https://redis.com/redis-enterprise-cloud/overview/)
2. Create a new database
3. Copy the connection string from the database details

#### Option C: Vercel Redis (Recommended for production)
1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to Storage tab
4. Create a new Redis database
5. Copy the connection string

### 3. Test the Connection

Run the local test script:
```bash
node test-redis-local.js
```

This will test:
- Environment variable loading
- Redis connection
- Basic operations (SET, GET)
- List operations (LPUSH, LRANGE)
- Cleanup

### 4. Test the API Endpoints

#### Test Redis Connection
```bash
curl https://your-domain.vercel.app/api/test-kv
```

#### Test Idea Submission
```bash
curl -X POST https://your-domain.vercel.app/api/submit-idea \
  -H "Content-Type: application/json" \
  -d '{"idea": "Test stream idea", "username": "testuser"}'
```

## Troubleshooting

### Common Issues

1. **"REDIS_URL environment variable is not set"**
   - Make sure you created `.env.local` file
   - Check that the file is in the project root
   - Verify the variable name is exactly `REDIS_URL`

2. **"Redis Client Error"**
   - Check your Redis connection string format
   - Ensure Redis server is running (for local Redis)
   - Verify credentials (for cloud Redis)

3. **"Connection refused"**
   - For local Redis: Make sure Redis server is running (`redis-server`)
   - For cloud Redis: Check firewall settings and credentials

### Debug Information

Both API endpoints now return debug information in error responses:
- `redisUrl`: Whether REDIS_URL is set
- `nodeEnv`: Current Node.js environment
- `details`: Specific error message

## Files Modified

- `api/submit-idea.js`: Fixed imports, added error handling, improved debugging
- `api/test-kv.js`: Fixed imports, added error handling, improved debugging
- `test-redis-local.js`: New local testing script

## Next Steps

1. Set up your Redis database
2. Create `.env.local` with your Redis URL
3. Run `node test-redis-local.js` to verify connection
4. Deploy to Vercel and test the API endpoints
5. Test idea submission from your frontend

