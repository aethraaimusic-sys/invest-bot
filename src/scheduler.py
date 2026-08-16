import os
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
from sqlmodel import select
from src.db import async_session
from src.models import Payout, LedgerEntry, Investment

async def process_due_payouts():
    now = datetime.utcnow()
    async with async_session() as session:
        q = select(Payout).where(Payout.status == "scheduled").where(Payout.payout_date <= now)
        res = await session.exec(q)
        payouts = res.all()
        for p in payouts:
            # Idempotent: re-check status
            p_check = await session.get(Payout, p.id)
            if p_check.status != "scheduled":
                continue
            try:
                # Simulate payment: add ledger entry for user
                inv = await session.get(Investment, p.investment_id)
                ledger = LedgerEntry(user_id=inv.user_id, entry_type="payout", amount=p.payout_amount, related_id=p.id)
                session.add(ledger)
                p_check.status = "processed"
                session.add(p_check)
                await session.commit()
                print(f"Processed payout {p.id} for invest {p.investment_id}")
            except Exception as e:
                print("Failed processing payout", p.id, e)
                p_check.status = "failed"
                session.add(p_check)
                await session.commit()

def start_scheduler():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(lambda: asyncio.create_task(process_due_payouts()), "interval", minutes=1, id="payouts_job")
    scheduler.start()
