from pydantic import BaseModel
from typing import Literal, Optional


class QueueEventIn(BaseModel):
    zone_id: str
    uid: str


class RouteRequest(BaseModel):
    from_zone: str
    to_zone: str
    uid: str


class ZoneStatus(BaseModel):
    zone_id: str
    name: str
    type: str
    active_users: int
    avg_wait_seconds: float
    color: Literal["green", "yellow", "red", "unknown"]


class RouteResult(BaseModel):
    primary: list[str]
    alternate: list[str]
    primary_time: float
    alternate_time: float
    time_saved: float
    congestion_avoided: list[str]


class PredictionResult(BaseModel):
    zone: str
    zone_name: str
    probability: float
    reason: str
    eta_minutes: int


class BeatRushSubmit(BaseModel):
    uid: str
    from_zone: str
    to_zone: str
    followed_route: bool


class PredictionSubmit(BaseModel):
    uid: str
    predicted_zone: str


class LeaderboardEntry(BaseModel):
    uid: str
    displayName: str
    points: int
    gamesPlayed: int
    predictionsCorrect: int
