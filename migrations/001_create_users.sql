-- 001_create_users.sql

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by BIGINT,
  balance NUMERIC(18,2) DEFAULT 0 NOT NULL,
  referral_earnings NUMERIC(18,2) DEFAULT 0 NOT NULL,
  investment_total NUMERIC(18,2) DEFAULT 0 NOT NULL,
  suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- optional: index for referral_code
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
