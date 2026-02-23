import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Grid, Card, CardContent } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const fmt = (v) => typeof v === 'number' ? `R ${v.toLocaleString()}` : v || 'N/A';
const pct = (v) => typeof v === 'number' ? `${v.toFixed(1)}%` : v || 'N/A';

const TradeSpendPerformance = ({ tradeSpendId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tradeSpendId) loadData();
  }, [tradeSpendId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/trade-spends/${tradeSpendId}/performance`);
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
      <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Amount</Typography><Typography variant="h6">{fmt(data.amount)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">ROI</Typography><Typography variant="h6">{pct(data.roi)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Uplift</Typography><Typography variant="h6">{pct(data.uplift)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Incremental Revenue</Typography><Typography variant="h6">{fmt(data.incrementalRevenue)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Status</Typography><Typography variant="h6">{data.status || 'N/A'}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Effectiveness</Typography><Typography variant="h6">{data.effectiveness || data.effectivenessScore || 'N/A'}</Typography></CardContent></Card></Grid>
      </Grid>
    </Box>
  );
};

export default TradeSpendPerformance;
