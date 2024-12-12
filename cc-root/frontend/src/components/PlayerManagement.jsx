import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchPlayers, addPlayer, deletePlayer } from '../services/api';

const PlayerManagement = ({ open, onClose }) => {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState({ name: '' });

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const fetchedPlayers = await fetchPlayers();
        setPlayers(fetchedPlayers);
      } catch (error) {
        console.error('Failed to fetch players', error);
      }
    };
    if (open) {
      loadPlayers();
    }
  }, [open]);

  const handleAddPlayer = async () => {
    try {
      const addedPlayer = await addPlayer(newPlayer);
      setPlayers([...players, addedPlayer]);
      setNewPlayer({ name: '' });
    } catch (error) {
      console.error('Failed to add player', error);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    try {
      await deletePlayer(playerId);
      setPlayers(players.filter(player => player.id !== playerId));
    } catch (error) {
      console.error('Failed to delete player', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Player Management</DialogTitle>
      <DialogContent>
        <div style={{ display: 'flex', marginBottom: '16px' }}>
          <TextField
            label="Player Name"
            value={newPlayer.name}
            onChange={(e) => setNewPlayer({ name: e.target.value })}
            style={{ marginRight: '16px', flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleAddPlayer}
            disabled={!newPlayer.name}
          >
            Add Player
          </Button>
        </div>
        <List>
          {players.map((player) => (
            <ListItem
              key={player.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={() => handleDeletePlayer(player.id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={player.name}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlayerManagement;