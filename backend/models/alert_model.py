from pydantic import BaseModel


class AlertModel(BaseModel):
    coin: str
    target_price: float
    condition: str
    status: str = "active"
    message: str
    