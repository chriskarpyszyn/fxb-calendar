# Stream Schedule Update Guide

## How to Update Your Stream Schedule

Your stream schedule is stored in `public/streamSchedule.json`. To update your schedule, simply edit this file and push your changes to GitHub - Vercel will automatically redeploy!

---

## File Structure

```json
{
  "month": 10,           // Month number (1-12)
  "year": 2025,          // Year
  "streams": { ... },    // Your stream schedule
  "categories": { ... }  // Category colors
}
```

---

## Adding/Editing Streams

To add or edit a stream, modify the `streams` section:

```json
"streams": {
  "1": {
    "category": "Software and Game Development",
    "subject": "Exploring SORA 2",
    "time": "8:30am - 9:00am EST"
  },
  "5": {
    "category": "Celeste",
    "subject": "Speedrun attempts",
    "time": "6:00pm - 8:00pm EST"
  }
}
```

**The number (e.g., "1", "5") is the day of the month.**

---

## Available Categories

Your current categories with colors:
- **Software and Game Development** (Purple)
- **Celeste** (Pink)
- **Just Chatting** (Blue)
- **Music** (Green)
- **Art** (Orange)

---

## Adding a New Category

To add a new category with custom colors, add it to the `categories` section:

```json
"categories": {
  "Your New Category": {
    "bg": "bg-yellow-100",      // Background color
    "border": "border-yellow-400", // Border color
    "text": "text-yellow-800",  // Text color
    "dot": "bg-yellow-500"      // Dot indicator color
  }
}
```

**Available Tailwind colors:** red, orange, yellow, green, blue, indigo, purple, pink, gray

---

## Removing a Stream

To remove a stream from a specific day, just delete that day's entry:

```json
// Before - Stream on day 3
"streams": {
  "1": { ... },
  "2": { ... },
  "3": { ... }  // Delete this entire block
}

// After - No stream on day 3
"streams": {
  "1": { ... },
  "2": { ... }
}
```

---

## Changing the Month/Year

To show a different month, update the top of the file:

```json
{
  "month": 11,    // November
  "year": 2025,
  "streams": { ... }
}
```

---

## Deploying Your Changes

1. Edit `public/streamSchedule.json`
2. Save the file
3. Commit and push to GitHub:
   ```bash
   git add public/streamSchedule.json
   git commit -m "Update stream schedule"
   git push
   ```
4. Vercel automatically redeploys (takes ~1-2 minutes)
5. Your calendar is updated! 🎉

---

## Example: Full Weekly Schedule

```json
{
  "month": 10,
  "year": 2025,
  "streams": {
    "1": {
      "category": "Software and Game Development",
      "subject": "Building a React App",
      "time": "8:00am - 10:00am EST"
    },
    "2": {
      "category": "Celeste",
      "subject": "Chapter 7 Attempts",
      "time": "5:00pm - 7:00pm EST"
    },
    "3": {
      "category": "Just Chatting",
      "subject": "Q&A and Chill",
      "time": "8:00pm - 9:00pm EST"
    },
    "8": {
      "category": "Music",
      "subject": "Making Beats",
      "time": "7:00pm - 9:00pm EST"
    },
    "15": {
      "category": "Art",
      "subject": "Digital Painting",
      "time": "2:00pm - 4:00pm EST"
    }
  },
  "categories": {
    "Software and Game Development": {
      "bg": "bg-purple-100",
      "border": "border-purple-400",
      "text": "text-purple-800",
      "dot": "bg-purple-500"
    },
    "Celeste": {
      "bg": "bg-pink-100",
      "border": "border-pink-400",
      "text": "text-pink-800",
      "dot": "bg-pink-500"
    },
    "Just Chatting": {
      "bg": "bg-blue-100",
      "border": "border-blue-400",
      "text": "text-blue-800",
      "dot": "bg-blue-500"
    },
    "Music": {
      "bg": "bg-green-100",
      "border": "border-green-400",
      "text": "text-green-800",
      "dot": "bg-green-500"
    },
    "Art": {
      "bg": "bg-orange-100",
      "border": "border-orange-400",
      "text": "text-orange-800",
      "dot": "bg-orange-500"
    }
  }
}
```

---

## Tips

- **Keep it simple**: The simpler your schedule, the easier it is to maintain
- **Test locally**: Run `npm start` to preview changes before pushing
- **Backup**: Keep a copy of your schedule before making major changes
- **Categories must match**: Make sure the category name in `streams` exactly matches a category in `categories`

---

## Need Help?

If something isn't working:
1. Check that your JSON is valid (use a JSON validator online)
2. Make sure category names match exactly
3. Verify month is 1-12 and day numbers exist in that month
4. Check the browser console for error messages