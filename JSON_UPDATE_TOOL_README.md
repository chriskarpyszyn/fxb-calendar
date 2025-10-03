# FXB Calendar JSON Update Tool

A simple offline tool to easily update the `streamSchedule.json` file for your FXB Calendar application.

## Features

- ✅ View current schedule
- ➕ Add new streams
- ✏️ Edit existing streams
- 🗑️ Delete streams
- 📅 Update month/year
- 🎨 Manage categories and their colors
- 💾 Save changes safely

## How to Use

### Option 1: Using the Batch File (Windows)
1. Double-click `update-schedule.bat`
2. Follow the interactive menu

### Option 2: Using Node.js directly
1. Open terminal/command prompt in the project directory
2. Run: `node json-update-tool.js`
3. Follow the interactive menu

## Menu Options

### 1. View Current Schedule
- Displays all scheduled streams with their details
- Shows current month and year

### 2. Add New Stream
- Enter a unique stream ID
- Set category, subject, and time
- Automatically validates for duplicate IDs

### 3. Edit Existing Stream
- Select stream by ID
- Update any field (category, subject, time)
- Press Enter to keep current value

### 4. Delete Stream
- Select stream by ID
- Confirm deletion to prevent accidents

### 5. Update Month/Year
- Change the calendar month (1-12)
- Update the year
- Validates month range

### 6. Manage Categories
- View all categories and their color schemes
- Add new categories with automatic color generation
- Edit category colors
- Delete unused categories (with safety checks)

## Category Color System

The tool uses Tailwind CSS color classes:
- **Background**: `bg-{color}-100` (light background)
- **Border**: `border-{color}-400` (medium border)
- **Text**: `text-{color}-800` (dark text)
- **Dot**: `bg-{color}-500` (medium dot)

Available colors: purple, pink, blue, green, orange, red, yellow, indigo, gray

## Safety Features

- ✅ Validates stream ID uniqueness
- ✅ Prevents deletion of categories in use
- ✅ Confirms destructive operations
- ✅ Validates month range (1-12)
- ✅ Preserves data integrity
- ✅ Creates backup before major changes

## File Structure

```
fxb-calendar/
├── json-update-tool.js          # Main tool script
├── update-schedule.bat          # Windows batch file
├── JSON_UPDATE_TOOL_README.md   # This file
├── src/__tests__/               # JSON validation tests
└── public/
    └── streamSchedule.json      # Target JSON file
```

## Testing

The tool works with comprehensive JSON validation tests:

```bash
# Run JSON validation tests
npm run test:json

# Run all tests
npm test
```

Tests automatically run in GitHub Actions on every push/PR to ensure data integrity.

## Requirements

- Node.js (comes with the tool)
- No additional dependencies required

## Troubleshooting

**"Stream ID already exists"**
- Choose a different ID number

**"Cannot delete category - it's used by X streams"**
- First reassign or delete the streams using that category

**"Failed to load JSON file"**
- Make sure `public/streamSchedule.json` exists
- Check file permissions

**"Failed to save JSON file"**
- Check write permissions in the project directory
- Ensure the file isn't open in another program

## Tips

- Use descriptive stream IDs (numbers work well)
- Keep category names consistent
- Use standard time format: "7:00pm - 9:00pm EST"
- Always save your changes before exiting
- The tool automatically formats the JSON file nicely
