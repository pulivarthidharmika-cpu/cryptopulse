# Import BaseModel for creating models
# Import Field for validation
from pydantic import BaseModel, Field

# Import Literal to restrict allowed values
from typing import Literal


# --------------------------------------------------
# Alert Model
# Stores user price alerts
# --------------------------------------------------
class AlertModel(BaseModel):

    # Cryptocurrency name
    coin: str

    # Target price must be greater than zero
    target_price: float = Field(
        gt=0,
        description="Target price for alert"
    )

    # Allowed conditions
    condition: Literal["above", "below"]

    # Current alert status
    status: Literal[
        "active",
        "triggered",
        "disabled"
    ] = "active"

    # Alert message shown to the user
    message: str