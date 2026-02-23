import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, Card, CardContent } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const fmt = (v) => typeof v === 'number' ? `R ${v.toLocaleString()}` : v || 'N/A';

const BudgetForecast = ({ budgetId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budgetId) loadData();
  }, [budgetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/budgets/${budgetId}/forecast`);
      setData(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!data) return <Paper sx={{ p: 3 }}><Typography>No forecast data available</Typography></Paper>;

  const months = Array.isArray(data) ? data : (Array.isArray(data.months || data.forecast) ? (data.months || data.forecast) : []);

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Projected Spend</Typography><Typography variant="h6">{fmt(Array.isArray(data) ? months.reduce((s,m) => s + (m.planned || 0), 0) : (data.projectedSpend || data.totalProjected))}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Actual Spend</Typography><Typography variant="h6">{fmt(Array.isArray(data) ? months.reduce((s,m) => s + (m.actual || 0), 0) : (data.actualSpend || 0))}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Variance</Typography><Typography variant="h6">{fmt(Array.isArray(data) ? months.reduce((s,m) => s + (m.variance || 0), 0) : (data.variance || 0))}</Typography></CardContent></Card></Grid>
      </Grid>
      <Typography variant="h6" gutterBottom>Monthly Forecast</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell>Projected</TableCell>
              <TableCell>Actual</TableCell>
              <TableCell>Variance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {months.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">No forecast data</TableCell></TableRow>
            ) : (
              months.map((item, index) => (
                <TableRow key={item.month || index}>
                  <TableCell>{item.month || item.period || `Month ${index + 1}`}</TableCell>
                  <TableCell>{fmt(item.planned || item.projected || item.forecast)}</TableCell>
                  <TableCell>{fmt(item.actual)}</TableCell>
                  <TableCell>{fmt(item.variance)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BudgetForecast;
