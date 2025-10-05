# Local Discord Integration Setup Guide

This guide will help you set up and test the Discord integration locally on your development machine.

## Prerequisites

- Node.js installed on your machine
- A Discord server where you can create webhooks
- The project dependencies installed (`npm install`)

## Step 1: Get Your Discord Webhook URL

1. **Open Discord** and navigate to your server
2. **Go to Server Settings**:
   - Click on your server name in the top-left
   - Select "Server Settings" from the dropdown
3. **Navigate to Integrations**:
   - In the left sidebar, click "Integrations"
   - Click "Webhooks" in the submenu
4. **Create a New Webhook**:
   - Click "New Webhook" or "Create Webhook"
   - Give it a name like "Stream Ideas Bot"
   - Choose a channel where you want the ideas to be posted
   - Click "Copy Webhook URL"
   - **Save the webhook URL** - you'll need it in the next step

## Step 2: Configure Local Environment

1. **Copy the environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit the .env.local file**:
   - Open `.env.local` in your text editor
   - Replace `your_discord_webhook_url_here` with your actual Discord webhook URL
   - The file should look like:
     ```
     DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890
     ```

## Step 3: Test the Integration

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Open your browser** and go to `http://localhost:3000`

3. **Test the Discord integration**:
   - Click the "💡 Suggest a Stream Idea" button
   - Fill in the form with a test idea
   - Submit the form
   - Check your Discord channel to see if the message appears

## Step 4: Verify Everything Works

### What Should Happen:
- ✅ The form submits successfully
- ✅ You see a success message in the browser
- ✅ A new message appears in your Discord channel with:
  - A purple embed titled "💡 New Stream Idea!"
  - Your idea text
  - Your username
  - A timestamp

### Troubleshooting:

**If the form shows an error:**
1. Check that your `.env.local` file has the correct webhook URL
2. Make sure there are no extra spaces or quotes around the URL
3. Verify the webhook URL is still valid in Discord

**If Discord doesn't receive the message:**
1. Check the browser's developer console (F12) for any error messages
2. Verify the webhook URL is correct and active
3. Make sure the Discord channel allows webhook messages

**If you get a "Server configuration error":**
1. Ensure the `.env.local` file exists in the project root
2. Check that the `DISCORD_WEBHOOK_URL` variable is set correctly
3. Restart the development server after making changes

## Step 5: Development Workflow

### Making Changes:
1. Edit your code as needed
2. The development server will automatically reload
3. Test your changes using the form

### Environment Variables:
- **Local Development**: Uses `.env.local` file
- **Production (Vercel)**: Uses environment variables set in Vercel dashboard
- **Never commit**: `.env.local` is already in `.gitignore`

## Security Notes

- ✅ The `.env.local` file is already in `.gitignore` - it won't be committed to Git
- ✅ Your Discord webhook URL stays private on your local machine
- ✅ The production version uses Vercel's secure environment variables

## Next Steps

Once you've verified everything works locally:
1. Your changes will automatically deploy to Vercel when you push to GitHub
2. Make sure to set the `DISCORD_WEBHOOK_URL` environment variable in your Vercel dashboard
3. Test the production version to ensure it works in the deployed environment

## Need Help?

If you run into issues:
1. Check the browser console for error messages
2. Verify your Discord webhook URL is correct
3. Make sure all dependencies are installed (`npm install`)
4. Try restarting the development server

Happy coding! 🚀
