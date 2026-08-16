import os
import asyncio
from fastapi import FastAPI
from src.db import init_db
from src.scheduler import start_scheduler
from src.bot import dp, bot
from aiogram import Dispatcher
import logging

app = FastAPI()

@app.on_event("startup")
async def startup():
    await init_db()
    # start scheduler
    start_scheduler()
    # start bot in background (long polling for prototype)
    loop = asyncio.get_event_loop()
    loop.create_task(start_bot())

async def start_bot():
    # aiogram v3 dispatcher start_polling helper
    from aiogram import Bot
    # start polling (simple, for local/dev only)
    await dp.start_polling(bot)

@app.get("/health")
async def health():
    return {"status": "ok"}
