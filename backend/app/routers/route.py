from fastapi import APIRouter, HTTPException
from app.models import RouteRequest, RouteResult
from app.services.pathfinder import suggest_route
from app.services.wait_time import get_all_zone_states
from app.config import ZONES

router = APIRouter(prefix="/route", tags=["Route"])


@router.post("/suggest", response_model=RouteResult)
async def route_suggest(body: RouteRequest):
    if body.from_zone not in ZONES:
        raise HTTPException(404, detail=f"from_zone '{body.from_zone}' not found")
    if body.to_zone not in ZONES:
        raise HTTPException(404, detail=f"to_zone '{body.to_zone}' not found")
    if body.from_zone == body.to_zone:
        raise HTTPException(400, detail="from_zone and to_zone must differ")

    zone_states = get_all_zone_states()
    result = suggest_route(body.from_zone, body.to_zone, zone_states)
    return result
