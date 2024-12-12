from fastapi import APIRouter, Depends, HTTPException, Query
from asyncpg import Connection
from asyncpg.pool import Pool
from app.core.database import get_db
from app.api.models import (
    GameCreate, PlayerCreate, PlayerResponse, 
    GameTypeStats, RecentGame, GameType, PlayerGameStats
)
from typing import List
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.post("/players")
async def create_player(player: PlayerCreate, db: Pool = Depends(get_db)):
    query = """
        INSERT INTO players (name)
        VALUES ($1)
        RETURNING id
    """
    try:
        player_id = await db.fetchval(query, player.name)
        return {"id": player_id, "message": "Player created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/players", response_model=List[PlayerResponse])
async def get_players(db: Pool = Depends(get_db)):
    query = """
    SELECT 
        p.id,
        p.name,
        COUNT(CASE WHEN gr.winner_id = p.id THEN 1 END) as games_won,
        COUNT(CASE WHEN gr.winner_id = p.id OR gr.loser_id = p.id THEN 1 END) as games_played,
        CASE 
            WHEN COUNT(CASE WHEN gr.winner_id = p.id OR gr.loser_id = p.id THEN 1 END) > 0 
            THEN ROUND(
                CAST(
                    (COUNT(CASE WHEN gr.winner_id = p.id THEN 1 END)::numeric / 
                    NULLIF(COUNT(CASE WHEN gr.winner_id = p.id OR gr.loser_id = p.id THEN 1 END), 0)::numeric * 100
                ) as numeric
                ), 2)
            ELSE 0
        END as win_percentage,
        COALESCE(SUM(CASE WHEN gr.winner_id = p.id THEN 10 ELSE 0 END), 0) as score
    FROM players p
    LEFT JOIN game_results gr ON p.id = gr.winner_id OR p.id = gr.loser_id
    GROUP BY p.id, p.name
    ORDER BY name
    """
    try:
        results = await db.fetch(query)
        return [dict(row) for row in results]
    except Exception as e:
        print(f"Error fetching players: {e}")
        raise HTTPException(status_code=500, detail="Error fetching players")

@router.get("/stats/players")
async def get_player_stats(db: Pool = Depends(get_db)):
    try:
        query = """
        SELECT 
            p.id,
            p.name,
            COALESCE(COUNT(CASE WHEN gr.winner_id = p.id THEN 1 END), 0) as games_won,
            COALESCE(COUNT(CASE WHEN gr.winner_id = p.id OR gr.loser_id = p.id THEN 1 END), 0) as games_played,
            CASE 
                WHEN COUNT(CASE WHEN gr.winner_id = p.id OR gr.loser_id = p.id THEN 1 END) > 0 
                THEN ROUND(
                    (COUNT(CASE WHEN gr.winner_id = p.id THEN 1 END)::numeric / 
                    NULLIF(COUNT(CASE WHEN gr.winner_id = p.id OR gr.loser_id = p.id THEN 1 END), 0)::numeric * 100)::numeric, 
                    2
                )
                ELSE 0
            END as win_percentage,
            COALESCE(SUM(CASE WHEN gr.winner_id = p.id THEN 10 ELSE 0 END), 0) as score
        FROM 
            players p
        LEFT JOIN 
            game_results gr ON p.id = gr.winner_id OR p.id = gr.loser_id
        GROUP BY 
            p.id, p.name
        ORDER BY 
            score DESC NULLS LAST,
            win_percentage DESC,
            name ASC
        """
        results = await db.fetch(query)
        return [dict(row) for row in results]
    except Exception as e:
        print(f"Error in get_player_stats: {str(e)}")  # Add debugging
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/games", response_model=List[GameTypeStats])
async def get_game_stats(db: Pool = Depends(get_db)):
    try:
        query = """
        SELECT 
            gt.id,
            gt.name,
            COALESCE(COUNT(gr.id), 0) as total_games,
            COALESCE(COUNT(DISTINCT 
                CASE 
                    WHEN gr.winner_id IS NOT NULL OR gr.loser_id IS NOT NULL 
                    THEN COALESCE(gr.winner_id, gr.loser_id) 
                END
            ), 0) as unique_players,
            MAX(gr.played_at) as last_played
        FROM 
            game_types gt
        LEFT JOIN 
            game_results gr ON gt.id = gr.game_type_id
        GROUP BY 
            gt.id, gt.name
        ORDER BY 
            COUNT(gr.id) DESC NULLS LAST,
            gt.name ASC
        """
        results = await db.fetch(query)
        return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/games/recent", response_model=List[RecentGame])
async def get_recent_games(
    limit: int = 5,
    db: Pool = Depends(get_db)
):
    try:
        query = """
        SELECT 
            gr.id as game_id,
            gr.played_at,
            gt.name as game_type,
            w.name as winner_name,
            l.name as loser_name
        FROM 
            game_results gr
        JOIN 
            game_types gt ON gr.game_type_id = gt.id
        JOIN 
            players w ON gr.winner_id = w.id
        JOIN 
            players l ON gr.loser_id = l.id
        ORDER BY 
            gr.played_at DESC
        LIMIT $1
        """
        results = await db.fetch(query, limit)
        return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/games")
async def create_game(game: GameCreate, db: Connection = Depends(get_db)):
    try:
        # Use a transaction for atomicity
        async with db.transaction():
            # First verify the game type exists
            game_type_check = "SELECT id FROM game_types WHERE name = $1"
            game_type_id = await db.fetchval(game_type_check, game.game_type)
            if not game_type_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"Game type '{game.game_type}' not found"
                )

            # Then verify both players exist
            player_check = "SELECT COUNT(*) FROM players WHERE id IN ($1, $2)"
            player_count = await db.fetchval(player_check, game.winner_id, game.loser_id)
            if player_count != 2:
                raise HTTPException(
                    status_code=400,
                    detail="One or both players not found"
                )

            # Create the game
            query = """
            INSERT INTO game_results (winner_id, loser_id, game_type_id, played_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """
            game_id = await db.fetchval(
                query,
                game.winner_id,
                game.loser_id,
                game_type_id,
                game.played_at or datetime.now()
            )
            
            return {
                "id": game_id,
                "message": "Game recorded successfully"
            }

    except Exception as e:
        print(f"Error creating game: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating game: {str(e)}"
        )