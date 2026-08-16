Project: Telegram Investment Bot (paper mode prototype)

Quickstart (local):
1. Copy .env.example -> .env and fill TELEGRAM_TOKEN and DATABASE_URL
2. python -m venv .venv && source .venv/bin/activate
3. pip install -r requirements.txt
4. Create Postgres DB and run the app:
   uvicorn src.app:app --reload

Notes:
- This repo runs in PAPER_MODE and simulates payouts.
- Do NOT use for live trading or to accept real user funds until you have legal, custody, and compliance in place.
