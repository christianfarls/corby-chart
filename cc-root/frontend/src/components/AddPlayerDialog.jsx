import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';

const AddPlayerDialog = ({ onPlayerAdded }) => {
  const [open, setOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playerName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create player');
      }

      await response.json();
      setPlayerName('');
      setOpen(false);
      onPlayerAdded(); // Refresh dashboard data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<PersonAddIcon />}
        onClick={() => setOpen(true)}
      >
        Add Player
      </Button>

      <Dialog open={open} onClose={() => !loading && setOpen(false)}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              label="Player Name"
              type="text"
              fullWidth
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
              disabled={loading}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpen(false)} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || !playerName.trim()}
            >
              Add Player
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default AddPlayerDialog;