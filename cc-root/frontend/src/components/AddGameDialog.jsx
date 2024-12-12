import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Define game types to match backend enum
const GAME_TYPES = {
  ROCKET_LEAGUE: "rocket_league",
  COLLEGE_FOOTBALL: "college_football",
  SMASH_BROS: "smash_bros"
};

const formatGameType = (type) => {
  return type.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const AddGameDialog = ({ onGameAdded }) => {
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [formData, setFormData] = useState({
    winner_id: '',
    loser_id: '',
    game_type: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPlayers();
    }
  }, [open]);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data);
    } catch (err) {
      setError('Failed to load players');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const gameData = {
        winner_id: parseInt(formData.winner_id),
        loser_id: parseInt(formData.loser_id),
        game_type: formData.game_type,
        played_at: new Date().toISOString()
      };

      console.log('Submitting game data:', gameData);

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData); // Add this debug log
        throw new Error(errorData.detail || 'Failed to record game');
      }

      await response.json();
      setFormData({
        winner_id: '',
        loser_id: '',
        game_type: ''
      });
      setOpen(false);
      onGameAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{ ml: 2 }}
      >
        Record Game
      </Button>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Record New Game</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Game Type</InputLabel>
                <Select
                  name="game_type"
                  value={formData.game_type}
                  label="Game Type"
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  {Object.entries(GAME_TYPES).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {formatGameType(value)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Winner</InputLabel>
                <Select
                  name="winner_id"
                  value={formData.winner_id}
                  label="Winner"
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  {players.map((player) => (
                    <MenuItem 
                      key={player.id} 
                      value={player.id}
                      disabled={player.id === parseInt(formData.loser_id)}
                    >
                      {player.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Loser</InputLabel>
                <Select
                  name="loser_id"
                  value={formData.loser_id}
                  label="Loser"
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  {players.map((player) => (
                    <MenuItem 
                      key={player.id} 
                      value={player.id}
                      disabled={player.id === parseInt(formData.winner_id)}
                    >
                      {player.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || !formData.winner_id || !formData.loser_id || !formData.game_type}
            >
              Record Game
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default AddGameDialog;