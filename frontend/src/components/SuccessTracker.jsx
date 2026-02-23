import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Button,
  Divider
} from '@mui/material';
import {
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import api from '../services/api';

/**
 * Success Tracker - Gamification & Motivation
 * 
 * Celebrates wins, tracks progress, and makes users feel accomplished.
 * Builds emotional connection and habit formation.
 */
const SuccessTracker = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentWins, setRecentWins] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get(`/users/${userId}/stats`);
        const data = response.data?.data || response.data;
        setStats(data);
        setRecentWins(data.recentWins || []);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setStats(null);
        setRecentWins([]);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId]);

  const handleShare = () => {
    alert('🎉 Your success has been shared with the team!');
  };

  if (!stats) {
    return <LinearProgress />;
  }

  const progressPercent = (stats.xp / stats.xpToNext) * 100;

  return (
    <Box>
      {/* Level & Progress */}
      <Paper sx={{ 
        p: 3, 
        mb: 2,
        background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '2rem',
                fontWeight: 600
              }}
            >
              {stats.level}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Level {stats.level}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Master Key Account Manager
              </Typography>
            </Box>
          </Box>
          
          {/* Streak */}
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <FireIcon sx={{ color: '#ff9800', fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.streak}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              day streak
            </Typography>
          </Box>
        </Box>

        {/* XP Progress */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {stats.xp} / {stats.xpToNext} XP
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {Math.round(progressPercent)}% to Level {stats.level + 1}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressPercent}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#ffd700',
                borderRadius: 5
              }
            }}
          />
        </Box>
      </Paper>

      {/* Stats Grid */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          📊 Your Impact
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#eff6ff', borderRadius: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#6D28D9' }}>
              {stats.totalActions}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Actions
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#eff6ff', borderRadius: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#6D28D9' }}>
              {stats.successRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Success Rate
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#ecfdf5', borderRadius: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#059669' }}>
              {stats.aiSuggestionsApplied}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              AI Suggestions Used
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#e65100' }}>
              R{(stats.impactGenerated / 1000).toFixed(0)}k
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Revenue Impact
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Badges */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            🏆 Achievements
          </Typography>
          <Chip 
            label={`${stats.badges.filter(b => b.unlocked).length}/${stats.badges.length}`}
            size="small"
            color="primary"
          />
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
          {(stats?.badges || []).map((badge) => (
            <Paper
              key={badge.id}
              sx={{
                p: 1.5,
                opacity: badge.unlocked ? 1 : 0.4,
                bgcolor: badge.unlocked ? '#f5f5f5' : '#fafafa',
                border: badge.unlocked ? '2px solid #ffd700' : '1px solid #e0e0e0',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: badge.unlocked ? 'scale(1.05)' : 'none'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h5">{badge.icon}</Typography>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {badge.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {badge.description}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* Recent Wins */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          🎉 Recent Wins
        </Typography>
        
        {recentWins.map((win, index) => (
          <Box key={index}>
            <Box sx={{ py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <StarIcon sx={{ color: '#ffd700', fontSize: 20 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {win.text}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, pl: 3 }}>
                <Chip 
                  label={win.time}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
                <Chip 
                  label={win.impact === 'high' ? 'High Impact' : 'Medium Impact'}
                  size="small"
                  color={win.impact === 'high' ? 'success' : 'info'}
                  sx={{ fontSize: '0.7rem' }}
                />
              </Box>
            </Box>
            {index < recentWins.length - 1 && <Divider />}
          </Box>
        ))}

        <Button
          fullWidth
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={handleShare}
          sx={{ mt: 2 }}
        >
          Share Your Success
        </Button>
      </Paper>

      {/* Motivational Message */}
      <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100', mb: 0.5 }}>
          🌟 You're doing great!
        </Typography>
        <Typography variant="caption" sx={{ color: '#e65100' }}>
          You're in the top 15% of users. Keep up the momentum - you're just 550 XP away from Level 13!
        </Typography>
      </Box>

      {/* Next Goal */}
      <Paper sx={{ p: 2, mt: 2, bgcolor: '#e8f5e9', border: '2px dashed #4caf50' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32', mb: 1 }}>
          🎯 Next Goal
        </Typography>
        <Typography variant="body2" sx={{ color: '#2e7d32', mb: 1 }}>
          Unlock "Streak Master" badge
        </Typography>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#2e7d32' }}>
              {stats.streak} / 30 days
            </Typography>
            <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
              {Math.round((stats.streak / 30) * 100)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(stats.streak / 30) * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(46, 125, 50, 0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#4caf50'
              }
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default SuccessTracker;
