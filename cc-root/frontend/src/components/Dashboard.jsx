import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  SportsEsports as GamesIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import AddPlayerDialog from './AddPlayerDialog'
import AddGameDialog from './AddGameDialog';

const StatCard = ({ title, value, icon: Icon, description }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography color="textSecondary" variant="h6">
          {title}
        </Typography>
        <Icon color="primary" />
      </Box>
      <Typography variant="h4" component="div" gutterBottom>
        {value}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: '16px' }}>
    {value === index && children}
  </div>
);

const Dashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    players: [],
    gameStats: [],
    recentGames: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [players, gameStats, recentGames] = await Promise.all([
        fetch('/api/stats/players').then(res => res.json()),
        fetch('/api/stats/games').then(res => res.json()),
        fetch('/api/games/recent?limit=5').then(res => res.json())
      ]);
      setStats({ players, gameStats, recentGames });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Move handlePlayerAdded inside the component
  const handlePlayerAdded = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getPlayerStatus = (winPercentage) => {
    if (winPercentage > 70) return { label: "GOATED", color: "success" };
    if (winPercentage > 50) return { label: "WINNING", color: "primary" };
    if (winPercentage > 30) return { label: "MID", color: "default" };
    return { label: "L", color: "error" };
  };  


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error loading dashboard: {error}</Alert>;
  }

  return (
    <Box sx={{ flexGrow: 1, gap: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <AddPlayerDialog onPlayerAdded={handlePlayerAdded} />
            <AddGameDialog onGameAdded={handlePlayerAdded} />
        </Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Players"
            value={stats.players.length}
            icon={PeopleIcon}
            description="Active players in the system"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Games"
            value={stats.gameStats.reduce((acc, curr) => acc + curr.total_games, 0)}
            icon={GamesIcon}
            description="Games played across all types"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Most Popular Game"
            value={stats.gameStats[0]?.name || "N/A"}
            icon={TrophyIcon}
            description={`${stats.gameStats[0]?.total_games || 0} games played`}
          />
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Overview" />
          <Tab label="Recent Activity" />
          <Tab label="Game Stats" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell align="right">Win Rate</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.players.slice(0, 10).map((player, index) => {
                  const { label, color } = getPlayerStatus(player.win_percentage);
                  return (
                  <TableRow key={player.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {player.name.charAt(0).toUpperCase()}
                        </Avatar>
                        {player.name}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{player.win_percentage}%</TableCell>
                    <TableCell align="right">{player.score}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        size="small"
                        color={color}
                        label={label}
                      />
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Recent Activity Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box p={2}>
            {stats.recentGames.map((game, index) => (
              <Box key={game.game_id}>
                <Box display="flex" alignItems="center" py={2}>
                  <TimelineIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="body1">
                      <strong>{game.winner_name}</strong> won against <strong>{game.loser_name}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {game.game_type} • {new Date(game.played_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                {index < stats.recentGames.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
        </TabPanel>

        {/* Game Stats Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3} sx={{ p: 2 }}>
            {stats.gameStats.map(stat => (
              <Grid item xs={12} md={6} key={stat.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {stat.name}
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="textSecondary">Total Games</Typography>
                        <Typography>{stat.total_games}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="textSecondary">Unique Players</Typography>
                        <Typography>{stat.unique_players}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="textSecondary">Last Played</Typography>
                        <Typography>{new Date(stat.last_played).toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Dashboard;