import os
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from sqlmodel import select
from src.db import async_session
from src.models import User, InvestmentPlan, Investment, Payout, LedgerEntry
from datetime import datetime, timedelta

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
bot = Bot(token=TELEGRAM_TOKEN)
dp = Dispatcher()

# helper: get or create user
async def get_or_create_user(telegram_from: types.User):
    async with async_session() as session:
        q = select(User).where(User.telegram_id == telegram_from.id)
        res = await session.exec(q)
        user = res.scalar_one_or_none()
        if user:
            return user
        user = User(telegram_id=telegram_from.id, username=telegram_from.username)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

@dp.message(Command(commands=["start"]))
async def start_handler(message: types.Message):
    user = await get_or_create_user(message.from_user)
    text = (
        "Welcome. This is a PAPER-mode prototype. No real money will be moved.\n\n"
        "Available commands:\n"
        "/plans - view plans\n"
        "/invest <plan_id> <amount> - create an investment in paper mode\n"
        "/investments - list your investments\n"
        "/payouts - list upcoming payouts\n"
        "/help - show this message\n"
    )
    await message.answer(text)

@dp.message(Command(commands=["help"]))
async def help_handler(message: types.Message):
    await start_handler(message)

@dp.message(Command(commands=["plans"]))
async def plans_handler(message: types.Message):
    async with async_session() as session:
        q = select(InvestmentPlan)
        res = await session.exec(q)
        plans = res.all()
        if not plans:
            await message.answer("No plans configured yet (admin must add them).")
            return
        lines = []
        for p in plans:
            lines.append(f"{p.id}: {p.name} — {p.term_months} months, {p.monthly_rate*100:.1f}%/month, compound={p.compound}")
        await message.answer("\n".join(lines))

@dp.message()
async def invest_parser(message: types.Message):
    if not message.text:
        return
    parts = message.text.strip().split()
    if parts[0].lower() != "/invest":
        return
    if len(parts) < 3:
        await message.answer("Usage: /invest <plan_id> <amount>")
        return
    plan_id = int(parts[1])
    amount = float(parts[2])
    user = await get_or_create_user(message.from_user)
    async with async_session() as session:
        plan = await session.get(InvestmentPlan, plan_id)
        if not plan:
            await message.answer("Plan not found.")
            return
        if amount < plan.min_deposit:
            await message.answer(f"Amount must be at least {plan.min_deposit}")
            return
        # create investment and scheduled payouts (simple monthly non-compound for now)
        start = datetime.utcnow()
        end = start + timedelta(days=30*plan.term_months)
        inv = Investment(user_id=user.id, plan_id=plan.id, principal=amount, start_date=start, end_date=end)
        session.add(inv)
        await session.commit()
        await session.refresh(inv)
        # create payouts
        for m in range(1, plan.term_months + 1):
            payout_amt = amount * plan.monthly_rate
            payout_date = start + timedelta(days=30*m)
            p = Payout(investment_id=inv.id, month_number=m, payout_amount=payout_amt, payout_date=payout_date)
            session.add(p)
        # ledger: record deposit as reserved (paper)
        ledger = LedgerEntry(user_id=user.id, entry_type="deposit", amount=amount, related_id=inv.id)
        session.add(ledger)
        await session.commit()
        await message.answer(f"Investment created (paper mode). Investment ID: {inv.id}. Scheduled {plan.term_months} monthly payouts.")
