import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Grid, Card, CardContent } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const fmt = (v) => typeof v === 'number' ? `R ${v.toLocaleString()}` : v || 'N/A';
const pct = (v) => typeof v === 'number' ? `${v.toFixed(1)}%` : v || 'N/A';

const CampaignPerformance = ({ campaignId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaignId) loadData();
  }, [campaignId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/campaigns/${campaignId}/performance`);
      setData(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!data) return <Paper sx={{ p: 3 }}><Typography>No performance data available</Typography></Paper>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Campaign Performance</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Budget</Typography><Typography variant="h6">{fmt(data.budgetAmount)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Spent</Typography><Typography variant="h6">{fmt(data.spentAmount)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">ROI</Typography><Typography variant="h6">{pct(parseFloat(data.roi || 0))}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Target Revenue</Typography><Typography variant="h6">{fmt(data.targetRevenue)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Actual Revenue</Typography><Typography variant="h6">{fmt(data.actualRevenue)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Volume Achievement</Typography><Typography variant="h6">{data.targetVolume && data.actualVolume ? `${data.actualVolume} / ${data.targetVolume}` : 'N/A'}</Typography></CardContent></Card></Grid>
      </Grid>
    </Box>
  );
};

export default CampaignPerformance;
