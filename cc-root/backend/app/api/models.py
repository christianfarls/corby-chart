from enum import Enum
from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional

class GameType(str, Enum):
    ROCKET_LEAGUE = "rocket_league"
    COLLEGE_FOOTBALL = "college_football"
    SMASH_BROS = "smash_bros"

class GameCreate(BaseModel):
    winner_id: int
    loser_id: int
    game_type: GameType
    played_at: Optional[datetime] = None

    @validator('loser_id')
    def check_different_players(cls, loser_id, values):
        if 'winner_id' in values and loser_id == values['winner_id']:
            raise ValueError('Winner and loser must be different players')
        return loser_id

class PlayerCreate(BaseModel):
    name: str

class PlayerResponse(BaseModel):
    id: int
    name: str
    win_percentage: float = 0
    score: int = 0
    games_won: int = 0
    games_played: int = 0

class GameTypeStats(BaseModel):
    id: int
    name: str
    total_games: int = 0
    unique_players: int = 0
    last_played: Optional[datetime] = None

class RecentGame(BaseModel):
    game_id: int
    played_at: datetime
    game_type: str
    winner_name: str
    loser_name: str

class PlayerGameStats(BaseModel):
    game_type: str
    wins: int
    losses: int
    total_games: int
    win_percentage: float