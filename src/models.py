from datetime import datetime, timedelta, date
from typing import Optional
from sqlmodel import SQLModel, Field, Column, Float, String, DateTime, Integer, Boolean

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    telegram_id: int = Field(index=True)
    username: Optional[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InvestmentPlan(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    term_months: int
    monthly_rate: float  # e.g., 0.6 for 60%
    compound: bool = False
    min_deposit: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Investment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    plan_id: int
    principal: float
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: datetime
    status: str = "active"  # active/completed/cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Payout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    investment_id: int = Field(index=True)
    month_number: int
    payout_amount: float
    payout_date: datetime
    status: str = "scheduled"  # scheduled/processed/failed
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LedgerEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    entry_type: str  # deposit, payout, fee, reserve
    amount: float
    balance_after: Optional[float]
    related_id: Optional[int]  # investment or payout id
    created_at: datetime = Field(default_factory=datetime.utcnow)
