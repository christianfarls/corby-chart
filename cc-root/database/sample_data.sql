-- Insert sample players
INSERT INTO players (name, email) VALUES
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com'),
    ('Bob Wilson', 'bob@example.com'),
    ('Alice Brown', 'alice@example.com')
ON CONFLICT (email) DO NOTHING;

-- Insert sample game results
WITH sample_games AS (
    SELECT 
        p1.id as winner_id,
        p2.id as loser_id,
        gt.id as game_type_id,
        CURRENT_TIMESTAMP - (random() * interval '30 days') as played_at
    FROM 
        players p1
        CROSS JOIN players p2
        CROSS JOIN game_types gt
    WHERE 
        p1.id != p2.id
    LIMIT 20
)
INSERT INTO game_results (winner_id, loser_id, game_type_id, played_at)
SELECT winner_id, loser_id, game_type_id, played_at
FROM sample_games;