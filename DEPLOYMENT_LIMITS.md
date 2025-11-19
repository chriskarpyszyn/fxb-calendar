# Deployment Limits and Considerations

## Vercel Hobby Plan Limitations

### Serverless Function Limit

**⚠️ IMPORTANT**: Vercel's Hobby plan allows a maximum of **12 Serverless Functions** per deployment.

If you exceed this limit, you will see an error:
```
Cannot deploy No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan. 
Create a team (Pro plan) to deploy more.
```

### Current API Endpoints

This project has the following serverless functions in the `/api` directory:

1. `admin.js` - Admin authentication and operations (includes admin-utils functions)
2. `channel-auth.js` - Channel authentication
3. `data.js` - Consolidated GET endpoint (schedule, channels, ideas, viewer-goals)
4. `submit-idea.js` - Submit new idea
5. `submit-survey.js` - Submit survey response
6. `twitch-eventsub.js` - Twitch EventSub webhook handler (voting + viewer events)
7. `twitch-status.js` - Get Twitch stream status
8. `twitch-webhook.js` - Twitch webhook handler

**Total: 8 serverless functions** (under the 12-function limit)

**Note**: `redis-helper.js` is a helper module, not a serverless function, so it doesn't count toward the limit.

## Consolidation Complete

Functions have been consolidated to stay under the 12-function limit:

### Consolidated Structure

1. **`admin.js`** - All admin operations (includes admin-utils functions inline)
2. **`channel-auth.js`** - Channel authentication (includes JWT functions inline)
3. **`data.js`** - Consolidated GET endpoint (`?type=schedule|channels|ideas|viewer-goals`)
4. **`submit-idea.js`** - Submit idea
5. **`submit-survey.js`** - Submit survey
6. **`twitch-eventsub.js`** - All Twitch EventSub events (voting + viewer events)
7. **`twitch-status.js`** - Twitch status
8. **`twitch-webhook.js`** - Twitch webhook handler

**Total: 8 functions** (under the 12-function limit)

### API Endpoint Changes

**Old endpoints (removed):**
- `/api/get-ideas` → Use `/api/data?type=ideas`
- `/api/get-24hour-schedule` → Use `/api/data?type=schedule&channelName=...`
- `/api/get-channels` → Use `/api/data?type=channels`
- `/api/get-viewer-goals` → Use `/api/data?type=viewer-goals&channelName=...`
- `/api/twitch-viewer-events` → Handled by `/api/twitch-eventsub` now

All client code has been updated to use the new consolidated endpoints.

## If You Need More Functions

If you exceed the 12-function limit in the future:

### Option 1: Upgrade to Vercel Pro Plan

The Pro plan ($20/month) removes the 12-function limit and allows unlimited serverless functions.

**Upgrade Steps**:
1. Go to Vercel Dashboard → Settings → Billing
2. Upgrade to Pro plan
3. Redeploy your application

### Option 2: Further Consolidation

You can consolidate more functions:
- Combine `submit-idea.js` and `submit-survey.js` into a single `submit.js` with `?type=idea|survey`
- Combine `twitch-status.js` and `twitch-webhook.js` if they share logic

## Checking Function Count

To see how many functions Vercel detects:

1. Run `vercel build` locally
2. Check the output for function count
3. Or check Vercel dashboard → Functions tab

## Monitoring

After deployment:

1. Check Vercel dashboard → Functions tab
2. Verify all functions are deployed
3. Monitor function logs for errors
4. Test all endpoints

## Additional Resources

- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Serverless Functions Documentation](https://vercel.com/docs/functions)
- [Vercel Function Limits](https://vercel.com/docs/functions/runtimes#limits)

## Current Status

**✅ This project is under the Hobby plan limit with 8 functions.**

All functions have been consolidated and client code has been updated.

