import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const fmt = (v) => typeof v === 'number' ? `R ${v.toLocaleString()}` : v || 'N/A';

const BudgetTransfers = ({ budgetId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budgetId) loadData();
  }, [budgetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/budgets/${budgetId}/transfers`);
      const result = response.data.data || response.data;
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Budget Transfers</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No transfers recorded</TableCell></TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{item.fromBudget || item.from || 'N/A'}</TableCell>
                  <TableCell>{item.toBudget || item.to || 'N/A'}</TableCell>
                  <TableCell>{fmt(item.amount)}</TableCell>
                  <TableCell><Chip label={item.status || 'pending'} size="small" color={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'error' : 'warning'} /></TableCell>
                  <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{item.reason || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BudgetTransfers;
