import asyncpg
from asyncpg.pool import Pool
from app.core.config import settings

async def get_database_pool() -> Pool:
    if not hasattr(get_database_pool, '_pool'):
        get_database_pool._pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=1,
            max_size=10
        )
    return get_database_pool._pool

async def get_db():
    pool = await get_database_pool()
    async with pool.acquire() as connection:
        yield connection