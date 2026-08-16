const axios = require('axios');

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
  return axios.post(api(method), payload).catch(err => {
    console.error('Telegram API error', err?.response?.data || err.message);
  });
}

async function sendMessage(chat_id, text, extra = {}) {
  const payload = Object.assign({ chat_id, text, parse_mode: 'Markdown' }, extra);
  return sendMethod('sendMessage', payload);
}

async function answerCallbackQuery(callback_query_id, text) {
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
    const name = (message.from && (message.from.first_name || message.from.username)) || 'there';
    const welcome = `🏦 AUSTIN INVESTMENT X COURSE\n\nWelcome, ${name} 👋\n\n💰 Balance: $0.00\n📈 Investment: $0.00\n🎁 Referral: $0.00\n\nChoose an option:`;
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
      await sendMessage(chatId, '📈 INVESTMENT PLANS\n\nPlan 1: Minimum $200, Duration: 30 days\nPlan 2: Minimum $500, Duration: 30 days\n\n(To invest: this demo has no persistence. In full version you would pick a plan and enter amount.)');
      break;
    case 'courses':
      await sendMessage(chatId, '🎓 AIXC TRADING COURSES\n\n1. Forex Fundamentals\n2. Technical Analysis\n3. Price Action\n4. Risk Management\n5. Trading Psychology\n6. MT5\n\n(To view lessons select a course in the full version.)');
      break;
    case 'deposit':
      await sendMessage(chatId, '💳 Deposit\n\nEnter deposit amount and follow payment instructions. (Demo mode: no persistence)');
      break;
    case 'withdraw':
      await sendMessage(chatId, '💸 Withdraw\n\nEnter withdrawal amount and destination. (Demo mode: no persistence)');
      break;
    case 'referrals':
      await sendMessage(chatId, '🎁 YOUR REFERRAL\n\nYour referral link: `https://t.me/<your_bot_username>?start=REFCODE`\n\n(Replace with real link in production)');
      break;
    case 'transactions':
      await sendMessage(chatId, '📊 TRANSACTION HISTORY\n\n(no stored transactions in demo mode)');
      break;
    case 'profile':
      await sendMessage(chatId, '👤 MY PROFILE\n\nName: (demo)\nUsername: (demo)\nAccount ID: (demo)\n\n(no persistent profile in demo mode)');
      break;
    case 'support':
      await sendMessage(chatId, '🆘 Support\n\nOptions: FAQ, Contact admin, Open support ticket (demo mode)');
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
