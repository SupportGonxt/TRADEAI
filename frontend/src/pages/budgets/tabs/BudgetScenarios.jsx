import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const fmt = (v) => typeof v === 'number' ? `R ${v.toLocaleString()}` : v || 'N/A';

const BudgetScenarios = ({ budgetId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budgetId) loadData();
  }, [budgetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/budgets/${budgetId}/scenarios`);
      const result = response.data.data || response.data;
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Budget Scenarios</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Scenario</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Impact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No scenarios created</TableCell></TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{item.name || item.scenario || 'N/A'}</TableCell>
                  <TableCell>{fmt(item.amount || item.budgetAmount)}</TableCell>
                  <TableCell>{item.impact || item.expectedImpact || 'N/A'}</TableCell>
                  <TableCell><Chip label={item.status || 'draft'} size="small" variant="outlined" /></TableCell>
                  <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BudgetScenarios;
