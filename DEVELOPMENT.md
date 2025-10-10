# Development Guide

## Testing the IdeasList Component

When testing the IdeasList component or any API functionality, you MUST use Vercel's development server:

### ✅ Correct Way
```bash
vercel dev
```

### ❌ Wrong Way
```bash
npm start  # This only runs React frontend, no API support
```

## Why Vercel Dev?

This project uses Vercel serverless functions for the API endpoints:
- `/api/get-ideas` - Fetches submitted stream ideas
- `/api/submit-idea` - Submits new stream ideas

These endpoints are only available when running `vercel dev`, not with `npm start`.

## Environment Variables

Make sure you have a `.env.local` file with:
```bash
REDIS_URL=your_redis_connection_string
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

## Testing Checklist

When testing the IdeasList component:

1. ✅ Run `vercel dev` (not `npm start`)
2. ✅ Verify API endpoints work: http://localhost:3000/api/get-ideas
3. ✅ Test IdeasList component renders
4. ✅ Test collapsible drawer functionality
5. ✅ Test loading/error/empty states
6. ✅ Test "View More" pagination
7. ✅ Test auto-refresh (every 5 minutes)
8. ✅ Test responsive design on mobile

## Common Issues

**Problem**: IdeasList shows "Error Loading Ideas"
**Solution**: Make sure you're using `vercel dev` and have Redis configured

**Problem**: API returns HTML instead of JSON
**Solution**: You're using `npm start` instead of `vercel dev`

**Problem**: Environment variables not loading
**Solution**: Check `.env.local` file exists and restart `vercel dev`
