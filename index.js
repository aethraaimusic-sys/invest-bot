require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bot = require('./bot');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Webhook endpoint - Telegram will POST updates here
app.post('/telegram/webhook', async (req, res) => {
  try {
    const token = req.query.token;
    if (!WEBHOOK_SECRET || token !== WEBHOOK_SECRET) {
      console.warn('Invalid webhook token');
      return res.status(403).send('Forbidden');
    }

    const update = req.body;
    // handle update asynchronously
    await bot.handleUpdate(update);
    // always return 200 quickly
    return res.sendStatus(200);
  } catch (err) {
    console.error('Error handling update', err);
    return res.sendStatus(200);
  }
});

app.get('/', (req, res) => res.send('AIXC Invest-Bot running'));

app.listen(PORT, () => console.log(`AIXC Invest-Bot listening on ${PORT}`));
