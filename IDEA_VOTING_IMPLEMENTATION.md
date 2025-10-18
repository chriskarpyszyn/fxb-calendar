# Twitch Channel Points Voting System - Implementation Plan

## Overview
Integrate Twitch Channel Points with EventSub webhooks to allow viewers to vote on submitted stream ideas using channel points. Viewers will redeem a single custom reward and enter the idea ID they want to vote for.

## Technical Architecture

### How Voting Works
1. **Single Channel Point Reward**: Create one custom reward called "Vote for Stream Idea" (cost: configurable, e.g., 100 points)
2. **User Input**: Reward requires text input where viewers enter the idea ID (e.g., "5" or "idea-5")
3. **EventSub Webhook**: Twitch sends webhook to your API when reward is redeemed
4. **Vote Processing**: Parse the idea ID from redemption, increment vote count in Redis
5. **Real-time Display**: UI shows updated vote counts (polling every 15 seconds during streams)

### Why This Approach?
- ✅ Simple: One reward to manage
- ✅ Scalable: Works with unlimited ideas
- ✅ Flexible: Easy to show/hide idea IDs in UI
- ✅ Standard: How most Twitch voting systems work

### Webhook Signature Verification
Twitch signs all EventSub webhooks with a secret key. We verify this signature to ensure the webhook actually came from Twitch and wasn't spoofed by a malicious actor. **It's simple to implement** (just comparing HMAC hashes) and **critical for security**.

---

## Data Schema Updates

### Extended Idea Object in Redis
```javascript
{
  id: "1729012345678",           // Existing - timestamp-based ID
  username: "viewer_name",        // Existing
  idea: "Play Hollow Knight",     // Existing
  timestamp: "2025-10-15T...",    // Existing
  status: "pending",              // Existing
  votes: 0,                       // Existing - total vote count
  voters: [                       // NEW - track who voted (prevent duplicates if desired)
    {
      userId: "twitch_user_id_123",
      username: "voter1",
      votedAt: "2025-10-15T14:30:00Z",
      pointsSpent: 100
    }
  ],
  lastVoteAt: "2025-10-15T14:30:00Z"  // NEW - for sorting by recent activity
}
```

### Redis Storage Pattern
- **Key**: `ideas` (existing list)
- **Value**: JSON stringified idea objects (updated schema)
- **Operations**: LRANGE to get all, update object, LSET to save back

---

## Environment Variables

### New Variables Needed
```bash
# Twitch EventSub Configuration
TWITCH_EVENTSUB_SECRET=your_webhook_secret_here  # Generate random string
TWITCH_EVENTSUB_CALLBACK_URL=https://your-domain.vercel.app/api/twitch-eventsub

# Existing (already have these)
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_CHANNEL_NAME=itsFlannelBeard
```

---

## Milestone 1: Twitch Setup & EventSub Registration

### Deliverables
- [ ] Custom channel point reward created in Twitch
- [ ] EventSub subscription registered via Twitch API
- [ ] Environment variables configured
- [ ] Setup documentation for streamers

### Implementation Steps

#### Step 1.1: Create Channel Point Reward
**Manual Setup (via Twitch Dashboard)**:
1. Go to Creator Dashboard → Viewer Rewards → Channel Points
2. Create custom reward:
   - Name: "Vote for Stream Idea"
   - Cost: 100 points (adjustable)
   - Require text input: ✅ YES
   - Prompt: "Enter the idea number you want to vote for (shown on calendar)"
   - Skip reward requests queue: ✅ (auto-fulfill)

**Save the Reward ID** - you'll need this for EventSub subscription

#### Step 1.2: Register EventSub Subscription
Create helper script: `tools/register-eventsub.js`

```javascript
// Register EventSub subscription for channel point redemptions
// Twitch will send webhooks to your API when users redeem the reward

const EVENTSUB_TYPE = 'channel.channel_points_custom_reward_redemption.add';
const TWITCH_BROADCASTER_ID = 'your_broadcaster_id'; // Get from Twitch API
const REWARD_ID = 'your_reward_id'; // From Step 1.1

// This script will:
// 1. Get OAuth token
// 2. Register EventSub subscription
// 3. Verify callback URL works
```

#### Step 1.3: Update Environment Variables
Add to `.env.example` and Vercel dashboard:
```bash
TWITCH_EVENTSUB_SECRET=randomly_generated_secret_key
TWITCH_EVENTSUB_CALLBACK_URL=https://fxb-calendar.vercel.app/api/twitch-eventsub
TWITCH_BROADCASTER_ID=your_broadcaster_id
TWITCH_REWARD_ID=your_custom_reward_id
```

### Files to Create/Update
- **New**: `tools/register-eventsub.js` - EventSub registration helper
- **New**: `TWITCH_VOTING_SETUP.md` - Step-by-step setup guide
- **Update**: `.env.example` - Add new environment variables

