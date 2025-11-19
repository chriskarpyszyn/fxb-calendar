# FXB Calendar

[![CI Pipeline](https://github.com/ckarpyszyn/fxb-calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/ckarpyszyn/fxb-calendar/actions/workflows/ci.yml)

A retro-themed stream calendar application for tracking and displaying streaming schedules.

## Quick Start

```bash
# Install dependencies
npm install

# Install Vercel CLI for API support
npm install -g vercel

# Run development server with API support
vercel dev
```

**⚠️ Use `vercel dev` not `npm start` for full functionality!**

## Features

- Interactive calendar view
- Twitch integration for live status
- Countdown timers for upcoming streams
- Stream idea submission
- Retro-themed UI design
- Mobile-responsive layout

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Development Setup

**⚠️ IMPORTANT: This project uses Vercel serverless functions for the API**

**✅ DEPLOYMENT**: This project uses 8 serverless functions (under Vercel Hobby plan's 12-function limit). See [DEPLOYMENT_LIMITS.md](./DEPLOYMENT_LIMITS.md) for details.

### Prerequisites

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Set up environment variables in `.env.local`:
```bash
REDIS_URL=your_redis_connection_string
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

### Running the Development Server

**Use `vercel dev` instead of `npm start` for full functionality:**

```bash
vercel dev
```

This will:
- Start the React app on http://localhost:3000
- Enable serverless API functions at `/api/get-ideas` and `/api/submit-idea`
- Load environment variables from `.env.local`
- Provide hot reloading for both frontend and API

**❌ DO NOT use `npm start`** - it only runs the React frontend without API support.

## Available Scripts

In the project directory, you can run:

### `vercel dev` (Recommended)

Runs the full application with API support.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
API functions will also hot-reload when modified.

### `npm start` (Frontend Only)

Runs only the React app without API support.\
**Use this only for frontend-only development.**

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
