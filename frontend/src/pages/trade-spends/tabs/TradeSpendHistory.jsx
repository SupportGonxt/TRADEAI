import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const TradeSpendHistory = ({ tradeSpendId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tradeSpendId) loadData();
  }, [tradeSpendId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/trade-spends/${tradeSpendId}/history`);
      const result = response.data.data || response.data;
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Change History</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">No history records</TableCell></TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{item.date || item.timestamp ? new Date(item.date || item.timestamp).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{item.userName || item.user || 'System'}</TableCell>
                  <TableCell><Chip label={item.action || item.type || 'update'} size="small" variant="outlined" /></TableCell>
                  <TableCell>{item.details || item.description || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TradeSpendHistory;