### Testing
- Use Twitch CLI to simulate webhook events locally
- Verify EventSub subscription shows as "enabled" in Twitch dashboard

---

## Milestone 2: EventSub Webhook Handler

### Deliverables
- [ ] API endpoint receives EventSub webhooks
- [ ] Webhook signature verification implemented
- [ ] Challenge response for subscription verification
- [ ] Vote counting logic integrated with Redis
- [ ] Error handling and logging

### Implementation Details

#### Step 2.1: Create Webhook Endpoint
**File**: `api/twitch-eventsub.js`

**Key Functions**:
1. **Verify Signature**: Check HMAC-SHA256 signature from Twitch
2. **Handle Challenge**: Respond to EventSub verification challenge
3. **Process Redemption**: Parse idea ID from user input
4. **Update Votes**: Increment vote count in Redis
5. **Log Events**: Track all redemptions for debugging

**Webhook Flow**:
```
Twitch EventSub → POST /api/twitch-eventsub
                → Verify signature
                → Check event type
                → Parse idea ID from user_input
                → Load ideas from Redis
                → Find matching idea
                → Increment votes
                → Track voter (optional: prevent duplicates)
                → Save back to Redis
                → Return 200 OK
```

#### Step 2.2: Signature Verification
```javascript
// Verify webhook came from Twitch
const crypto = require('crypto');

function verifyTwitchSignature(request) {
  const message = request.headers['twitch-eventsub-message-id'] +
                  request.headers['twitch-eventsub-message-timestamp'] +
                  JSON.stringify(request.body);
  
  const hmac = crypto.createHmac('sha256', process.env.TWITCH_EVENTSUB_SECRET);
  const expectedSignature = 'sha256=' + hmac.update(message).digest('hex');
  const actualSignature = request.headers['twitch-eventsub-message-signature'];
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(actualSignature)
  );
}
```

#### Step 2.3: Vote Processing Logic
```javascript
async function processVote(redemption) {
  // Extract data from redemption
  const userId = redemption.user_id;
  const username = redemption.user_name;
  const userInput = redemption.user_input.trim().toLowerCase();
  
  // Parse idea ID (flexible matching)
  // Accepts: "5", "idea-5", "#5", "idea 5"
  const ideaId = parseIdeaId(userInput);
  
  if (!ideaId) {
    console.warn('Invalid idea ID format:', userInput);
    return { success: false, error: 'Invalid idea ID' };
  }
  
  // Load ideas from Redis
  const redis = await getRedisClient();
  const rawIdeas = await redis.lRange('ideas', 0, -1);
  const ideas = rawIdeas.map(raw => JSON.parse(raw));
  
  // Find matching idea
  const ideaIndex = ideas.findIndex(idea => idea.id === ideaId);
  
  if (ideaIndex === -1) {
    console.warn('Idea not found:', ideaId);
    return { success: false, error: 'Idea not found' };
  }
  
  // Update vote count
  const idea = ideas[ideaIndex];
  idea.votes = (idea.votes || 0) + 1;
  
  // Track voter (optional: check for duplicates)
  if (!idea.voters) idea.voters = [];
  
  // Optional: Prevent duplicate votes
  // const alreadyVoted = idea.voters.some(v => v.userId === userId);
  // if (alreadyVoted) return { success: false, error: 'Already voted' };
  
  idea.voters.push({
    userId,
    username,
    votedAt: new Date().toISOString(),
    pointsSpent: redemption.reward.cost
  });
  
  idea.lastVoteAt = new Date().toISOString();
  
  // Save back to Redis
  await redis.lSet('ideas', ideaIndex, JSON.stringify(idea));
  await redis.disconnect();
  
  console.log(`Vote recorded: ${username} voted for idea ${ideaId}`);
  return { success: true, ideaId, votes: idea.votes };
}
```

### Files to Create/Update
- **New**: `api/twitch-eventsub.js` - Main webhook handler
- **New**: `api/utils/twitch-signature.js` - Signature verification utility
- **Update**: `api/submit-idea.js` - Ensure vote tracking fields exist on new ideas

### Testing
- Use Twitch CLI: `twitch event trigger channel.channel_points_custom_reward_redemption.add`
- Test invalid signatures (should reject)
- Test invalid idea IDs (should handle gracefully)
- Test concurrent votes (Redis should handle atomically)

---

## Milestone 3: UI Updates - Vote Display

### Deliverables
- [ ] Idea IDs prominently displayed in IdeasList
- [ ] Vote counts shown with visual prominence
- [ ] Real-time vote updates (polling during streams)
- [ ] Sorting options (most votes, recent votes)
- [ ] Instructions for viewers on how to vote

### Implementation Details

