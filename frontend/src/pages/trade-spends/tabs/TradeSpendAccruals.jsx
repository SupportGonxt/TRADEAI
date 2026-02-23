import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const fmt = (v) => typeof v === 'number' ? `R ${v.toLocaleString()}` : v || 'N/A';

const TradeSpendAccruals = ({ tradeSpendId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tradeSpendId) loadData();
  }, [tradeSpendId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/trade-spends/${tradeSpendId}/accruals`);
      const result = response.data.data || response.data;
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading accruals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Accruals</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Period</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>GL Account</TableCell>
              <TableCell>Posted Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No accrual records</TableCell></TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{item.period || item.month || 'N/A'}</TableCell>
                  <TableCell>{fmt(item.amount)}</TableCell>
                  <TableCell><Chip label={item.status || 'pending'} size="small" color={item.status === 'posted' ? 'success' : 'warning'} /></TableCell>
                  <TableCell>{item.glAccount || item.accountCode || 'N/A'}</TableCell>
                  <TableCell>{item.postedDate ? new Date(item.postedDate).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TradeSpendAccruals;
