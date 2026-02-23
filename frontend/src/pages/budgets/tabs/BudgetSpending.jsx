import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Grid, Card, CardContent } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const fmt = (v) => typeof v === 'number' ? `R ${v.toLocaleString()}` : v || 'N/A';

const BudgetSpending = ({ budgetId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budgetId) loadData();
  }, [budgetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/budgets/${budgetId}/spending`);
      setData(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading spending:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!data) return <Paper sx={{ p: 3 }}><Typography>No spending data available</Typography></Paper>;

  const utilization = parseFloat(data.utilizationRate || 0);
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Budget</Typography><Typography variant="h6">{fmt(data.totalBudget)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Spent</Typography><Typography variant="h6">{fmt(data.totalSpent)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Remaining</Typography><Typography variant="h6">{fmt(data.remaining)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Utilization</Typography><Typography variant="h6">{utilization}%</Typography><LinearProgress variant="determinate" value={Math.min(utilization, 100)} sx={{ mt: 1 }} /></CardContent></Card></Grid>
      </Grid>
      <Typography variant="h6" gutterBottom>Spending Items</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">No spending items</TableCell></TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{item.name || 'N/A'}</TableCell>
                  <TableCell>{fmt(item.amount)}</TableCell>
                  <TableCell>{item.status || 'N/A'}</TableCell>
                  <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BudgetSpending;
