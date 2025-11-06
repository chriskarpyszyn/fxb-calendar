# Stream Overlay Widget - OBS Setup Guide

## Quick Setup

### Step 1: Add Browser Source
1. In OBS Studio, click the **+** button in Sources
2. Select **Browser**
3. Name it "Schedule Widget" and click **OK**

### Step 2: Configure Settings

**URL**: 
```
/widget/yourchannelname
```
Replace `yourchannelname` with your Twitch channel name (e.g., `/widget/itsflannelbeard`)

**Dimensions**:
- **Width**: `500`
- **Height**: `120`

**Advanced Settings**:
- ✅ **Shutdown source when not visible**: Enabled
- ✅ **Refresh browser when scene becomes active**: Enabled
- **FPS**: `30`

### Step 3: Position
Drag the widget to your desired location (recommended: top-right or bottom-right corner)

## That's It!

The widget will automatically:
- Show your current activity (if live)
- Rotate through upcoming activities every 8 seconds
- Update every minute

## Troubleshooting

**Widget not showing?**
- Check that the channel name in the URL matches your schedule
- Make sure your server is running (for local development)

**Need to resize?**
- Right-click the Browser Source → **Transform** → **Edit Transform**
- Adjust width/height as needed (minimum: 400×100, maximum: 600×150)
