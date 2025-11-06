# Stream Overlay Widget Setup Guide

This guide will help you set up the "Now and Upcoming" schedule widget as an overlay in OBS Studio.

## Widget URL

The widget is accessible at:
```
/widget/:channelName
```

Replace `:channelName` with your Twitch channel name (case-insensitive).

**Example:**
- `http://localhost:3000/widget/itsflannelbeard` (for local development)
- `https://yourdomain.com/widget/itsflannelbeard` (for production)

## OBS Studio Setup

### Step 1: Add Browser Source

1. Open OBS Studio
2. In your scene, click the **+** button in the Sources panel
3. Select **Browser** from the list
4. Give it a name (e.g., "Schedule Widget")
5. Click **OK**

### Step 2: Configure Browser Source

In the Browser Source properties window, configure the following:

#### Basic Settings

- **URL**: Enter your widget URL
  - Example: `http://localhost:3000/widget/itsflannelbeard`
  - Or production: `https://yourdomain.com/widget/itsflannelbeard`

- **Width**: `500`
- **Height**: `120`

#### Advanced Settings

- **FPS**: `30` (or `60` if you want smoother animations)
- **Shutdown source when not visible**: ✅ Enabled (recommended)
- **Refresh browser when scene becomes active**: ✅ Enabled (recommended)
- **Custom CSS**: Leave empty (not needed)

#### Interactivity

- **Control audio via OBS**: Leave unchecked
- **Interact**: Only check if you need to interact with the widget (usually not needed)

### Step 3: Position and Size

1. Click **OK** to close the properties window
2. The widget will appear in your scene preview
3. Drag and resize as needed:
   - Recommended position: Top-right or bottom-right corner
   - The widget is transparent, so it will blend with your stream background

### Step 4: Fine-tuning

You can adjust the widget size in OBS:
- **Recommended dimensions**: 500px × 120px
- **Minimum**: 400px × 100px (may cut off text on smaller cards)
- **Maximum**: 600px × 150px (for larger displays)

To resize:
1. Right-click the Browser Source in your scene
2. Select **Transform** → **Edit Transform**
3. Adjust width and height values
4. Or drag the corners in the preview

## Widget Behavior

### Card Rotation

- The widget automatically rotates between cards every **8 seconds**
- Shows the current activity first (if one exists)
- Then rotates through upcoming activities (1-2 items)
- If there's no current activity, only upcoming activities are shown

### Auto-Update

- The widget updates every **60 seconds** to check for schedule changes
- Also checks on minute boundaries for activity transitions
- No manual refresh needed

### Display Format

Each card shows:
- **NOW** or **UPCOMING** indicator
- Time range (in your local timezone)
- Category
- Activity/Subject title

## Troubleshooting

### Widget Not Loading

1. **Check the URL**: Make sure the channel name is correct and matches your schedule
2. **Verify the server is running**: For local development, ensure `npm start` is running
3. **Check browser console**: In OBS, right-click the Browser Source → **Interact** to open the browser and check for errors

### Widget Not Updating

1. **Check "Refresh browser when scene becomes active"**: This ensures the widget refreshes when you switch to the scene
2. **Manually refresh**: Right-click Browser Source → **Refresh** to force an update

### Widget Too Large/Small

1. Adjust the **Width** and **Height** in Browser Source properties
2. The widget is responsive, so it will scale to fit the dimensions you set

### Transparent Background Not Working

1. Make sure you're using the latest version of OBS Studio
2. The widget uses CSS `background: transparent` which should work in OBS Browser Source
3. If you see a white/colored background, check that OBS is using the latest version

## Production Deployment

For production use, make sure:

1. Your server is publicly accessible
2. The URL uses `https://` (recommended for security)
3. The widget is accessible from the internet (not just localhost)
4. CORS is properly configured if needed

## Tips

- **Position**: Place the widget in a corner where it won't obstruct important game content
- **Size**: Start with 500×120 and adjust based on your stream layout
- **Testing**: Test the widget in a test scene before using it in your main stream
- **Backup**: Keep a backup of your OBS scene file in case you need to restore settings

## Example OBS Configuration

```
Browser Source Properties:
├── URL: https://yourdomain.com/widget/itsflannelbeard
├── Width: 500
├── Height: 120
├── FPS: 30
├── Shutdown source when not visible: ✅
└── Refresh browser when scene becomes active: ✅
```

## Support

If you encounter issues:
1. Check the browser console (right-click Browser Source → **Interact**)
2. Verify your schedule data is properly configured
3. Ensure the channel name in the URL matches your schedule
4. Check that the API endpoint `/api/get-24hour-schedule` is working

