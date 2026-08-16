const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;

if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
} else {
  console.warn('DATABASE_URL not set. Running in demo/no-persistence mode.');
}

async function query(text, params) {
  if (!pool) throw new Error('Database not configured');
  const res = await pool.query(text, params);
  return res;
}

async function getUserByTelegramId(telegram_id) {
  if (!pool) return null;
  const r = await query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
  return r.rows[0] || null;
}

async function getUserByReferralCode(code) {
  if (!pool) return null;
  const r = await query('SELECT * FROM users WHERE referral_code = $1', [code]);
  return r.rows[0] || null;
}

async function createUser({ telegram_id, username, first_name, last_name, referral_code, referred_by }) {
  if (!pool) return null;
  const r = await query(
    `INSERT INTO users (telegram_id, username, first_name, last_name, referral_code, referred_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [telegram_id, username, first_name, last_name, referral_code, referred_by || null]
  );
  return r.rows[0];
}

module.exports = {
  query,
  getUserByTelegramId,
  getUserByReferralCode,
  createUser
};
