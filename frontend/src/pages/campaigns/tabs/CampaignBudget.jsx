import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const fmt = (v) => typeof v === 'number' ? `R ${v.toLocaleString()}` : v || 'N/A';

const CampaignBudget = ({ campaignId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaignId) loadData();
  }, [campaignId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/campaigns/${campaignId}/budget`);
      setData(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading budget:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!data) return <Paper sx={{ p: 3 }}><Typography>No budget data available</Typography></Paper>;

  const spent = data.spentAmount || data.spentBudget || 0;
  const remaining = data.remaining || data.remainingBudget || 0;
  const utilization = data.totalBudget > 0 ? (spent / data.totalBudget) * 100 : 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Campaign Budget</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Budget</Typography><Typography variant="h6">{fmt(data.totalBudget)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Allocated</Typography><Typography variant="h6">{fmt(data.allocatedBudget || data.totalBudget)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Spent</Typography><Typography variant="h6">{fmt(spent)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Remaining</Typography><Typography variant="h6">{fmt(remaining)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12}><Card><CardContent><Typography variant="body2" color="text.secondary">Budget Utilization</Typography><Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}><LinearProgress variant="determinate" value={Math.min(utilization, 100)} sx={{ flex: 1, mr: 2 }} /><Typography variant="body2">{utilization.toFixed(1)}%</Typography></Box></CardContent></Card></Grid>
      </Grid>
    </Box>
  );
};

export default CampaignBudget;
