from sqlalchemy import Column, Integer, String, JSON, DateTime
from datetime import datetime
from .database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    title = Column(String, index=True)
    cuisine = Column(String)
    difficulty = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Store the entire LLM generated structured JSON here
    full_data = Column(JSON)
