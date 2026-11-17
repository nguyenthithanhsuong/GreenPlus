from datetime import date, datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

class SaleDay(StrictModel):
    day: date
    quantity: int = Field(ge=0, le=100000)

class InventoryLine(StrictModel):
    product_id: UUID
    batch_id: UUID | None = None
    name: str = Field(min_length=1, max_length=200)
    available: int = Field(ge=0, le=10000000)
    expires_at: date | None = None
    history: list[SaleDay] = Field(default_factory=list, max_length=365)

class ForecastRequest(StrictModel):
    store_id: UUID
    items: list[InventoryLine] = Field(min_length=1, max_length=250)
    horizon: int = Field(default=14, ge=1, le=30)
    as_of: date | None = None

class ChatSource(StrictModel):
    id: str = Field(max_length=100)
    question: str = Field(min_length=1, max_length=300)
    answer: str = Field(min_length=1, max_length=6000)

class ChatTurn(StrictModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1800)

class ChatRequest(StrictModel):
    store_id: UUID
    role: Literal["admin", "manager", "employee", "shipper", "customer"]
    question: str = Field(min_length=2, max_length=1500)
    knowledge: list[ChatSource] = Field(default_factory=list, max_length=75)
    history: list[ChatTurn] = Field(default_factory=list, max_length=10)

class RecipeRequest(StrictModel):
    store_id: UUID
    ingredients: list[str] = Field(min_length=1, max_length=25)
    servings: int = Field(ge=1, le=12)
    restrictions: list[str] = Field(default_factory=list, max_length=10)

class ComplaintRequest(StrictModel):
    store_id: UUID
    text: str = Field(min_length=5, max_length=3000)

class PromotionInput(StrictModel):
    store_id: UUID
    product_id: UUID
    batch_id: UUID | None = None
    available: int = Field(ge=0)
    expiry_days: int | None = None
    daily_demand: float = Field(ge=0)
    confidence: Literal["low", "medium", "high"]
