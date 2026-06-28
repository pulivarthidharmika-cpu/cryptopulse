# Import BaseModel for creating Pydantic models
# Import Field for validation
from pydantic import BaseModel, Field

# Import datetime for storing timestamps
from datetime import datetime


# --------------------------------------------------
# Price Model
# Represents a cryptocurrency price
# --------------------------------------------------
class PriceModel(BaseModel):

    # Cryptocurrency name
    coin: str

    # Price must always be greater than zero
    price: float = Field(
        gt=0,
        description="Current price of the cryptocurrency"
    )

    # Currency (Example: usd)
    currency: str

    # Time when the price was fetched
    timestamp: datetime
    