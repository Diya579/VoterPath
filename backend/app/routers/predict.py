from fastapi import APIRouter
from app.services.predictor import get_active_predictions

router = APIRouter(prefix="/predict", tags=["Predictions"])


@router.get("/alerts")
async def prediction_alerts():
    return get_active_predictions()