#### Step 3.1: Update IdeasList Component
**File**: `src/components/IdeasList.jsx`

**Changes**:
1. Display idea ID clearly (e.g., "Idea #1729012345678")
2. Show vote count with 👍 emoji and styling
3. Add "How to Vote" instructions when stream is live
4. Implement auto-refresh during live streams (every 15 seconds)
5. Sort by votes (default) or submission time

**Visual Hierarchy**:
```
┌─────────────────────────────────────┐
│ Idea #5 • 🔥 47 votes • 2 hours ago │
├─────────────────────────────────────┤
│ Play Hollow Knight and try to       │
│ finish all the pantheons             │
│                                      │
│ Suggested by @viewer123              │
└─────────────────────────────────────┘
```

#### Step 3.2: Add Voting Instructions Banner
**File**: `src/components/VotingBanner.jsx`

Show when stream is live:
```
┌─────────────────────────────────────────────────┐
│ 🎮 VOTING IS LIVE! 🎮                           │
│                                                  │
│ To vote for an idea:                            │
│ 1. Look for the "Idea #" in the box            │
│ 2. Redeem "Vote for Stream Idea" reward        │
│ 3. Enter the idea number (e.g., "5")           │
│ 4. Each vote costs 100 channel points          │
└─────────────────────────────────────────────────┘
```

#### Step 3.3: Auto-Refresh Logic
```javascript
// In IdeasList.jsx
useEffect(() => {
  // Check if stream is live
  const checkStreamStatus = async () => {
    const response = await fetch('/api/twitch-status');
    const data = await response.json();
    return data.isLive;
  };
  
  // Refresh votes every 15 seconds if live
  const interval = setInterval(async () => {
    const isLive = await checkStreamStatus();
    if (isLive) {
      fetchIdeas(); // Refresh ideas list
    }
  }, 15000);
  
  return () => clearInterval(interval);
}, []);
```

#### Step 3.4: Sort Options
Add sort dropdown:
- Most Votes (default during streams)
- Most Recent Votes
- Newest Ideas
- Oldest Ideas

### Files to Create/Update
- **Update**: `src/components/IdeasList.jsx` - Add vote display and sorting
- **New**: `src/components/VotingBanner.jsx` - Instructions for voters
- **Update**: `src/Calendar.jsx` - Integrate VotingBanner when live
- **Update**: `src/index.css` - Add vote-specific styling

### Testing
- Test with mock data (various vote counts)
- Verify sorting works correctly
- Test auto-refresh during simulated stream
- Ensure idea IDs are easy to copy/read

---

## Milestone 4: Admin Dashboard Enhancements

### Deliverables
- [ ] View vote statistics per idea
- [ ] Sort/filter by vote count
- [ ] Reset votes functionality
- [ ] View voter history per idea
- [ ] Export voting data

### Implementation Details

#### Step 4.1: Enhanced Admin View
**File**: `src/components/AdminDashboard.jsx`

**New Features**:
1. Vote count column in ideas table
2. Voter list expandable view (show who voted)
3. Vote timeline/history
4. "Reset Votes" button with confirmation
5. Stats overview (total votes cast, most voted idea, etc.)

#### Step 4.2: Reset Votes API
**File**: `api/admin-reset-votes.js`

```javascript
// Reset all votes for a new voting period
async function resetAllVotes() {
  const redis = await getRedisClient();
  const rawIdeas = await redis.lRange('ideas', 0, -1);
  const ideas = rawIdeas.map(raw => JSON.parse(raw));
  
  // Reset vote counts but preserve voter history (optional)
  ideas.forEach(idea => {
    idea.votes = 0;
    idea.voters = []; // Or keep for historical records
  });
  
  // Save back to Redis
  await redis.del('ideas');
  await redis.lPush('ideas', ...ideas.map(idea => JSON.stringify(idea)));
  
  return { success: true, resetCount: ideas.length };
}
```

### Files to Create/Update
- **Update**: `src/components/AdminDashboard.jsx` - Enhanced vote management
- **New**: `api/admin-reset-votes.js` - Vote reset endpoint
- **Update**: `api/admin-get-ideas.js` - Include voter details in response

### Testing
- Verify reset votes works correctly
- Test voter history display
- Ensure admin authentication still works

---

## Milestone 5: Polish & Integration

### Deliverables
- [ ] "Voting is LIVE" indicator on calendar
- [ ] Winner announcement feature
- [ ] Voting period management
- [ ] Error messages for viewers (invalid IDs, etc.)
- [ ] Analytics dashboard (optional)

### Implementation Details

#### Step 5.1: Live Voting Indicator
Show banner on main calendar when:
- Stream is live
- Voting is active
- Clear call-to-action

#### Step 5.2: Winner Announcement
After voting period ends:
- Highlight winning idea
- Option to automatically schedule winner
- Share winner to Discord (optional)

