#!/bin/bash
# Usage example:
# export TELEGRAM_BOT_TOKEN=123:ABC; export APP_URL=https://your-render-url.onrender.com; export WEBHOOK_SECRET=some-secret
# ./set-webhook.sh

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$APP_URL" ] || [ -z "$WEBHOOK_SECRET" ]; then
  echo "Please set TELEGRAM_BOT_TOKEN, APP_URL and WEBHOOK_SECRET environment variables before running this script."
  exit 1
fi

WEBHOOK_URL="$APP_URL/telegram/webhook?token=$WEBHOOK_SECRET"

echo "Setting webhook to: $WEBHOOK_URL"

curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" -d "url=$WEBHOOK_URL" | sed -n '1,200p'

echo "Done. If the response shows {\"ok\":true}, the webhook is set." 
