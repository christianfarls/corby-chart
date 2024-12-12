CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create game_types table
CREATE TABLE IF NOT EXISTS game_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create game_results table
CREATE TABLE IF NOT EXISTS game_results (
    id SERIAL PRIMARY KEY,
    winner_id INTEGER REFERENCES players(id),
    loser_id INTEGER REFERENCES players(id),
    game_type_id INTEGER REFERENCES game_types(id),
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_players CHECK (winner_id != loser_id)
);

-- Create indexes
CREATE INDEX idx_game_results_winner ON game_results(winner_id);
CREATE INDEX idx_game_results_loser ON game_results(loser_id);
CREATE INDEX idx_game_results_type ON game_results(game_type_id);
CREATE INDEX idx_game_results_played_at ON game_results(played_at);

-- Insert default game types
INSERT INTO game_types (name, description) VALUES
    ('rocket_league', 'Rocket League'),
    ('college_football', 'College Football 25'),
    ('smash_bros', 'Super Smash Bros')
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();