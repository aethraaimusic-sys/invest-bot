# Database migration instructions

This repo now includes a simple Postgres users table migration.

To create the table on your Postgres database, run one of the following methods.

Using psql (recommended):

  psql "$DATABASE_URL" -f migrations/001_create_users.sql

Example:
  export DATABASE_URL=postgres://user:pass@host:5432/dbname
  psql "$DATABASE_URL" -f migrations/001_create_users.sql

Using a GUI (pgAdmin, TablePlus):
- Open a SQL editor connected to your DB and run the contents of migrations/001_create_users.sql

Notes:
- The bot falls back to demo/no-persistence mode if DATABASE_URL is not provided. To enable persistence, set DATABASE_URL in your Render environment and run the migration.
- Make sure the Render service can reach the Postgres instance (for Render-managed Postgres, use the provided connection string).