#### Step 5.3: Error Handling for Viewers
When someone enters invalid idea ID:
- Log error in webhook handler
- Consider DM'ing viewer on Twitch (requires additional scopes)
- Or: Add "Recent Vote Errors" section in admin panel

### Files to Create/Update
- **Update**: `src/Calendar.jsx` - Add voting indicators
- **New**: `src/components/WinnerAnnouncement.jsx` - Display winner
- **Update**: CSS files - Voting-specific animations

---

## Security Considerations

### Webhook Security
✅ **Signature Verification**: Prevents spoofed webhooks
✅ **HTTPS Only**: Vercel enforces HTTPS automatically
✅ **Secret Management**: Environment variables never exposed to client
✅ **Rate Limiting**: Twitch handles this on their end

### Vote Integrity
- **Optional**: Prevent duplicate votes per user (check `voters` array)
- **Optional**: Max votes per user per voting period
- **Recommended**: Log all vote events for audit trail

### Admin Protection
✅ **Already Implemented**: JWT-based admin authentication
✅ **Already Implemented**: Session expiry

---

## Testing Strategy

### Local Development
1. **Twitch CLI**: Simulate EventSub webhooks
   ```bash
   twitch event trigger channel.channel_points_custom_reward_redemption.add
   ```

2. **ngrok**: Expose local API to receive real webhooks
   ```bash
   ngrok http 3000
   # Update EventSub callback URL to ngrok URL
   ```

### Integration Testing
1. Create test channel point reward
2. Redeem with test account
3. Verify vote increments
4. Check Redis data structure

### Load Testing
- Simulate 10+ concurrent redemptions
- Verify Redis handles atomic operations
- Check for race conditions

### Edge Cases to Test
- Invalid idea IDs (letters, special chars, etc.)
- Non-existent idea IDs
- Very long user input
- Concurrent votes on same idea
- EventSub webhook retries

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set in Vercel
- [ ] EventSub subscription registered and verified
- [ ] Channel point reward created and configured
- [ ] Redis database tested and ready
- [ ] Webhook signature verification tested

### Post-Deployment
- [ ] Test one real channel point redemption
- [ ] Verify vote appears in UI
- [ ] Check Vercel function logs for errors
- [ ] Monitor EventSub health in Twitch dashboard

### Rollback Plan
- Keep old idea schema compatible
- Don't delete old API routes until vote system is stable
- Have backup of Redis data before major updates

---

## Timeline Estimate

- **Milestone 1**: 2-3 hours (Twitch setup & EventSub registration)
- **Milestone 2**: 4-5 hours (Webhook handler & vote processing)
- **Milestone 3**: 3-4 hours (UI updates & real-time display)
- **Milestone 4**: 2-3 hours (Admin enhancements)
- **Milestone 5**: 2-3 hours (Polish & integration)

**Total**: ~13-18 hours of development

---

## Future Enhancements (Post-MVP)

### Phase 2 Ideas
- **Vote Multipliers**: VIP/Subscriber votes count double
- **Leaderboards**: Top voters, most popular ideas
- **Vote Prediction**: Show trending ideas
- **Discord Integration**: Post voting results to Discord
- **Voting Periods**: Schedule start/end times for voting
- **Idea Categories**: Vote within specific categories
- **Mobile Notifications**: Push notifications for vote milestones

---

## Questions & Decisions

### Configuration Decisions
1. **Duplicate Votes**: Allow or prevent?
   - Recommend: **Allow** - let viewers vote with their wallet
   - Easy to change: Just check `voters` array for userId

2. **Vote Visibility**: Show who voted or keep anonymous?
   - Recommend: **Show in admin only** - viewers see totals only
   - Respect privacy while giving streamer insights

3. **Vote Cost**: Fixed or variable?
   - Recommend: **Fixed at 100 points** - simple and fair
   - Can be changed in Twitch dashboard anytime

4. **Idea ID Format**: Simple number or complex ID?
   - Recommend: **Last 4-6 digits of timestamp** (e.g., "012345")
   - Easier to read/type than full timestamp
   - Update idea creation to generate short IDs

### Open Questions
- Should votes persist across months or reset with new schedule?
- What happens to votes when idea is deleted?
- Should there be a "vote leaderboard" for viewers?

---

## Next Steps

**Ready to start implementing?**

I recommend this order:
1. **Start with Milestone 1** - Get EventSub registration working (foundation)
2. **Move to Milestone 2** - Build webhook handler (core functionality)
3. **Quick win with Milestone 3** - Update UI to show votes (visible progress)
4. **Polish with Milestones 4 & 5** - Admin features and final touches

**What you need to begin**:
- Access to Twitch Developer Console
- Decision on duplicate vote policy
- Test Twitch account for redemptions

Let me know when you're ready to tackle Milestone 1!