import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import apiClient from '../../../services/api/apiClient';

const BudgetAllocations = ({ budgetId }) => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllocations();
  }, [budgetId]);

  const loadAllocations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/budgets/${budgetId}/allocations`);
      setAllocations(response.data.data || []);
    } catch (error) {
      console.error('Error loading allocations:', error);
      toast.error('Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Budget Allocations</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Promotion</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allocations.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No allocations yet</TableCell></TableRow>
            ) : (
              allocations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{item.type}</TableCell>
                  <TableCell align="right">R {(item.amount || 0).toLocaleString()}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{item.status}</TableCell>
                  <TableCell>{item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BudgetAllocations;
