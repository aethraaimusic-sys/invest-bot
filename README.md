# AIXC Invest-Bot (minimal webhook scaffold)

This repository contains a minimal Node.js/Express Telegram bot scaffold intended for quick deployment on Render's free service. It is a demo/no-DB version so it does not persist user data.

Features
- Webhook-based Telegram bot (no database)
- /start command with main menu (inline keyboard)
- Callback handlers for main menu items (demo text)
- Admin stub protected by ADMIN_IDS env var

Files
- index.js - Express server and webhook endpoint
- bot.js - basic bot logic for /start and callbacks
- set-webhook.sh - helper script to call Telegram setWebhook
- .env.example - example environment variables

Deploy to Render (quick)
1. Create a new Web Service on Render and connect this GitHub repository.
2. Set the Build Command: `npm install`
3. Set the Start Command: `npm start`
4. Add environment variables in Render (Settings -> Environment):
   - TELEGRAM_BOT_TOKEN
   - WEBHOOK_SECRET (random string)
   - ADMIN_IDS (optional)
   - APP_URL (the public URL Render assigns; you can also set this after deploy)
5. Deploy. Once deploy is ready, run the set-webhook script locally (or use the curl command inside it):

   export TELEGRAM_BOT_TOKEN=<your token>
   export APP_URL=https://<your-render-url>
   export WEBHOOK_SECRET=<your webhook secret>
   ./set-webhook.sh

6. Test by sending /start to your bot in Telegram.

Notes
- This scaffold is intentionally simple and stores no persistent data. When you restart or redeploy the service, no user state is retained.
- For production you should add a database (Postgres), input validation, admin UI, rate limiting, and proper logging.

