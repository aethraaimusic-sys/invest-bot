const axios = require('axios');
const { nanoid } = require('nanoid');
const db = require('./db');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(x => Number(x));

if (!TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN is not set. The bot will not be able to send messages.');
}

const api = (method) => `https://api.telegram.org/bot${TOKEN}/${method}`;

async function sendMethod(method, payload) {
  if (!TOKEN) return null; // skip sending if no token configured
  return axios.post(api(method), payload).catch(err => {
    console.error('Telegram API error', err?.response?.data || err.message);
  });
}

async function sendMessage(chat_id, text, extra = {}) {
  const payload = Object.assign({ chat_id, text, parse_mode: 'Markdown' }, extra);
  return sendMethod('sendMessage', payload);
}

async function answerCallbackQuery(callback_query_id, text) {
  if (!TOKEN) return null;
  return sendMethod('answerCallbackQuery', { callback_query_id, text });
}

function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '💰 Investment', callback_data: 'invest' },
        { text: '🎓 Courses', callback_data: 'courses' }
      ],
      [
        { text: '💳 Deposit', callback_data: 'deposit' },
        { text: '💸 Withdraw', callback_data: 'withdraw' }
      ],
      [
        { text: '👥 Referrals', callback_data: 'referrals' },
        { text: '📊 Transactions', callback_data: 'transactions' }
      ],
      [
        { text: '👤 Profile', callback_data: 'profile' },
        { text: '🆘 Support', callback_data: 'support' }
      ]
    ]
  };
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';

  if (text.startsWith('/start')) {
    const from = message.from || {};
    const telegram_id = from.id;
    const username = from.username || null;
    const first_name = from.first_name || null;
    const last_name = from.last_name || null;

    // parse referral code if present
    const parts = text.split(' ');
    const refCode = parts[1] ? parts[1].trim() : null;

    // Try to persist user if DB configured
    let user = null;
    try {
      if (db && db.getUserByTelegramId) {
        user = await db.getUserByTelegramId(telegram_id);
        if (!user) {
          // create new user
          const generatedCode = nanoid(8);
          let referred_by = null;
          if (refCode) {
            const refUser = await db.getUserByReferralCode(refCode);
            if (refUser) referred_by = refUser.telegram_id;
          }
          user = await db.createUser({ telegram_id, username, first_name, last_name, referral_code: generatedCode, referred_by });
        }
      }
    } catch (err) {
      console.error('DB error in /start', err.message || err);
    }

    const name = first_name || username || 'there';
    const balance = user && user.balance ? Number(user.balance).toFixed(2) : '0.00';
    const invested = user && user.investment_total ? Number(user.investment_total).toFixed(2) : '0.00';
    const referral_earnings = user && user.referral_earnings ? Number(user.referral_earnings).toFixed(2) : '0.00';

    const welcome = `🏦 AUSTIN INVESTMENT X COURSE\n\nWelcome, ${name} 👋\n\n💰 Balance: $${balance}\n📈 Investment: $${invested}\n🎁 Referral: $${referral_earnings}\n\nChoose an option:`;
    await sendMessage(chatId, welcome, { reply_markup: mainMenuKeyboard() });
    return;
  }

  if (text.trim() === '/admin') {
    const userId = message.from && message.from.id;
    if (ADMIN_IDS.includes(userId)) {
      const adminMenu = '*👨‍💼 AIXC ADMIN PANEL*\n\n(placeholder)';
      await sendMessage(chatId, adminMenu);
    } else {
      await sendMessage(chatId, 'Unauthorized: you are not an admin.');
    }
    return;
  }

  // default fallback
  await sendMessage(chatId, 'I received your message. Use /start to open the main menu.');
}

async function handleCallbackQuery(callback_query) {
  const data = callback_query.data;
  const chatId = callback_query.message.chat.id;
  const queryId = callback_query.id;

  await answerCallbackQuery(queryId, 'Processing...');

  switch (data) {
    case 'invest':
      await sendMessage(chatId, '📈 INVESTMENT PLANS\n\nPlan 1: Minimum $200, Duration: 30 days\nPlan 2: Minimum $500, Duration: 30 days\n\n(To invest: this demo may persist users but investments require full implementation.)');
      break;
    case 'courses':
      await sendMessage(chatId, '🎓 AIXC TRADING COURSES\n\n1. Forex Fundamentals\n2. Technical Analysis\n3. Price Action\n4. Risk Management\n5. Trading Psychology\n6. MT5');
      break;
    case 'deposit':
      await sendMessage(chatId, '💳 Deposit\n\nEnter deposit amount and follow payment instructions.');
      break;
    case 'withdraw':
      await sendMessage(chatId, '💸 Withdraw\n\nEnter withdrawal amount and destination.');
      break;
    case 'referrals':
      if (db && db.getUserByTelegramId) {
        const user = await db.getUserByTelegramId(callback_query.from.id).catch(() => null);
        const code = user ? user.referral_code : '<not set>';
        await sendMessage(chatId, `🎁 YOUR REFERRAL\n\nYour referral link:\nhttps://t.me/<your_bot_username>?start=${code}\n\n(Replace with real link in production)`);
      } else {
        await sendMessage(chatId, '🎁 YOUR REFERRAL\n\nDemo mode: referral link not available.');
      }
      break;
    case 'transactions':
      await sendMessage(chatId, '📊 TRANSACTION HISTORY\n\n(no stored transactions in demo mode)');
      break;
    case 'profile':
      if (db && db.getUserByTelegramId) {
        const user = await db.getUserByTelegramId(callback_query.from.id).catch(() => null);
        if (user) {
          const profile = `👤 MY PROFILE\n\nName: ${user.first_name || ''} ${user.last_name || ''}\nUsername: ${user.username ? '@' + user.username : ''}\nAccount ID: AIXC-${user.id || '000'}\n\n💰 Balance: $${(user.balance||0).toFixed ? (user.balance||0).toFixed(2) : user.balance || '0.00'}`;
          await sendMessage(chatId, profile);
        } else {
          await sendMessage(chatId, '👤 MY PROFILE\n\nDemo mode: profile not found.');
        }
      } else {
        await sendMessage(chatId, '👤 MY PROFILE\n\nDemo mode: profile not available.');
      }
      break;
    case 'support':
      await sendMessage(chatId, '🆘 Support\n\nOptions: FAQ, Contact admin, Open support ticket');
      break;
    default:
      await sendMessage(chatId, 'Unknown action.');
  }
}

async function handleUpdate(update) {
  try {
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    } else {
      // other update types (edited_message, inline_query, etc.)
      console.log('Unhandled update type', Object.keys(update));
    }
  } catch (err) {
    console.error('Error in handleUpdate', err);
  }
}

module.exports = { handleUpdate };
